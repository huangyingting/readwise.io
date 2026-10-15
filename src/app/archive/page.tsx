'use client';

import React from 'react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { DocumentListView } from '@/components/DocumentListView';

export default function ArchivePage() {
  const { documents } = useReader();
  const archiveDocs = documents.filter((d) => d.triageStatus === 'archive');

  return (
    <WorkspaceShell
      title="Library • Archive"
      subtitle="Completed readings and permanently indexed knowledge base"
    >
      <DocumentListView
        documents={archiveDocs}
        emptyTitle="No archived documents yet"
        emptySubtitle="Press 'e' when you finish reading a document to move it to Archive."
      />
    </WorkspaceShell>
  );
}
