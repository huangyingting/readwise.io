'use client';

import React from 'react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { DocumentListView } from '@/components/DocumentListView';
import { Trash2 } from 'lucide-react';

export default function TrashPage() {
  const { documents, mutateState } = useReader();
  const trashDocs = documents.filter((d) => d.triageStatus === 'trash');

  return (
    <WorkspaceShell
      title="Trash"
      subtitle="Deleted documents remain in Trash for 30 days before permanent removal"
      headerActions={
        trashDocs.length > 0 ? (
          <button
            onClick={() =>
              mutateState('empty-trash', {}, 'Emptied all items from Trash')
            }
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Empty Trash ({trashDocs.length})
          </button>
        ) : null
      }
    >
      <DocumentListView
        documents={trashDocs}
        isTrashView
        emptyTitle="Trash is empty"
        emptySubtitle="Deleted documents will appear here and can be restored anytime."
      />
    </WorkspaceShell>
  );
}
