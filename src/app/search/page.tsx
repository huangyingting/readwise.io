'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { DocumentListView } from '@/components/DocumentListView';
import { evaluateQueryDsl, QUERY_DSL_SUGGESTIONS } from '@/lib/query-dsl';
import { Search, BookmarkPlus, X } from 'lucide-react';

function SearchPageInner() {
  const searchParams = useSearchParams();
  const { documents, mutateState } = useReader();
  const initialQuery = searchParams.get('query') || '';
  const [query, setQuery] = useState(initialQuery);

  const results = query.trim()
    ? evaluateQueryDsl(documents, query)
    : documents.filter((d) => d.triageStatus !== 'trash');

  const handleSaveAsView = async () => {
    if (!query.trim()) return;
    await mutateState(
      'create-filtered-view',
      {
        name: `Search: ${query.trim().slice(0, 28)}`,
        query: query.trim(),
        isPinned: true,
      },
      `Saved search "${query.trim()}" as a Pinned Filtered View`
    );
  };

  return (
    <WorkspaceShell
      title="Full-Text & Query DSL Search"
      subtitle="Instant search across titles, authors, body text, highlights, and boolean parameters"
      headerActions={
        query.trim() ? (
          <button
            onClick={handleSaveAsView}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Save as Filtered View
          </button>
        ) : null
      }
    >
      <div className="border-b border-gray-200 bg-gray-50/60 p-5 dark:border-[#222631] dark:bg-[#131722]">
        <div className="mx-auto max-w-4xl">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 h-4 w-4 text-blue-500" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search full text or use Query DSL (e.g., category:pdf OR has:highlights OR author:"Paul Graham")'
              className="w-full rounded-2xl border border-gray-300 bg-white pl-11 pr-10 py-3 font-mono text-sm text-gray-900 shadow-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Parameter Autocomplete Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Parameters:
            </span>
            {QUERY_DSL_SUGGESTIONS.slice(0, 9).map((s) => (
              <button
                key={s.token}
                type="button"
                onClick={() =>
                  setQuery((prev) => (prev.trim() ? `${prev.trim()} AND ${s.token}` : s.token))
                }
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 font-mono text-[11px] text-gray-700 hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {s.token}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DocumentListView
        documents={results}
        emptyTitle={`No documents matched "${query}"`}
        emptySubtitle="Try broadening your search terms or clearing boolean filters."
      />
    </WorkspaceShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading Search...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
