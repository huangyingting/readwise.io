import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUrlDocument, htmlFragmentToReaderHtml } from '@/lib/ingestion-engine';
import { resolveApiUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/v3/save?url=... supports 1-click Browser Bookmarklet saving and redirects to the new document in Reader!
export async function GET(req: NextRequest) {
  const user = await resolveApiUser(req);
  const url = req.nextUrl.searchParams.get('url');
  const title = req.nextUrl.searchParams.get('title') || undefined;

  if (!url) {
    return NextResponse.json(
      { error: 'Pass ?url=https://... to save a document to Readwise Reader' },
      { status: 400 }
    );
  }

  const extracted = await extractUrlDocument(url, title);
  const created = await prisma.document.create({
    data: {
      userId: user.id,
      url: extracted.url,
      title: extracted.title,
      author: extracted.author,
      source: 'bookmarklet',
      siteName: extracted.siteName,
      domain: extracted.domain,
      faviconUrl: extracted.faviconUrl,
      imageUrl: extracted.imageUrl,
      category: extracted.category,
      triageStatus: 'new',
      wordCount: extracted.wordCount,
      readingMinutes: extracted.readingMinutes,
      summary: extracted.summary,
      generatedSummary: extracted.generatedSummary,
      publishedDate: extracted.publishedDate,
      htmlContent: extracted.htmlContent,
      ttsJson: extracted.ttsJson,
      transcriptJson: extracted.transcriptJson,
      sourceSpecificJson: extracted.sourceSpecificJson,
    },
  });

  if (req.nextUrl.searchParams.get('redirect') !== 'false') {
    return NextResponse.redirect(new URL(`/new/read/${created.id}`, req.url));
  }

  return NextResponse.json({
    id: created.id,
    url: `/new/read/${created.id}`,
    title: created.title,
  });
}

// POST /api/v3/save — Official Readwise Reader v3 Save API
export async function POST(req: NextRequest) {
  try {
    const user = await resolveApiUser(req);
    const body = await req.json();
    const url = body.url || 'https://example.com/saved';
    const customTitle = body.title;
    const rawHtml = body.html;
    const location = body.location || 'new';
    const tags = Array.isArray(body.tags) ? body.tags : [];

    const extracted = await extractUrlDocument(url, customTitle);
    let htmlContent = extracted.htmlContent;
    let wordCount = extracted.wordCount;
    let readingMinutes = extracted.readingMinutes;

    if (rawHtml && typeof rawHtml === 'string') {
      const parsed = htmlFragmentToReaderHtml(rawHtml, customTitle || extracted.title);
      htmlContent = parsed.htmlContent;
      wordCount = parsed.wordCount;
      readingMinutes = parsed.readingMinutes;
    }

    const created = await prisma.document.create({
      data: {
        userId: user.id,
        url: extracted.url,
        title: customTitle || extracted.title,
        author: body.author || extracted.author,
        source: body.saved_using || 'api_v3',
        siteName: extracted.siteName,
        domain: extracted.domain,
        faviconUrl: extracted.faviconUrl,
        imageUrl: body.image_url || extracted.imageUrl,
        category: body.category || extracted.category,
        triageStatus: ['new', 'later', 'archive', 'feed'].includes(location) ? location : 'new',
        wordCount,
        readingMinutes,
        summary: body.summary || extracted.summary,
        generatedSummary: extracted.generatedSummary,
        documentNote: body.notes || '',
        tagsJson: JSON.stringify(tags),
        publishedDate: extracted.publishedDate,
        htmlContent,
        ttsJson: extracted.ttsJson,
        transcriptJson: extracted.transcriptJson,
        sourceSpecificJson: extracted.sourceSpecificJson,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        url: `/new/read/${created.id}`,
        source_url: created.url,
        title: created.title,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Save failed' }, { status: 400 });
  }
}
