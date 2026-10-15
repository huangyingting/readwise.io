'use client';

import React, { useState } from 'react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { DocumentListView } from '@/components/DocumentListView';
import { Rss, CheckCheck, Plus, Trash2, Download, Sparkles } from 'lucide-react';

export default function FeedPage() {
  const {
    documents,
    rssFeeds,
    suggestedFeeds,
    mutateState,
    setAddModalDefaultTab,
    setIsAddDocumentModalOpen,
  } = useReader();

  const [seenTab, setSeenTab] = useState<'unseen' | 'seen' | 'manage'>('unseen');

  const feedDocs = documents.filter((d) => d.inFeed && d.triageStatus !== 'trash');
  const unseenDocs = feedDocs.filter((d) => !d.isSeen);
  const seenDocs = feedDocs.filter((d) => d.isSeen);

  const handleMarkAllSeen = async () => {
    if (unseenDocs.length === 0) return;
    await mutateState(
      'bulk-triage',
      {
        documentIds: unseenDocs.map((d) => d.id),
        bulkOp: 'mark_seen',
      },
      `Marked ${unseenDocs.length} feed items as Seen`
    );
  };

  return (
    <WorkspaceShell
      title="RSS & Newsletter Feed"
      subtitle="High-volume feed triage separated from your curated Library"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              mutateState('refresh-feeds', {}, 'Synced live RSS/Atom XML feeds')
            }
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-300"
          >
            <Rss className="h-3.5 w-3.5" />
            Sync Live Feeds
          </button>
          {unseenDocs.length > 0 && (
            <button
              onClick={handleMarkAllSeen}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
              Mark All Seen ({unseenDocs.length})
            </button>
          )}
          <button
            onClick={() => setSeenTab(seenTab === 'manage' ? 'unseen' : 'manage')}
            className="flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50/70 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 dark:border-orange-800/50 dark:bg-orange-950/30 dark:text-orange-300"
          >
            <Rss className="h-3.5 w-3.5" />
            {seenTab === 'manage' ? 'Back to Feed Stream' : `Manage Feeds (${rssFeeds.length})`}
          </button>
        </div>
      }
    >
      {seenTab === 'manage' ? (
        <div className="mx-auto max-w-5xl space-y-8 p-6">
          {/* Subscribed Feeds */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Your Subscribed RSS Feeds ({rssFeeds.length})
              </h2>
              <div className="flex gap-2">
                <a
                  href="/api/export?format=opml"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export OPML
                </a>
                <button
                  onClick={() => {
                    setAddModalDefaultTab('feed');
                    setIsAddDocumentModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add RSS URL
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {rssFeeds.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#141821]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                        {f.folder}
                      </span>
                      <h3 className="truncate text-sm font-bold">{f.title}</h3>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{f.description}</p>
                    <div className="mt-2 font-mono text-[11px] text-gray-400 truncate">{f.url}</div>
                  </div>
                  <button
                    title="Unsubscribe"
                    onClick={() =>
                      mutateState(
                        'unsubscribe-feed',
                        { feedId: f.id },
                        `Unsubscribed from ${f.title}`
                      )
                    }
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested High-Signal Feeds */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Suggested High-Signal Feeds (1-Click Subscribe)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {suggestedFeeds.map((sf: any) => {
                const isSub = rssFeeds.some((f) => f.url === sf.url);
                return (
                  <div
                    key={sf.url}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#141821]"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold">{sf.title}</div>
                      <p className="mt-0.5 text-xs text-gray-500">{sf.description}</p>
                    </div>
                    <button
                      disabled={isSub}
                      onClick={() =>
                        mutateState(
                          'subscribe-feed',
                          { url: sf.url, title: sf.title, folder: sf.folder, description: sf.description },
                          `Subscribed to ${sf.title}`
                        )
                      }
                      className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold ${
                        isSub
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {isSub ? 'Subscribed ✓' : 'Subscribe'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <DocumentListView
          documents={seenTab === 'unseen' ? unseenDocs : seenDocs}
          showLocationTabs
          activeTab={seenTab}
          onTabChange={(t) => setSeenTab(t as any)}
          tabs={[
            { key: 'unseen', label: 'Unseen', count: unseenDocs.length },
            { key: 'seen', label: 'Seen', count: seenDocs.length },
            { key: 'manage', label: 'Manage Feeds', count: rssFeeds.length },
          ]}
          emptyTitle={
            seenTab === 'unseen'
              ? 'All caught up on your Unseen RSS Feeds!'
              : 'No seen feed items yet'
          }
          emptySubtitle="Click 'Manage Feeds' to subscribe to new RSS feeds or import an OPML file."
        />
      )}
    </WorkspaceShell>
  );
}
