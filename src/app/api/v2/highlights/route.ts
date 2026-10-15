import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveApiUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await resolveApiUser(req);
  const annotations = await prisma.annotation.findMany({
    where: { userId: user.id },
    include: { document: true },
    orderBy: { createdAt: 'desc' },
  });

  const results = annotations.map((a) => ({
    id: a.id,
    text: a.selectedText,
    note: a.note,
    color: a.color,
    is_favorite: a.isFavorite,
    is_discard: a.isDiscarded,
    book_id: a.documentId,
    title: a.document.title,
    author: a.document.author,
    url: a.document.url,
    tags: JSON.parse(a.tagsJson || '[]'),
    highlighted_at: a.createdAt.toISOString(),
    updated: a.updatedAt.toISOString(),
  }));

  return NextResponse.json({
    count: results.length,
    next: null,
    previous: null,
    results,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveApiUser(req);
    const body = await req.json();
    const highlights = Array.isArray(body.highlights) ? body.highlights : [body];

    const createdIds: string[] = [];

    for (const h of highlights) {
      const text = (h.text || '').trim();
      if (!text) continue;
      const title = (h.title || 'Saved Highlights').trim();
      const author = (h.author || 'Readwise API').trim();
      const sourceUrl = h.source_url || h.url || `readwise://api/${encodeURIComponent(title)}`;
      const category = h.category || 'article';

      let doc = await prisma.document.findFirst({
        where: { userId: user.id, title },
      });

      if (!doc) {
        doc = await prisma.document.create({
          data: {
            userId: user.id,
            url: sourceUrl,
            title,
            author,
            source: h.source_type || 'api_v2',
            siteName: 'Readwise API',
            domain: 'api.readwise.io',
            category,
            triageStatus: 'archive',
            wordCount: 250,
            readingMinutes: 2,
            summary: text.slice(0, 240),
            generatedSummary: `Highlights synced via Readwise API v2 for "${title}".`,
            htmlContent: `<h2 id="sec-1">${title}</h2><p data-paragraph-index="0">${text.replace(/</g, '&lt;')}</p>`,
          },
        });
      }

      const ann = await prisma.annotation.create({
        data: {
          userId: user.id,
          documentId: doc.id,
          type: 'highlight',
          paragraphIndex: 0,
          selectedText: text,
          note: h.note || '',
          color: h.color || 'yellow',
          tagsJson: JSON.stringify(h.tags || []),
        },
      });
      createdIds.push(ann.id);
    }

    return NextResponse.json(
      {
        modified_highlights: createdIds,
        count: createdIds.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid payload' }, { status: 400 });
  }
}
