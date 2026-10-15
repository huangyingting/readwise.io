'use client';

import React, { useState } from 'react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { DocumentListView } from '@/components/DocumentListView';

export default function InboxNewPage() {
  const { documents } = useReader();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const inboxDocs = documents.filter((d) => d.triageStatus === 'new');
  const filtered =
    categoryFilter === 'all'
      ? inboxDocs
      : inboxDocs.filter((d) => d.category === categoryFilter);

  const tabs = [
    { key: 'all', label: 'All Inbox', count: inboxDocs.length },
    {
      key: 'article',
      label: 'Articles',
      count: inboxDocs.filter((d) => d.category === 'article').length,
    },
    {
      key: 'pdf',
      label: 'PDFs',
      count: inboxDocs.filter((d) => d.category === 'pdf').length,
    },
    {
      key: 'epub',
      label: 'Books (EPUB)',
      count: inboxDocs.filter((d) => d.category === 'epub').length,
    },
    {
      key: 'video',
      label: 'Videos',
      count: inboxDocs.filter((d) => d.category === 'video').length,
    },
  ];

  return (
    <WorkspaceShell
      title="Library • Inbox"
      subtitle="Newly saved articles, PDFs, EPUBs, and videos awaiting triage (press l for Later, e for Archive)"
    >
      <DocumentListView
        documents={filtered}
        showLocationTabs
        activeTab={categoryFilter}
        onTabChange={setCategoryFilter}
        tabs={tabs}
        emptyTitle="Your Inbox is at Inbox Zero!"
        emptySubtitle="Press 'a' to save a new article, YouTube video, or upload a PDF/EPUB."
      />
    </WorkspaceShell>
  );
}
