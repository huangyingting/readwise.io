import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveApiUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await resolveApiUser(req);
  const docs = await prisma.document.findMany({
    where: { userId: user.id, triageStatus: { not: 'trash' } },
    include: {
      _count: {
        select: { annotations: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const results = docs.map((d) => ({
    id: d.id,
    title: d.title,
    author: d.author,
    category: d.category,
    source: d.source,
    num_highlights: d._count.annotations,
    last_highlight_at: d.updatedAt.toISOString(),
    updated: d.updatedAt.toISOString(),
    cover_image_url: d.imageUrl,
    highlights_url: `/highlights?book_id=${d.id}`,
    source_url: d.url,
    review_frequency: d.reviewFrequency,
  }));

  return NextResponse.json({
    count: results.length,
    next: null,
    previous: null,
    results,
  });
}
