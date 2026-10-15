import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveApiUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await resolveApiUser(req);
  const location = req.nextUrl.searchParams.get('location');
  const category = req.nextUrl.searchParams.get('category');
  const withHtml = req.nextUrl.searchParams.get('withHtmlContent') === 'true';

  const where: any = {
    userId: user.id,
    triageStatus: { not: 'trash' },
  };
  if (location) where.triageStatus = location;
  if (category) where.category = category;

  const docs = await prisma.document.findMany({
    where,
    orderBy: { savedAt: 'desc' },
  });

  const results = docs.map((d) => ({
    id: d.id,
    url: `/new/read/${d.id}`,
    source_url: d.url,
    title: d.title,
    author: d.author,
    source: d.source,
    category: d.category,
    location: d.triageStatus,
    tags: JSON.parse(d.tagsJson || '[]'),
    site_name: d.siteName,
    word_count: d.wordCount,
    reading_progress: d.readingProgress,
    created_at: d.savedAt.toISOString(),
    updated_at: d.updatedAt.toISOString(),
    published_date: d.publishedDate ? d.publishedDate.toISOString() : null,
    summary: d.summary,
    image_url: d.imageUrl,
    notes: d.documentNote,
    ...(withHtml ? { html_content: d.htmlContent } : {}),
  }));

  return NextResponse.json({
    count: results.length,
    nextPageCursor: null,
    results,
  });
}
