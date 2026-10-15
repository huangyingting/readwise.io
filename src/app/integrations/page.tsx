'use client';

import React from 'react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Puzzle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function IntegrationsPage() {
  const { integrations, user, mutateState } = useReader();

  return (
    <WorkspaceShell
      title="Integrations & Knowledge Sync"
      subtitle="Import reading lists from Pocket, Instapaper, Matter, or Feedly, and auto-export highlights to Obsidian, Notion & Logseq"
    >
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((intg) => (
            <div
              key={intg.id}
              className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-[#141821]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {intg.category}
                  </span>
                  {intg.connected && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-base font-bold text-gray-900 dark:text-white">
                  {intg.name}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {intg.connected
                    ? `Synced ${intg.importedCount} items (${intg.accountName || user.email})`
                    : `Connect ${intg.name} to enable automatic two-way synchronization.`}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={() =>
                    mutateState(
                      'toggle-integration',
                      {
                        provider: intg.provider,
                        connected: !intg.connected,
                        accountName: user.email,
                      },
                      intg.connected
                        ? `Disconnected ${intg.name}`
                        : `Connected ${intg.name} & started sync`
                    )
                  }
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                    intg.connected
                      ? 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {intg.connected ? 'Disconnect' : `Connect ${intg.name}`}
                </button>

                {intg.connected && (
                  <button
                    title="Trigger Manual Sync"
                    onClick={() =>
                      mutateState(
                        'toggle-integration',
                        {
                          provider: intg.provider,
                          connected: true,
                          accountName: user.email,
                        },
                        `Synced latest items with ${intg.name}`
                      )
                    }
                    className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:text-blue-600 dark:border-gray-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
