'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { DocumentListView } from '@/components/DocumentListView';
import { evaluateQueryDsl } from '@/lib/query-dsl';
import { Filter, Pin, PinOff, Edit3 } from 'lucide-react';

function FilteredPageInner() {
  const searchParams = useSearchParams();
  const {
    documents,
    filteredViews,
    mutateState,
    setEditingFilteredView,
    setIsFilteredViewModalOpen,
  } = useReader();

  const viewIdOrKey = searchParams.get('id');
  const rawQueryParam = searchParams.get('query');

  const matchedView = filteredViews.find(
    (fv) => fv.key === viewIdOrKey || fv.id === viewIdOrKey
  );

  const activeQuery =
    rawQueryParam ||
    matchedView?.query ||
    (viewIdOrKey === 'shortlist'
      ? 'tag:shortlist'
      : viewIdOrKey
      ? `category:${viewIdOrKey}`
      : 'in:inbox');

  const [locationTab, setLocationTab] = useState<'all' | 'new' | 'later' | 'archive'>('all');

  const dslMatched = evaluateQueryDsl(documents, activeQuery);
  const finalDocs =
    locationTab === 'all'
      ? dslMatched
      : dslMatched.filter((d) => d.triageStatus === locationTab);

  const title = matchedView?.name || (rawQueryParam ? `Query: ${rawQueryParam}` : 'Filtered View');

  return (
    <WorkspaceShell
      title={title}
      subtitle={`Query DSL: ${activeQuery}`}
      headerActions={
        <div className="flex items-center gap-2">
          {matchedView && (
            <button
              onClick={() =>
                mutateState(
                  'update-filtered-view',
                  {
                    viewId: matchedView.id,
                    key: matchedView.key,
                    isPinned: !matchedView.isPinned,
                  },
                  matchedView.isPinned
                    ? `Unpinned "${matchedView.name}" from sidebar`
                    : `Pinned "${matchedView.name}" to sidebar`
                )
              }
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              {matchedView.isPinned ? (
                <>
                  <PinOff className="h-3.5 w-3.5 text-blue-600" />
                  Pinned
                </>
              ) : (
                <>
                  <Pin className="h-3.5 w-3.5" />
                  Pin to Sidebar
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              setEditingFilteredView(
                matchedView || {
                  id: 'custom',
                  key: 'custom',
                  name: title,
                  query: activeQuery,
                  icon: 'filter',
                  groupName: 'Custom',
                  isPinned: true,
                  isBuiltIn: false,
                  sortBy: 'savedAt',
                  layoutMode: 'list',
                  groupBy: 'none',
                  matchingCount: dslMatched.length,
                }
              );
              setIsFilteredViewModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Query
          </button>
        </div>
      }
    >
      <DocumentListView
        documents={finalDocs}
        showLocationTabs
        activeTab={locationTab}
        onTabChange={(t) => setLocationTab(t as any)}
        tabs={[
          { key: 'all', label: 'All Matching', count: dslMatched.length },
          {
            key: 'new',
            label: 'Inbox',
            count: dslMatched.filter((d) => d.triageStatus === 'new').length,
          },
          {
            key: 'later',
            label: 'Later',
            count: dslMatched.filter((d) => d.triageStatus === 'later').length,
          },
          {
            key: 'archive',
            label: 'Archive',
            count: dslMatched.filter((d) => d.triageStatus === 'archive').length,
          },
        ]}
        banner={
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-2 text-xs dark:border-gray-800 dark:bg-[#141822]">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-gray-500">Active Filter Query:</span>
              <code className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-blue-600 dark:text-blue-300">
                {activeQuery}
              </code>
            </div>
            <span className="text-gray-400">{dslMatched.length} total matches</span>
          </div>
        }
      />
    </WorkspaceShell>
  );
}

export default function FilteredPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading Filtered View...</div>}>
      <FilteredPageInner />
    </Suspense>
  );
}
