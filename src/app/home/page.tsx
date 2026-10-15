'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import {
  BookOpen,
  Clock,
  Sparkles,
  Star,
  Rss,
  Settings2,
  ArrowRight,
  Quote,
  FileText,
  Video,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const { documents, user, setIsAddDocumentModalOpen } = useReader();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    continueReading: true,
    recentlyAdded: true,
    shortlist: true,
    dailyReview: true,
    unseenFeed: true,
  });

  const activeDocs = documents.filter((d) => d.triageStatus !== 'trash');
  const continueReading = activeDocs.filter((d) => d.readingProgress > 0 && d.readingProgress < 100);
  const inboxDocs = activeDocs.filter((d) => d.triageStatus === 'new').slice(0, 4);
  const shortlistDocs = activeDocs.filter((d) => d.isShortlisted || d.tags.includes('shortlist')).slice(0, 4);
  const unseenFeeds = activeDocs.filter((d) => d.inFeed && !d.isSeen).slice(0, 4);

  const allHighlights = activeDocs.flatMap((d) =>
    (d.annotations || []).map((a) => ({
      ...a,
      docId: d.id,
      docTitle: d.title,
      docAuthor: d.author,
    }))
  );

  return (
    <WorkspaceShell
      title={`Welcome back, ${user?.firstName || 'Alex'}`}
      subtitle="Your Daily Digest, Continue Reading queue, and Highlight Review"
      headerActions={
        <button
          onClick={() => setCustomizeOpen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Configure Home
        </button>
      }
    >
      <div className="mx-auto max-w-5xl space-y-8 p-6">
        {/* Customize Home Drawer */}
        {customizeOpen && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="font-bold text-gray-900 dark:text-white">
              Customize Home Dashboard Sections
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              {[
                { key: 'continueReading', label: 'Continue Reading' },
                { key: 'recentlyAdded', label: 'Recently Added to Inbox' },
                { key: 'shortlist', label: 'Shortlist Priority Queue' },
                { key: 'dailyReview', label: 'Daily Highlight Review' },
                { key: 'unseenFeed', label: 'Unseen RSS Feed' },
              ].map((s) => (
                <label key={s.key} className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={(visibleSections as any)[s.key]}
                    onChange={(e) =>
                      setVisibleSections((prev) => ({
                        ...prev,
                        [s.key]: e.target.checked,
                      }))
                    }
                    className="rounded text-blue-600"
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            href="/new"
            className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-blue-500/50 dark:border-[#222631] dark:bg-[#141821]"
          >
            <div className="text-xs font-semibold text-gray-500">Library Inbox</div>
            <div className="mt-1 text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {activeDocs.filter((d) => d.triageStatus === 'new').length}
            </div>
          </Link>
          <Link
            href="/later"
            className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-amber-500/50 dark:border-[#222631] dark:bg-[#141821]"
          >
            <div className="text-xs font-semibold text-gray-500">Reading Later</div>
            <div className="mt-1 text-2xl font-extrabold text-amber-500">
              {activeDocs.filter((d) => d.triageStatus === 'later').length}
            </div>
          </Link>
          <Link
            href="/feed"
            className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-orange-500/50 dark:border-[#222631] dark:bg-[#141821]"
          >
            <div className="text-xs font-semibold text-gray-500">Unseen RSS Feeds</div>
            <div className="mt-1 text-2xl font-extrabold text-orange-500">
              {activeDocs.filter((d) => d.inFeed && !d.isSeen).length}
            </div>
          </Link>
          <Link
            href="/ghostreader"
            className="rounded-2xl border border-purple-200/70 bg-purple-50/40 p-4 transition hover:border-purple-500/50 dark:border-purple-900/40 dark:bg-purple-950/20"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-300">
              <Sparkles className="h-3.5 w-3.5" /> Ask Ghostreader
            </div>
            <div className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
              Synthesize {allHighlights.length} Highlights →
            </div>
          </Link>
        </div>

        {/* Section 1: Continue Reading */}
        {visibleSections.continueReading && continueReading.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Jump Back In ({continueReading.length})
              </h2>
              <Link href="/new" className="text-xs font-semibold text-blue-600 hover:underline">
                View Library →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {continueReading.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/new/read/${doc.id}`}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs transition hover:border-blue-500/50 hover:shadow-md dark:border-[#222631] dark:bg-[#141821]"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-blue-600 dark:text-blue-400">
                      <span>{doc.category}</span>
                      <span>{doc.readingProgress}% complete</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-bold text-gray-900 dark:text-white">
                      {doc.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {doc.summary}
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${doc.readingProgress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{doc.author}</span>
                      <span>{doc.readingMinutes} min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Recently Added to Inbox */}
        {visibleSections.recentlyAdded && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Clock className="h-4 w-4 text-indigo-500" />
                Recently Added to Inbox
              </h2>
              <Link href="/new" className="text-xs font-semibold text-blue-600 hover:underline">
                Open Inbox →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {inboxDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/new/read/${doc.id}`}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-blue-500/50 dark:border-[#222631] dark:bg-[#141821]"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase text-gray-400">
                      {doc.domain} • {doc.category} • {doc.readingMinutes}m
                    </div>
                    <h3 className="mt-1 truncate text-sm font-bold text-gray-900 dark:text-white">
                      {doc.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {doc.summary}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Shortlist */}
        {visibleSections.shortlist && shortlistDocs.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                Shortlist Priority Reads
              </h2>
              <Link
                href="/filtered?id=shortlist"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Open Shortlist →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {shortlistDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/new/read/${doc.id}`}
                  className="rounded-2xl border border-amber-200/70 bg-amber-50/20 p-4 transition hover:border-amber-400 dark:border-amber-900/40 dark:bg-amber-950/10"
                >
                  <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    ★ Shortlisted • {doc.author}
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                    {doc.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {doc.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Daily Highlight Review */}
        {visibleSections.dailyReview && allHighlights.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Quote className="h-4 w-4 text-yellow-500" />
                Daily Highlight &amp; Notebook Review
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {allHighlights.slice(0, 4).map((hl) => (
                <Link
                  key={hl.id}
                  href={`/new/read/${hl.docId}`}
                  className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-yellow-500/60 dark:border-[#222631] dark:bg-[#141821]"
                >
                  <blockquote className="border-l-3 border-yellow-400 pl-3 text-xs italic leading-relaxed text-gray-800 dark:text-gray-200">
                    &ldquo;{hl.selectedText}&rdquo;
                  </blockquote>
                  {hl.note && (
                    <div className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Note: {hl.note}
                    </div>
                  )}
                  <div className="mt-2 text-[11px] text-gray-400">
                    From <strong>{hl.docTitle}</strong> by {hl.docAuthor}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </WorkspaceShell>
  );
}
