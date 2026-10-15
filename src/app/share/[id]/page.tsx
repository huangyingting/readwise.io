import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PublicSharedDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      annotations: {
        orderBy: { createdAt: 'asc' },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  });

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Shared Document Not Found
          </h1>
          <p className="text-sm text-slate-500">
            This shared Readwise Reader link may have been removed or made private.
          </p>
          <Link
            href="/read"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
          >
            Explore Readwise Reader
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0f1115] text-slate-900 dark:text-slate-100">
      {/* Top Banner */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            R
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Shared with <strong>Readwise Reader</strong> by{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {doc.user?.firstName || 'Alex'} (@{doc.user?.username || 'reader'})
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/new/read/${doc.id}`}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            Open in My Reader
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-2">
            {doc.category} • {doc.domain || doc.siteName} • {doc.readingMinutes} min read
          </div>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">
            {doc.title}
          </h1>
          <div className="text-sm text-slate-500 mt-2">
            By <strong>{doc.author || doc.siteName}</strong>
            {doc.url && doc.url.startsWith('http') && (
              <>
                {' '}
                •{' '}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Original Source ↗
                </a>
              </>
            )}
          </div>
        </div>

        {/* Shared Annotations Summary */}
        {doc.annotations.length > 0 && (
          <div className="mb-10 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              ✨ {doc.annotations.length} Shared Highlights &amp; Notes
            </div>
            {doc.annotations.map((ann) => (
              <div
                key={ann.id}
                className="border-l-4 border-amber-400 pl-3 py-1 text-sm space-y-1"
              >
                <p className="font-serif italic text-slate-800 dark:text-slate-200">
                  “{ann.selectedText}”
                </p>
                {ann.note && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>Note:</strong> {ann.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Article HTML Body */}
        <article
          className="prose prose-slate dark:prose-invert max-w-none font-serif leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: doc.htmlContent }}
        />
      </main>
    </div>
  );
}
