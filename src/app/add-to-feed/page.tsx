'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Rss, Copy, Check, ArrowLeft } from 'lucide-react';

export default function AddToFeedEmailPage() {
  const { user, showToast } = useReader();
  const [copied, setCopied] = useState(false);

  const address = user?.customFeedEmail || 'alex.feed@feed.readwise.io';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    showToast(`Copied ${address} to clipboard`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <WorkspaceShell
      title="Email to Feed (Newsletter Ingestion)"
      subtitle="Subscribe to Substack, Beehiiv, and Ghost newsletters using your dedicated @feed.readwise.io address"
      headerActions={
        <Link
          href="/add-to-library"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Email to Library
        </Link>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6 p-6 text-xs">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#141821]">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Rss className="h-4 w-4 text-orange-500" />
            Your Personal Newsletter Feed Address
          </div>
          <p className="mt-1 text-gray-500">
            Use this address when subscribing to recurring email newsletters so they flow cleanly
            into your <strong>Feed</strong> (`/feed`) without cluttering your personal email inbox.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50/50 px-4 py-3 dark:border-orange-900/40 dark:bg-orange-950/20">
            <code className="font-mono text-sm font-bold text-orange-700 dark:text-orange-300">
              {address}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-500"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Feed Address'}
            </button>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
