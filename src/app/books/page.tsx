'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { useReader } from '@/context/ReaderContext';

export default function BooksAndSourcesPage() {
  const { documents, supplementalCatalog, mutateState } = useReader();
  const [activeTab, setActiveTab] = useState<'sources' | 'supplemental'>('sources');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const sourceDocs = documents.filter((d) => {
    if (d.triageStatus === 'trash') return false;
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    return true;
  });

  const handleFrequencyChange = async (documentId: string, reviewFrequency: string) => {
    await mutateState(
      'update-review-frequency',
      { documentId, reviewFrequency },
      `Updated Daily Review frequency to "${reviewFrequency}"`
    );
  };

  const handleAddSupplemental = async (bookKey: string, title: string) => {
    await mutateState(
      'add-supplemental-book',
      { bookKey },
      `Added Supplemental Book "${title}" & its flashcards to your library!`
    );
  };

  return (
    <WorkspaceShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Books, Sources &amp; Supplemental Highlights
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure Spaced Repetition review weights per book/article or add curated Readwise Supplemental Books.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold ${
                activeTab === 'sources'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              📚 Your Library Sources ({sourceDocs.length})
            </button>
            <button
              onClick={() => setActiveTab('supplemental')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold ${
                activeTab === 'supplemental'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ✨ Supplemental Books ({supplementalCatalog.length})
            </button>
          </div>
        </div>

        {activeTab === 'sources' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {['all', 'epub', 'article', 'pdf', 'video', 'podcast', 'tweet'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium uppercase ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Title &amp; Author</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Highlights</th>
                    <th className="py-3 px-4">Daily Review Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sourceDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/new/read/${doc.id}`}
                          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600"
                        >
                          {doc.title}
                        </Link>
                        <div className="text-xs text-slate-500">{doc.author || doc.domain}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {doc.annotations?.length || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Review frequency for ${doc.title}`}
                          value={doc.reviewFrequency || 'normal'}
                          onChange={(e) => handleFrequencyChange(doc.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                        >
                          <option value="never">Never Review</option>
                          <option value="less">Less Often (0.5x)</option>
                          <option value="normal">Normal (1.0x)</option>
                          <option value="more">More Often (2.0x)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplementalCatalog.map((book: any) => {
              const alreadyAdded = documents.some((d) => d.title === book.title);
              return (
                <div
                  key={book.key}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                      Readwise Supplemental Book
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">by {book.author}</p>
                    <blockquote className="mt-3 text-xs italic text-slate-600 dark:text-slate-300 border-l-2 border-amber-400 pl-3">
                      “{book.highlights?.[0]?.text}”
                    </blockquote>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {book.highlights?.length || 0} Curated Highlights + Q&amp;A Cards
                    </span>
                    <button
                      disabled={alreadyAdded}
                      onClick={() => handleAddSupplemental(book.key, book.title)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                        alreadyAdded
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {alreadyAdded ? '✓ Added to Library' : '+ Add Supplemental Highlights'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
