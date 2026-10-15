import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveApiUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await resolveApiUser(req);
  const format = req.nextUrl.searchParams.get('format') || 'json';

  const docs = await prisma.document.findMany({
    where: { userId: user.id, triageStatus: { not: 'trash' } },
    include: {
      annotations: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (format === 'obsidian' || format === 'markdown') {
    const sections = docs
      .filter((d) => d.annotations.length > 0 || d.documentNote)
      .map((d) => {
        const docTags = JSON.parse(d.tagsJson || '[]')
          .map((t: string) => `#${t}`)
          .join(' ');
        const lines = [
          `# ${d.title}`,
          ``,
          `- **Author:** ${d.author || d.siteName}`,
          `- **Category:** #${d.category}`,
          `- **URL:** ${d.url}`,
          docTags ? `- **Tags:** ${docTags}` : '',
          d.documentNote ? `- **Document Note:** ${d.documentNote}` : '',
          ``,
          `## Highlights`,
          ...d.annotations.map((a) => {
            const hTags = JSON.parse(a.tagsJson || '[]')
              .map((t: string) => `#${t}`)
              .join(' ');
            return [
              `> ${a.selectedText}`,
              a.note ? `- **Note:** ${a.note}` : '',
              a.flashcardQuestion
                ? `- **Flashcard Q:** ${a.flashcardQuestion}\n- **Flashcard A:** ${a.flashcardAnswer}`
                : '',
              hTags ? `- **Tags:** ${hTags}` : '',
              ``,
            ]
              .filter(Boolean)
              .join('\n');
          }),
          `---`,
          ``,
        ];
        return lines.filter((l) => l !== '').join('\n');
      });

    const markdownBundle =
      `# Readwise Obsidian / Logseq Knowledge Vault Export\nExported at ${new Date().toISOString()}\n\n` +
      sections.join('\n\n');

    return new NextResponse(markdownBundle, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="readwise-obsidian-vault.md"',
      },
    });
  }

  const results = docs.map((d) => ({
    user_book_id: d.id,
    title: d.title,
    author: d.author,
    readable_title: d.title,
    source: d.source,
    cover_image_url: d.imageUrl,
    unique_url: d.url,
    book_tags: JSON.parse(d.tagsJson || '[]'),
    category: d.category,
    document_note: d.documentNote,
    summary: d.summary,
    highlights: d.annotations.map((a) => ({
      id: a.id,
      text: a.selectedText,
      note: a.note,
      color: a.color,
      is_favorite: a.isFavorite,
      is_discard: a.isDiscarded,
      tags: JSON.parse(a.tagsJson || '[]'),
      created_at: a.createdAt.toISOString(),
    })),
  }));

  return NextResponse.json({
    count: results.length,
    nextPageCursor: null,
    results,
  });
}
