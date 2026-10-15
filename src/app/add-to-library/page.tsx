'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Mail, Copy, Check, ArrowRight } from 'lucide-react';

export default function AddToLibraryEmailPage() {
  const { user, mutateState, showToast } = useReader();
  const [copied, setCopied] = useState(false);
  const [prefix, setPrefix] = useState(
    (user?.customLibraryEmail || 'alex.library@library.readwise.io').split('@')[0]
  );

  const address = user?.customLibraryEmail || 'alex.library@library.readwise.io';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    showToast(`Copied ${address} to clipboard`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <WorkspaceShell
      title="Email to Library"
      subtitle="Forward individual emails, articles, or PDF attachments directly into your Library Inbox"
      headerActions={
        <Link
          href="/add-to-feed"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700"
        >
          Switch to Email to Feed
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6 p-6 text-xs">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#141821]">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Mail className="h-4 w-4 text-blue-600" />
            Your Personal Library Email Address
          </div>
          <p className="mt-1 text-gray-500">
            Anything sent or forwarded to this address lands directly in your{' '}
            <strong>Library Inbox</strong> (`/new`).
          </p>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
            <code className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
              {address}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Address'}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutateState(
                'update-profile',
                { customEmailPrefix: prefix },
                'Updated custom Readwise email prefix'
              );
            }}
            className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800"
          >
            <label className="font-semibold text-gray-600 dark:text-gray-300">
              Customize Address Prefix
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-900"
              />
              <span className="font-mono text-gray-400">@library.readwise.io</span>
              <button
                type="submit"
                className="rounded-xl border border-gray-200 px-3.5 py-2 font-semibold hover:bg-gray-50 dark:border-gray-700"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </WorkspaceShell>
  );
}
