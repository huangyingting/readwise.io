'use client';

import React from 'react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { DocumentListView } from '@/components/DocumentListView';

export default function LaterPage() {
  const { documents } = useReader();
  const laterDocs = documents.filter((d) => d.triageStatus === 'later');

  return (
    <WorkspaceShell
      title="Library • Later"
      subtitle="Long-form articles, books, and papers queued for deep reading"
    >
      <DocumentListView
        documents={laterDocs}
        emptyTitle="No documents in Later"
        emptySubtitle="Press 'l' on any document in your Inbox or Feed to queue it for Later."
      />
    </WorkspaceShell>
  );
}
