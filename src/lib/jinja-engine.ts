export interface JinjaContext {
  document: {
    title: string;
    author: string;
    domain: string;
    url: string;
    category: string;
    content: string;
    html: string;
    document_note?: string;
    saved_at?: string;
  };
  selection?: {
    text: string;
    context?: string;
    start?: number;
  };
  user?: {
    tags: string[];
  };
  highlights?: Array<{
    text: string;
    note?: string;
    tags?: string;
  }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function renderJinjaTemplate(template: string, ctx: JinjaContext): string {
  let out = template;

  // 1. Strip Jinja comments {# ... #}
  out = out.replace(/\{#-?[\s\S]*?-?#\}/g, '');

  const plainContent = ctx.document.content || stripHtml(ctx.document.html || '');
  const approxTokens = Math.ceil(plainContent.split(/\s+/).length * 1.3);

  // 2. Handle {% if ... %} ... {% elif ... %} ... {% else %} ... {% endif %}
  out = out.replace(
    /\{%-?\s*if\s+([^{%]+?)\s*-?%\}([\s\S]*?)(?:\{%-?\s*elif\s+([^{%]+?)\s*-?%\}([\s\S]*?))?(?:\{%-?\s*else\s*-?%\}([\s\S]*?))?\{%-?\s*endif\s*-?%\}/g,
    (_, cond1, body1, cond2, body2, elseBody) => {
      const evalCond = (c: string) => {
        if (!c) return false;
        if (c.includes('num_tokens')) {
          const m = c.match(/>\s*(\d+)/);
          if (m) return approxTokens > parseInt(m[1], 10);
        }
        if (c.includes('document.document_note')) {
          return Boolean(ctx.document.document_note);
        }
        if (c.includes('h.note')) return true;
        if (c.includes('h.tags')) return true;
        return false;
      };
      if (evalCond(cond1)) return body1;
      if (cond2 && evalCond(cond2)) return body2;
      return elseBody || '';
    }
  );

  // 3. Handle {% for h in highlights %} ... {% endfor %}
  out = out.replace(
    /\{%-?\s*for\s+h\s+in\s+highlights\s*-?%\}([\s\S]*?)\{%-?\s*endfor\s*-?%\}/g,
    (_, loopBody) => {
      const list = ctx.highlights || [];
      if (list.length === 0) return '_No highlights yet._\n';
      return list
        .map((h) => {
          let row = loopBody;
          row = row.replace(/\{\{\s*h\.text\s*\}\}/g, h.text || '');
          row = row.replace(/\{\{\s*h\.note\s*\}\}/g, h.note || '');
          row = row.replace(/\{\{\s*h\.tags\s*\}\}/g, h.tags || '');
          if (!h.note) row = row.replace(/.*\*\s*Note:\s*\*.*\n?/g, '');
          if (!h.tags) row = row.replace(/.*\*\s*Tags:\s*\*.*\n?/g, '');
          return row.trim();
        })
        .join('\n\n');
    }
  );

  // 4. Handle {{ variable | filter1 | filter2 }} expressions
  out = out.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr: string) => {
    const parts = expr.split('|').map((p) => p.trim());
    const baseVar = parts[0];
    const filters = parts.slice(1);

    let val: any = '';
    if (baseVar === 'document.title') val = ctx.document.title;
    else if (baseVar === 'document.author') val = ctx.document.author || 'Unknown Author';
    else if (baseVar === 'document.domain') val = ctx.document.domain || 'web';
    else if (baseVar === 'document.url') val = ctx.document.url;
    else if (baseVar === 'document.category') val = ctx.document.category;
    else if (baseVar === 'document.document_note') val = ctx.document.document_note || '';
    else if (baseVar === 'document.saved_at') val = ctx.document.saved_at || '';
    else if (baseVar === 'document.content' || baseVar === 'document.html') val = plainContent;
    else if (baseVar === 'selection.text') val = ctx.selection?.text || '';
    else if (baseVar === 'selection.context') val = ctx.selection?.context || ctx.selection?.text || plainContent.slice(0, 300);
    else if (baseVar === 'user.tags') val = ctx.user?.tags || [];

    for (const f of filters) {
      if (f === 'num_tokens') {
        val = String(approxTokens);
      } else if (f === 'central_sentences' || f === 'central_paragraphs') {
        const sents = splitSentences(String(val));
        val = sents.slice(0, 8);
      } else if (f.startsWith('lexical_search')) {
        const queryText = (ctx.selection?.text || '').toLowerCase();
        const sents = splitSentences(plainContent);
        const matches = sents.filter((s) => queryText && s.toLowerCase().includes(queryText));
        val = (matches.length > 0 ? matches : sents.slice(0, 3)).join('\n');
      } else if (f.startsWith('join')) {
        if (Array.isArray(val)) {
          val = val.join('\n\n');
        }
      }
    }

    if (Array.isArray(val)) return val.join(', ');
    return String(val ?? '');
  });

  return out.trim();
}

export function executeGhostreaderPrompt(
  actionKey: string,
  renderedPrompt: string,
  ctx: JinjaContext,
  customQuestion?: string
): string {
  const title = ctx.document.title;
  const author = ctx.document.author || 'the author';
  const sel = ctx.selection?.text || '';
  const plain = ctx.document.content || stripHtml(ctx.document.html || '');
  const sentences = splitSentences(plain);

  switch (actionKey) {
    case 'SUMMARIZE_DOCUMENT':
      return (
        `Here is a 3-sentence synthesis of **${title}** by ${author}:\n\n` +
        `1. ${sentences[0] || `This work examines core concepts in ${title}.`}\n` +
        `2. ${sentences[1] || 'It establishes a keyboard-centric, local-first workflow for managing high-signal reading material across formats.'}\n` +
        `3. ${sentences[2] || 'By combining structured highlights, margin notes, and Jinja2 AI templates, readers retain and synthesize significantly more knowledge.'}`
      );
    case 'TAG_DOCUMENT':
      return `Suggested tags based on document taxonomy: \`reverse-engineering\`, \`important-architecture\`, \`ai-agents\``;
    case 'DEFINE_TERM':
      return `**Dictionary Definition — "${sel || 'Local-First'}"**\n\n*noun / technical term*\n1. In the context of *${title}*, "${sel || 'this term'}" refers to a software design and reading paradigm where primary state and comprehension reside directly with the user, enabling immediate latency-free interaction.\n2. **Contextual usage**: Used by ${author} to contrast responsive, keyboard-driven tools against legacy cloud-bound bookmarking queues.`;
    case 'ENCYCLOPEDIA_LOOKUP':
      return `**Encyclopedia Entry — ${sel || title}**\n\nReferenced in *${title}* by ${author}. In computing and cognitive tooling, **${sel || title}** represents a foundational mechanism for transforming raw information streams into structured, queryable knowledge graphs. Key pioneers include Douglas Engelbart, Mortimer Adler, and modern local-first researchers.`;
    case 'INTERNAL_XRAY':
      return `**Internal X-Ray — "${sel || 'Concept'}" in *${title}***\n\n- **First appearance**: Section 1 (${sentences[0]?.slice(0, 110)}...)\n- **Role in argument**: ${author} introduces "${sel || 'this concept'}" as the core bridge between rapid triage and long-term spaced-repetition retention.`;
    case 'SIMPLIFY_SELECTION':
      return `**Plain-English Simplification**\n\nIn simple terms: Instead of waiting on slow servers or juggling scattered tabs, everything you read and highlight is stored right in your browser so you can search, annotate, and undo actions immediately.\n\n*(Simplified from: "${(sel || sentences[0] || '').slice(0, 120)}...")*`;
    case 'TRANSLATE_SELECTION':
      return `**Translation & Cross-Lingual Gloss**\n\n- **English**: "${sel || sentences[0] || title}"\n- **Español**: "Para aprovechar al máximo Reader, recomendamos un flujo de lectura local-first impulsado por el teclado."\n- **中文 (简体)**: "为了充分发挥 Reader 的潜力，我们建议采用以键盘为中心、本地优先（Local-First）的深度阅读工作流。"`;
    case 'HAIKU_SELECTION':
      return `**5-7-5 Haiku**\n\n*Blue margin focus,*\n*Golden highlights in the text,*\n*Thoughts synced into light.*`;
    case 'FLASHCARDS_SELECTION':
    case 'DOCUMENT_FLASHCARDS':
      return `**Spaced-Repetition Flashcards (${title})**\n\n- **Q1:** How does Readwise Reader achieve sub-16ms view transitions and offline support?\n  **A1:** By running SQLite compiled to WebAssembly (\`sql-wasm.wasm\`) backed by IndexedDB chunks and incremental \`/api/state\` delta sync.\n\n- **Q2:** How does the Undo (\`z\`) mechanism work across document mutations?\n  **A2:** Every client mutation emits an RFC 6902 JSON Patch pair (\`forwardPatch\` + \`reversePatch\`), allowing instant state reversal.\n\n- **Q3:** Which keyboard shortcuts control paragraph highlighting and margin notes?\n  **A3:** \`j\` / \`k\` move paragraph focus, \`h\` highlights, \`n\` adds a margin note, and \`t\` tags the highlight.`;
    case 'KEY_TAKEAWAYS':
      return `**Key Takeaways from *${title}***\n\n- **Unified Multi-Format Ingestion**: Web articles, RSS feeds, newsletters, PDFs, EPUBs, and YouTube transcripts live in one triage pipeline.\n- **100% Keyboard Ergonomics**: Navigate with \`j\`/\`k\`, triage with \`e\` (Archive) and \`l\` (Later), and toggle sidebars with \`[\` and \`]\`.\n- **Structured Annotations**: Highlights, inline margin notes, and PDF area snapshots sync automatically to the Notebook for Markdown export.\n- **Programmable Jinja2 AI**: Ghostreader prompts can be inspected and customized with Jinja2 filters like \`central_sentences\` and \`lexical_search\`.`;
    case 'THOUGHT_PROVOKING_QUESTIONS':
      return `**Socratic Discussion Questions for *${title}***\n\n1. How does shifting from passive bookmarking ("saving for later") to active triage and inline margin note-taking change what you actually remember 6 months later?\n2. Where is the boundary between helpful AI synthesis (e.g., Internal X-Ray and Socratic prompts) and cognitive offloading that weakens deep reading?\n3. How can boolean Filtered Views (\`minutes__lt:10\`, \`has:highlights\`) be structured to match your daily energy levels?`;
    case 'ASK_DOCUMENT':
    default: {
      const q = customQuestion || sel || 'What is the core argument of this document?';
      return (
        `**Ghostreader Answer (Grounded in *${title}*)**\n\n` +
        `Regarding *"${q}"*:\n\n` +
        `Based on **${title}** by ${author}, ${sentences[0] || 'the text establishes a unified reading and annotation architecture.'} ` +
        `${sentences[1] ? `Furthermore, ${sentences[1].charAt(0).toLowerCase() + sentences[1].slice(1)}` : ''}\n\n` +
        `> **Cited Passage:** "${(sentences[2] || sentences[0] || plain).slice(0, 180)}"`
      );
    }
  }
}
