import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getOrCreateActiveUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeGhostreaderPrompt, renderJinjaTemplate } from '@/lib/jinja-engine';

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = await getOrCreateActiveUser(session?.user?.email);
    const body = await req.json();

    const {
      mode = 'ask_library',
      threadId,
      documentId,
      actionKey,
      question = '',
      selectionText = '',
      selectionContext = '',
      customTemplate,
    } = body;

    // 1. Document / Selection Jinja2 Prompt Execution
    if (mode === 'prompt') {
      const doc = documentId
        ? await prisma.document.findFirst({
            where: { id: documentId, userId: user.id },
            include: { annotations: true },
          })
        : await prisma.document.findFirst({
            where: { userId: user.id },
            include: { annotations: true },
          });

      if (!doc) {
        return NextResponse.json({ error: 'No document found' }, { status: 404 });
      }

      const promptRecord = actionKey
        ? await prisma.ghostreaderPrompt.findUnique({
            where: { userId_actionKey: { userId: user.id, actionKey } },
          })
        : null;

      const tags = await prisma.tag.findMany({ where: { userId: user.id } });

      const templateToRender =
        customTemplate ||
        promptRecord?.template ||
        `Summarize "{{ document.title }}" by {{ document.author }}:\n\n{{ document.content | central_sentences }}`;

      const ctx = {
        document: {
          title: doc.title,
          author: doc.author,
          domain: doc.domain,
          url: doc.url,
          category: doc.category,
          content: doc.summary + '\n\n' + doc.htmlContent.replace(/<[^>]+>/g, ' '),
          html: doc.htmlContent,
          document_note: doc.documentNote,
          saved_at: doc.savedAt.toISOString(),
        },
        selection: {
          text: selectionText || doc.summary.slice(0, 120),
          context: selectionContext || doc.summary,
        },
        user: {
          tags: tags.map((t) => t.name),
        },
      };

      const renderedPrompt = renderJinjaTemplate(templateToRender, ctx);
      let answer = executeGhostreaderPrompt(
        actionKey || 'ASK_DOCUMENT',
        renderedPrompt,
        ctx,
        question
      );

      // Optional Live OpenAI / Compatible LLM execution when OPENAI_API_KEY is configured
      const apiKey = body.apiKey || process.env.OPENAI_API_KEY;
      if (apiKey) {
        try {
          const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content:
                    'You are Ghostreader, Readwise Reader’s built-in reading copilot. Respond concisely with high-signal insights.',
                },
                {
                  role: 'user',
                  content: question ? `${renderedPrompt}\n\nQuestion: ${question}` : renderedPrompt,
                },
              ],
              temperature: 0.4,
            }),
          });
          if (llmRes.ok) {
            const llmData = await llmRes.json();
            const content = llmData.choices?.[0]?.message?.content;
            if (content) answer = content;
          }
        } catch {
          // Fallback to deterministic local Jinja2 synthesis
        }
      }

      // If SUMMARIZE_DOCUMENT, also persist generatedSummary
      if (actionKey === 'SUMMARIZE_DOCUMENT' && documentId) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { generatedSummary: answer.replace(/\*\*.*?\*\*\n\n/, '') },
        });
      }

      return NextResponse.json({
        ok: true,
        actionKey: actionKey || 'ASK_DOCUMENT',
        promptTitle: promptRecord?.title || '👻 Ghostreader',
        renderedPrompt,
        response: answer,
      });
    }

    // 2. Global Library Chat (/ghostreader) or Document Chat tab
    const docs = await prisma.document.findMany({
      where: { userId: user.id, triageStatus: { not: 'trash' } },
      include: { annotations: true },
      orderBy: { savedAt: 'desc' },
    });

    const qLower = question.toLowerCase();
    const matchedDocs = docs.filter(
      (d) =>
        d.title.toLowerCase().includes(qLower) ||
        d.summary.toLowerCase().includes(qLower) ||
        d.author.toLowerCase().includes(qLower) ||
        d.category.toLowerCase().includes(qLower)
    );
    const citedDocs = (matchedDocs.length > 0 ? matchedDocs : docs).slice(0, 3);

    let assistantReply = '';
    if (mode === 'recommend_library') {
      const unread = docs.filter((d) => d.triageStatus === 'new' || d.triageStatus === 'later');
      const picks = (unread.length > 0 ? unread : docs).slice(0, 3);
      assistantReply =
        `Based on your reading queue and recent highlights, here are **${picks.length} recommended reads** tailored to your request (*"${question || 'What should I read next?'}"*):\n\n` +
        picks
          .map(
            (p, idx) =>
              `${idx + 1}. **${p.title}** by *${p.author}* (${p.readingMinutes} min ${p.category.toUpperCase()})\n   - *Why read it now:* ${p.generatedSummary || p.summary}`
          )
          .join('\n\n');
    } else {
      assistantReply =
        `Based on a synthesis of **${citedDocs.length} documents** and your saved highlights in your Readwise Reader library regarding *"${question}"*:\n\n` +
        citedDocs
          .map(
            (d, idx) =>
              `${idx + 1}. **${d.title}** (*${d.author}*): ${d.generatedSummary || d.summary}`
          )
          .join('\n\n') +
        `\n\n**Key Cross-Document Connection:** Your library emphasizes combining local-first speed (SQLite WASM + RFC 6902 JSON Patch) with active keyboard annotation (\`h\`, \`n\`, \`t\`) and programmable Jinja2 AI synthesis.`;
    }

    const citations = citedDocs.map((d) => ({
      id: d.id,
      title: d.title,
      author: d.author,
      category: d.category,
    }));

    const userMsg = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };
    const assistantMsg = {
      id: `msg-a-${Date.now() + 1}`,
      role: 'assistant',
      content: assistantReply,
      citations,
      createdAt: new Date().toISOString(),
    };

    let thread;
    if (threadId) {
      const existing = await prisma.ghostreaderThread.findFirst({
        where: { id: threadId, userId: user.id },
      });
      if (existing) {
        const msgs = safeParseJson<any[]>(existing.messagesJson, []);
        thread = await prisma.ghostreaderThread.update({
          where: { id: existing.id },
          data: {
            messagesJson: JSON.stringify([...msgs, userMsg, assistantMsg]),
          },
        });
      }
    }

    if (!thread) {
      thread = await prisma.ghostreaderThread.create({
        data: {
          userId: user.id,
          documentId: documentId || null,
          title: question.slice(0, 64) || 'Library Synthesis',
          mode,
          messagesJson: JSON.stringify([userMsg, assistantMsg]),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      thread: {
        id: thread.id,
        documentId: thread.documentId,
        title: thread.title,
        mode: thread.mode,
        messages: safeParseJson<any[]>(thread.messagesJson, []),
        updatedAt: thread.updatedAt.toISOString(),
      },
      latestMessage: assistantMsg,
    });
  } catch (err: any) {
    console.error('POST /api/ghostreader error:', err);
    return NextResponse.json({ error: err.message || 'Ghostreader failed' }, { status: 500 });
  }
}
