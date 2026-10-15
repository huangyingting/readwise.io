'use client';

import React from 'react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Mail } from 'lucide-react';

export default function ProductEmailsPage() {
  const { settings, mutateState } = useReader();
  const emailPrefs = settings?.emailPreferences || {
    dailyDigest: true,
    weeklyRoundup: true,
    productUpdates: true,
    tipsAndTricks: false,
  };

  const togglePref = (key: string, val: boolean) => {
    mutateState(
      'update-settings',
      {
        settings: {
          emailPreferences: {
            ...emailPrefs,
            [key]: val,
          },
        },
      },
      'Updated email notification preferences'
    );
  };

  return (
    <WorkspaceShell
      title="Product Emails & Digest Notifications"
      subtitle="Control which Readwise Reader digests and product updates are sent to your inbox"
    >
      <div className="mx-auto max-w-3xl p-6">
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 text-xs dark:border-gray-800 dark:bg-[#141821]">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Mail className="h-4 w-4 text-blue-600" />
            Email Subscriptions
          </h2>

          {[
            {
              key: 'dailyDigest',
              title: 'Daily Reading Digest',
              desc: 'Receive a morning summary of your Shortlist and 3 unread quick reads.',
            },
            {
              key: 'weeklyRoundup',
              title: 'Weekly Reading & Highlight Roundup',
              desc: 'Weekly synthesis of your archived articles, top highlights, and reading velocity.',
            },
            {
              key: 'productUpdates',
              title: 'Monthly Public Beta Changelog',
              desc: 'Detailed engineering dispatches covering new Reader features and Ghostreader upgrades.',
            },
            {
              key: 'tipsAndTricks',
              title: 'Keyboard Mastery & Query DSL Tips',
              desc: 'Occasional tutorials on advanced Filtered Views and Jinja2 prompt engineering.',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
            >
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </div>
                <div className="mt-0.5 text-gray-500">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={Boolean((emailPrefs as any)[item.key])}
                onChange={(e) => togglePref(item.key, e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
            </label>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
