'use client';

import React, { useState } from 'react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Keyboard, RotateCcw, Check } from 'lucide-react';

export default function ShortcutsCustomizePage() {
  const { settings, mutateState } = useReader();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [bindingInput, setBindingInput] = useState('');

  const shortcuts = settings?.shortcuts || {};

  const handleSaveBinding = async (actionKey: string) => {
    if (!bindingInput.trim()) return;
    const currentItem = (shortcuts as any)[actionKey];
    const nextValue =
      typeof currentItem === 'string'
        ? bindingInput.trim()
        : { ...currentItem, binding: bindingInput.trim() };
    await mutateState(
      'update-settings',
      {
        settings: {
          shortcuts: {
            [actionKey]: nextValue,
          },
        },
      },
      `Updated shortcut for "${actionKey}" to "${bindingInput.trim()}"`
    );
    setEditingKey(null);
  };

  return (
    <WorkspaceShell
      title="Customize Keyboard Shortcuts"
      subtitle="Superhuman-inspired keyboard navigation for zero-latency reading and triage"
      headerActions={
        <button
          onClick={() =>
            mutateState(
              'update-settings',
              { settings: { resetShortcuts: true } },
              'Reset all keyboard shortcuts to defaults'
            )
          }
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset All to Default
        </button>
      }
    >
      <div className="mx-auto max-w-4xl p-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#141821]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-[#181c26]">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Keybinding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
              {Object.entries(shortcuts).map(([key, item]: [string, any]) => {
                const label = typeof item === 'string' ? key : item?.label || key;
                const category = typeof item === 'string' ? 'Keyboard Action' : item?.category || 'General';
                const binding = typeof item === 'string' ? item : item?.binding || '';
                return (
                  <tr key={key} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {label}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{category}</td>
                    <td className="px-4 py-3 text-right">
                      {editingKey === key ? (
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            autoFocus
                            type="text"
                            value={bindingInput}
                            onChange={(e) => setBindingInput(e.target.value)}
                            className="w-24 rounded border border-blue-500 px-2 py-1 text-right font-mono text-xs dark:bg-gray-900"
                          />
                          <button
                            onClick={() => handleSaveBinding(key)}
                            className="rounded bg-blue-600 p-1 text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingKey(key);
                            setBindingInput(binding);
                          }}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-xs font-semibold text-blue-600 hover:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400"
                        >
                          {binding}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspaceShell>
  );
}
