'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { DEFAULT_EXPORT_TEMPLATE } from '@/lib/default-data';
import { Settings, Download, Code, Keyboard, Check } from 'lucide-react';

export default function PreferencesPage() {
  const { settings, mutateState } = useReader();
  const [exportTemplate, setExportTemplate] = useState(
    settings?.exportTemplate || DEFAULT_EXPORT_TEMPLATE
  );

  const handleToggleSetting = (key: string, val: any) => {
    mutateState(
      'update-settings',
      { settings: { [key]: val } },
      'Saved preference'
    );
  };

  return (
    <WorkspaceShell
      title="Reader Preferences & Export Templates"
      subtitle="Configure library workflow, appearance, auto-highlighting, and Jinja2 Markdown export templates"
      headerActions={
        <Link
          href="/preferences/shortcuts"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700"
        >
          <Keyboard className="h-3.5 w-3.5" />
          Customize Keyboard Shortcuts
        </Link>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6 p-6 text-xs">
        {/* General & Appearance */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 dark:border-gray-800 dark:bg-[#141821]">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Settings className="h-4 w-4 text-blue-600" />
            Reading &amp; Triage Preferences
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-gray-600 dark:text-gray-300">
                Color Theme
              </label>
              <select
                value={settings?.theme || 'light'}
                onChange={(e) => handleToggleSetting('theme', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="auto">System Auto</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-600 dark:text-gray-300">
                Library Triage Workflow
              </label>
              <select
                value={settings?.workflow || 'inbox_archive'}
                onChange={(e) => handleToggleSetting('workflow', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="inbox_archive">Inbox → Later → Archive</option>
                <option value="later_archive">Shortlist / Later → Archive</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            {[
              {
                key: 'showSidebarCounts',
                label: 'Show unread document badges in Left Navigation Sidebar',
              },
              {
                key: 'autoHighlight',
                label: 'Instant Auto-Highlight when selecting text in Reader',
              },
              {
                key: 'scrollMarkSeen',
                label: 'Automatically mark RSS Feed items as Seen when scrolled past',
              },
              {
                key: 'autoAdvance',
                label: 'Auto-advance to next document after archiving (e) or triaging (l)',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center justify-between"
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
                <input
                  type="checkbox"
                  checked={Boolean((settings as any)?.[item.key])}
                  onChange={(e) => handleToggleSetting(item.key, e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Notebook Markdown Export Template (Jinja2) */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 dark:border-gray-800 dark:bg-[#141821]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Code className="h-4 w-4 text-purple-600" />
                Notebook Markdown Export Template (Jinja2)
              </h2>
              <p className="mt-0.5 text-gray-500">
                Used when copying or downloading document annotations in the Notebook panel.
              </p>
            </div>
            <button
              onClick={() =>
                mutateState(
                  'update-settings',
                  { settings: { exportTemplate } },
                  'Saved Jinja2 Markdown export template'
                )
              }
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
            >
              <Check className="h-3.5 w-3.5" />
              Save Template
            </button>
          </div>

          <textarea
            rows={9}
            value={exportTemplate}
            onChange={(e) => setExportTemplate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-gray-950 p-4 font-mono text-xs leading-relaxed text-emerald-300"
          />
        </section>

        {/* Full Data Portability & Exports */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3 dark:border-gray-800 dark:bg-[#141821]">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Download className="h-4 w-4 text-emerald-600" />
            Data Portability &amp; Full Exports
          </h2>
          <p className="text-gray-500">
            Download your entire library, highlights, or RSS feed subscriptions anytime.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/api/export?format=csv"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 font-semibold hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            >
              <Download className="h-3.5 w-3.5" />
              Export All Documents (CSV)
            </a>
            <a
              href="/api/export?format=opml"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 font-semibold hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            >
              <Download className="h-3.5 w-3.5" />
              Export RSS Subscriptions (OPML)
            </a>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
