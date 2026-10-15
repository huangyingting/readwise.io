'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Tag, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

export default function ManageTagsPage() {
  const { tags, mutateState } = useReader();
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await mutateState(
      'create-tag',
      { name: newName.trim(), description: newDesc.trim() },
      `Created tag #${newName.trim()}`
    );
    setNewName('');
    setNewDesc('');
  };

  return (
    <WorkspaceShell
      title="Manage Tags"
      subtitle="Organize document tags and highlight tags across your library"
    >
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Create New Tag Form */}
        <form
          onSubmit={handleCreate}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#141821]"
        >
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Tag Name
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., distributed-systems"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="flex-2 min-w-[220px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Description (Optional)
            </label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Papers and essays on consensus & storage engines"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Tag
          </button>
        </form>

        {/* Tags Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#141821]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-[#181c26]">
              <tr>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">Highlights</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
              {tags.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3 font-semibold">
                    {editingId === t.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="rounded border border-blue-500 px-2 py-1 text-xs dark:bg-gray-900"
                        />
                        <button
                          onClick={async () => {
                            await mutateState(
                              'rename-tag',
                              { tagId: t.id, oldName: t.name, newName: renameValue },
                              `Renamed tag to #${renameValue}`
                            );
                            setEditingId(null);
                          }}
                          className="text-emerald-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/filtered?query=${encodeURIComponent(`tag:${t.name}`)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                      >
                        <Tag className="h-3 w-3" />
                        <span>#{t.name}</span>
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.description || '—'}</td>
                  <td className="px-4 py-3 font-medium">{t.documentCount} docs</td>
                  <td className="px-4 py-3 font-medium">{t.highlightCount} highlights</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        title="Rename Tag"
                        onClick={() => {
                          setEditingId(t.id);
                          setRenameValue(t.name);
                        }}
                        className="rounded p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Delete Tag"
                        onClick={() =>
                          mutateState(
                            'delete-tag',
                            { tagId: t.id, name: t.name },
                            `Deleted tag #${t.name}`
                          )
                        }
                        className="rounded p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
