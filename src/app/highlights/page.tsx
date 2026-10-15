'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { useReader } from '@/context/ReaderContext';

const QUOTE_THEMES = [
  {
    id: 'noir',
    name: 'Noir Studio',
    bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900',
    text: 'text-white',
    sub: 'text-slate-400',
    svgBg1: '#0f172a',
    svgBg2: '#18181b',
    svgText: '#f8fafc',
  },
  {
    id: 'parchment',
    name: 'Warm Parchment',
    bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100',
    text: 'text-slate-900',
    sub: 'text-amber-900/70',
    svgBg1: '#fffbeb',
    svgBg2: '#fef3c7',
    svgText: '#0f172a',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    bg: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900',
    text: 'text-white',
    sub: 'text-blue-200',
    svgBg1: '#1e3a8a',
    svgBg2: '#0f172a',
    svgText: '#ffffff',
  },
  {
    id: 'emerald',
    name: 'Forest Sage',
    bg: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900',
    text: 'text-white',
    sub: 'text-emerald-200',
    svgBg1: '#064e3b',
    svgBg2: '#0f172a',
    svgText: '#ffffff',
  },
];

export default function HighlightsPage() {
  const { documents, mutateState, showToast } = useReader();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'flashcards'>('all');
  const [quoteModalItem, setQuoteModalItem] = useState<any | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(QUOTE_THEMES[0]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [clippingsText, setClippingsText] = useState(
    `Atomic Habits (James Clear)\n- Your Highlight on page 27 | Location 412-414 | Added on Monday, October 12, 2026\n\nYou do not rise to the level of your goals. You fall to the level of your systems.\n==========`
  );

  const allHighlights = useMemo(() => {
    const items: any[] = [];
    for (const doc of documents) {
      if (doc.triageStatus === 'trash') continue;
      for (const ann of doc.annotations || []) {
        items.push({
          ...ann,
          docTitle: doc.title,
          docAuthor: doc.author || doc.siteName || doc.domain,
          docCategory: doc.category,
          docId: doc.id,
        });
      }
    }
    return items.filter((item) => {
      if (filterMode === 'favorites' && !item.isFavorite) return false;
      if (filterMode === 'flashcards' && !item.flashcardQuestion && !item.clozeText) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.selectedText.toLowerCase().includes(q) ||
        (item.note || '').toLowerCase().includes(q) ||
        item.docTitle.toLowerCase().includes(q) ||
        item.docAuthor.toLowerCase().includes(q) ||
        (item.tags || []).some((t: string) => t.toLowerCase().includes(q))
      );
    });
  }, [documents, filterMode, searchQuery]);

  const handleApplyActionTag = async (ann: any, actionTag: string) => {
    const nextNote = ann.note ? `${actionTag} ${ann.note}` : actionTag;
    await mutateState(
      'update-annotation',
      { annotationId: ann.id, note: nextNote },
      `Applied Readwise Action Tag (${actionTag})`
    );
  };

  const handleDownloadQuoteSvg = (item: any) => {
    const escapedQuote = (item.selectedText || '')
      .slice(0, 260)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const escapedTitle = `${item.docTitle} — ${item.docAuthor}`
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${selectedTheme.svgBg1}" />
          <stop offset="100%" stop-color="${selectedTheme.svgBg2}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="675" rx="28" fill="url(#bg)" />
      <text x="90" y="220" fill="${selectedTheme.svgText}" font-family="Georgia, serif" font-size="34" font-style="italic">“${escapedQuote}”</text>
      <text x="90" y="560" fill="${selectedTheme.svgText}" opacity="0.8" font-family="sans-serif" font-size="24" font-weight="bold">${escapedTitle}</text>
      <text x="980" y="615" fill="${selectedTheme.svgText}" opacity="0.5" font-family="sans-serif" font-size="18">readwise.io</text>
    </svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readwise-quote-${item.id.slice(0, 6)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Visual Quote Card', false, 'success');
  };

  const handleImportClippings = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutateState(
      'import-highlights-text',
      { filename: 'My Clippings.txt', textContent: clippingsText },
      'Imported Kindle highlights into Readwise!'
    );
    setImportModalOpen(false);
  };

  return (
    <WorkspaceShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              All Highlights &amp; Visual Quote Studio
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Search, tag, favorite, apply Readwise Action Tags (<code>.h1</code>, <code>.c1</code>,{' '}
              <code>.qa</code>), or export visual quote cards across your entire library.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              📥 Import Kindle Clippings / CSV
            </button>
            <a
              href="/api/v2/export?format=obsidian"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              💎 Export Obsidian Vault (.md)
            </a>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all highlights, notes, books, and tags..."
            className="flex-1 min-w-[260px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
          />
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-medium ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({allHighlights.length})
            </button>
            <button
              onClick={() => setFilterMode('favorites')}
              className={`px-3 py-1.5 rounded-lg font-medium ${
                filterMode === 'favorites'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ❤️ Favorites
            </button>
            <button
              onClick={() => setFilterMode('flashcards')}
              className={`px-3 py-1.5 rounded-lg font-medium ${
                filterMode === 'flashcards'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              🎴 Flashcards &amp; Cloze
            </button>
          </div>
        </div>

        {/* Highlights Feed */}
        <div className="space-y-4">
          {allHighlights.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <Link
                  href={`/new/read/${item.docId}`}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {item.docTitle} — {item.docAuthor}
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      mutateState('toggle-favorite-annotation', { annotationId: item.id })
                    }
                    className="text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {item.isFavorite ? '❤️ Favorited' : '🤍 Favorite'}
                  </button>
                  <button
                    onClick={() => setQuoteModalItem(item)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium"
                  >
                    🎨 Share Visual Quote
                  </button>
                </div>
              </div>

              <blockquote className="text-base font-serif text-slate-900 dark:text-slate-100 border-l-4 border-amber-400 pl-4 py-0.5 leading-relaxed">
                “{item.selectedText}”
              </blockquote>

              {item.note && (
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-200/60 dark:border-amber-900">
                  <strong>Note:</strong> {item.note}
                </div>
              )}

              {/* Action Tags Bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(item.tags || []).map((t: string) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span>Action Tags:</span>
                  {['.h1', '.h2', '.c1', '.c2', '.qa'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleApplyActionTag(item, tag)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-950 font-mono text-slate-700 dark:text-slate-300"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Quote Studio Modal */}
        {quoteModalItem && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Visual Quote Studio
                </h3>
                <button
                  onClick={() => setQuoteModalItem(null)}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  ✕ Close
                </button>
              </div>

              {/* Live Preview Canvas */}
              <div
                className={`rounded-2xl p-10 min-h-[260px] flex flex-col justify-between shadow-lg ${selectedTheme.bg}`}
              >
                <p className={`text-xl font-serif leading-relaxed italic ${selectedTheme.text}`}>
                  “{quoteModalItem.selectedText}”
                </p>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/15">
                  <div>
                    <div className={`text-sm font-bold ${selectedTheme.text}`}>
                      {quoteModalItem.docTitle}
                    </div>
                    <div className={`text-xs ${selectedTheme.sub}`}>
                      {quoteModalItem.docAuthor}
                    </div>
                  </div>
                  <span className={`text-xs font-mono opacity-75 ${selectedTheme.sub}`}>
                    readwise.io
                  </span>
                </div>
              </div>

              {/* Palette Picker */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {QUOTE_THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setSelectedTheme(th)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        selectedTheme.id === th.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {th.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleDownloadQuoteSvg(quoteModalItem)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  ⬇️ Download Quote Card (.svg)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kindle Clippings / CSV Import Modal */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <form
              onSubmit={handleImportClippings}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Import Kindle &quot;My Clippings.txt&quot; or CSV Highlights
                </h3>
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="text-sm text-slate-500"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Paste standard Kindle <code>My Clippings.txt</code> blocks (separated by{' '}
                <code>==========</code>) or CSV rows (<code>Highlight,Title,Author</code>) below:
              </p>
              <textarea
                rows={7}
                value={clippingsText}
                onChange={(e) => setClippingsText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Import Highlights Now
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
