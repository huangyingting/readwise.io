'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Filter, Plus, Pin, Trash2, Search } from 'lucide-react';

export default function ManageViewsPage() {
  const {
    filteredViews,
    mutateState,
    setEditingFilteredView,
    setIsFilteredViewModalOpen,
  } = useReader();

  const [search, setSearch] = useState('');

  const filtered = filteredViews.filter(
    (fv) =>
      fv.name.toLowerCase().includes(search.toLowerCase()) ||
      fv.query.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <WorkspaceShell
      title="Manage Filtered Views"
      subtitle="Saved boolean Query DSL filters for one-click access in your sidebar"
      headerActions={
        <button
          onClick={() => {
            setEditingFilteredView(null);
            setIsFilteredViewModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
        >
          <Plus className="h-3.5 w-3.5" />
          New Filtered View
        </button>
      }
    >
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-[#141821]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter saved views by name or Query DSL..."
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#141821]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-[#181c26]">
              <tr>
                <th className="px-4 py-3">View Name</th>
                <th className="px-4 py-3">Query DSL</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Matches</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
              {filtered.map((fv) => (
                <tr key={fv.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/filtered?id=${encodeURIComponent(fv.key)}`}
                      className="flex items-center gap-2 text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      <Filter className="h-3.5 w-3.5 text-blue-500" />
                      <span>{fv.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                    {fv.query}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fv.groupName}</td>
                  <td className="px-4 py-3 font-semibold">{fv.matchingCount} docs</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() =>
                          mutateState(
                            'update-filtered-view',
                            { viewId: fv.id, key: fv.key, isPinned: !fv.isPinned },
                            fv.isPinned ? `Unpinned ${fv.name}` : `Pinned ${fv.name}`
                          )
                        }
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                          fv.isPinned
                            ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {fv.isPinned ? 'Pinned ★' : 'Pin'}
                      </button>
                      {!fv.isBuiltIn && (
                        <button
                          onClick={() =>
                            mutateState(
                              'delete-filtered-view',
                              { viewId: fv.id },
                              `Deleted view ${fv.name}`
                            )
                          }
                          className="rounded-lg p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspaceShell>
  );
}
