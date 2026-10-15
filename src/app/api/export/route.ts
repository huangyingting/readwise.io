import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getOrCreateActiveUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_EXPORT_TEMPLATE } from '@/lib/default-data';
import { renderJinjaTemplate } from '@/lib/jinja-engine';

export const dynamic = 'force-dynamic';

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = await getOrCreateActiveUser(session?.user?.email);
    const format = req.nextUrl.searchParams.get('format') || 'csv';
    const documentId = req.nextUrl.searchParams.get('documentId');

    if (format === 'markdown' && documentId) {
      const doc = await prisma.document.findFirst({
        where: { id: documentId, userId: user.id },
        include: { annotations: { orderBy: { createdAt: 'asc' } } },
      });
      if (!doc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      const settings = safeParseJson<any>(user.settingsJson, {});
      const template = settings.exportTemplate || DEFAULT_EXPORT_TEMPLATE;

      const md = renderJinjaTemplate(template, {
        document: {
          title: doc.title,
          author: doc.author,
          domain: doc.domain,
          url: doc.url,
          category: doc.category,
          content: doc.summary,
          html: doc.htmlContent,
          document_note: doc.documentNote,
          saved_at: doc.savedAt.toISOString().split('T')[0],
        },
        highlights: doc.annotations.map((a) => ({
          text: a.selectedText,
          note: a.note,
          tags: safeParseJson<string[]>(a.tagsJson, []).join(', '),
        })),
      });

      return new NextResponse(md, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${doc.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-annotations.md"`,
        },
      });
    }

    if (format === 'opml') {
      const feeds = await prisma.rssFeed.findMany({ where: { userId: user.id } });
      const outlines = feeds
        .map(
          (f) =>
            `    <outline type="rss" text="${f.title.replace(/"/g, '&quot;')}" title="${f.title.replace(/"/g, '&quot;')}" xmlUrl="${f.url}" htmlUrl="${f.siteUrl}" />`
        )
        .join('\n');
      const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Readwise Reader Feeds Export</title>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
      return new NextResponse(opml, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Content-Disposition': 'attachment; filename="readwise-reader-feeds.opml"',
        },
      });
    }

    // Default: Export Library as CSV
    const docs = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: 'desc' },
    });

    const header = 'ID,Title,Author,URL,Category,Location,WordCount,ReadingProgress,SavedAt,Tags\n';
    const rows = docs
      .map((d) => {
        const tags = safeParseJson<string[]>(d.tagsJson, []).join(';');
        const esc = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
        return [
          esc(d.id),
          esc(d.title),
          esc(d.author),
          esc(d.url),
          esc(d.category),
          esc(d.triageStatus),
          d.wordCount,
          d.readingProgress,
          d.savedAt.toISOString(),
          esc(tags),
        ].join(',');
      })
      .join('\n');

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="readwise-reader-library.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
