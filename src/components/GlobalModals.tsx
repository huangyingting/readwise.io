'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReader } from '@/context/ReaderContext';
import { QUERY_DSL_SUGGESTIONS, evaluateQueryDsl } from '@/lib/query-dsl';
import {
  Search,
  Plus,
  X,
  Command,
  Inbox,
  Clock,
  Archive,
  Star,
  Rss,
  Tag,
  Filter,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  Upload,
  Link2,
  Keyboard,
  Settings,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export function GlobalModals() {
  const router = useRouter();
  const {
    documents,
    filteredViews,
    tags,
    settings,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isShortcutsReferenceOpen,
    setIsShortcutsReferenceOpen,
    isAddDocumentModalOpen,
    setIsAddDocumentModalOpen,
    addModalDefaultTab,
    setAddModalDefaultTab,
    isFilteredViewModalOpen,
    setIsFilteredViewModalOpen,
    editingFilteredView,
    setEditingFilteredView,
    focusedDocId,
    mutateState,
    triageDocument,
    toggleTheme,
    undoLastMutation,
    toasts,
    dismissToast,
  } = useReader();

  // Command Palette state
  const [cmdQuery, setCmdQuery] = useState('');

  // Add Document Modal state
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlCategory, setUrlCategory] = useState('');
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadBase64, setUploadBase64] = useState('');
  const [uploadTextContent, setUploadTextContent] = useState('');
  const [feedUrlInput, setFeedUrlInput] = useState('');
  const [feedTitleInput, setFeedTitleInput] = useState('');
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  // Filtered View Builder state
  const [fvName, setFvName] = useState('');
  const [fvQuery, setFvQuery] = useState('category:article AND minutes__lt:10');
  const [fvPin, setFvPin] = useState(true);

  const activeDocId = focusedDocId || documents[0]?.id;

  const commands = [
    {
      id: 'nav-home',
      section: 'Navigation',
      label: 'Go to Home Dashboard',
      shortcut: 'g h',
      action: () => router.push('/home'),
    },
    {
      id: 'nav-inbox',
      section: 'Navigation',
      label: 'Go to Library Inbox',
      shortcut: 'g i',
      action: () => router.push('/new'),
    },
    {
      id: 'nav-later',
      section: 'Navigation',
      label: 'Go to Later Queue',
      shortcut: 'g l',
      action: () => router.push('/later'),
    },
    {
      id: 'nav-archive',
      section: 'Navigation',
      label: 'Go to Archive',
      shortcut: 'g a',
      action: () => router.push('/archive'),
    },
    {
      id: 'nav-shortlist',
      section: 'Navigation',
      label: 'Go to Shortlist',
      shortcut: 'g s',
      action: () => router.push('/filtered?id=shortlist'),
    },
    {
      id: 'nav-feed',
      section: 'Navigation',
      label: 'Go to RSS Feed',
      shortcut: 'g f',
      action: () => router.push('/feed'),
    },
    {
      id: 'nav-daily-review',
      section: 'Readwise Spaced Repetition',
      label: 'Start Daily Review (SM-2 Spaced Repetition)',
      shortcut: 'g r',
      action: () => router.push('/daily-review'),
    },
    {
      id: 'nav-highlights',
      section: 'Readwise Spaced Repetition',
      label: 'All Highlights & Visual Quote Studio',
      shortcut: 'g y',
      action: () => router.push('/highlights'),
    },
    {
      id: 'nav-books',
      section: 'Readwise Spaced Repetition',
      label: 'Books, Sources & Supplemental Highlights',
      shortcut: 'g b',
      action: () => router.push('/books'),
    },
    {
      id: 'nav-mastery',
      section: 'Readwise Spaced Repetition',
      label: 'Flashcard & Cloze Deletion Mastery Deck',
      shortcut: 'g m',
      action: () => router.push('/mastery'),
    },
    {
      id: 'act-sync-feeds',
      section: 'Actions',
      label: 'Sync All Subscribed RSS/Atom Feeds Live',
      shortcut: 'Shift+R',
      action: () => mutateState('refresh-feeds', {}, 'Synced live RSS/Atom feeds'),
    },
    {
      id: 'nav-ghostreader',
      section: 'Ghostreader AI',
      label: 'Ask Ghostreader Across Entire Library',
      shortcut: 'G',
      action: () => router.push('/ghostreader'),
    },
    {
      id: 'act-add-doc',
      section: 'Actions',
      label: 'Save URL / Upload PDF or EPUB / Subscribe to RSS Feed',
      shortcut: 'a',
      action: () => {
        setAddModalDefaultTab('url');
        setIsAddDocumentModalOpen(true);
      },
    },
    {
      id: 'act-create-view',
      section: 'Actions',
      label: 'Create Custom Filtered View (Query DSL)',
      shortcut: 'v',
      action: () => {
        setEditingFilteredView(null);
        setFvName('');
        setFvQuery('category:article AND minutes__lt:10');
        setIsFilteredViewModalOpen(true);
      },
    },
    {
      id: 'act-archive-focused',
      section: 'Document Triage',
      label: 'Move Focused Document to Archive',
      shortcut: 'e',
      action: () => activeDocId && triageDocument(activeDocId, { triageStatus: 'archive' }),
    },
    {
      id: 'act-later-focused',
      section: 'Document Triage',
      label: 'Move Focused Document to Later',
      shortcut: 'l',
      action: () => activeDocId && triageDocument(activeDocId, { triageStatus: 'later' }),
    },
    {
      id: 'act-shortlist-focused',
      section: 'Document Triage',
      label: 'Toggle Shortlist on Focused Document',
      shortcut: 's',
      action: () => {
        const doc = documents.find((d) => d.id === activeDocId);
        if (doc) triageDocument(doc.id, { isShortlisted: !doc.isShortlisted });
      },
    },
    {
      id: 'act-undo',
      section: 'Document Triage',
      label: 'Undo Last Action',
      shortcut: 'z',
      action: () => undoLastMutation(),
    },
    {
      id: 'ui-theme',
      section: 'Appearance & Settings',
      label: `Switch Theme (Current: ${settings?.theme || 'light'})`,
      shortcut: 'Cmd+Shift+L',
      action: () => toggleTheme(),
    },
    {
      id: 'ui-shortcuts',
      section: 'Appearance & Settings',
      label: 'View & Customize Keyboard Shortcuts',
      shortcut: '?',
      action: () => setIsShortcutsReferenceOpen(true),
    },
    {
      id: 'ui-prefs',
      section: 'Appearance & Settings',
      label: 'Open Reader Preferences & Export Templates',
      shortcut: ',',
      action: () => router.push('/preferences'),
    },
    {
      id: 'ui-ghostreader-prefs',
      section: 'Ghostreader AI',
      label: 'Customize Ghostreader Jinja2 Prompts',
      shortcut: 'Shift+P',
      action: () => router.push('/ghostreader/preferences'),
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
      c.section.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdd(true);
    try {
      if (addModalDefaultTab === 'url' && urlInput.trim()) {
        const res = await mutateState(
          'add-document-url',
          {
            url: urlInput.trim(),
            title: urlTitle.trim() || undefined,
            category: urlCategory || undefined,
          },
          'Saved URL to Library Inbox',
          false
        );
        setUrlInput('');
        setUrlTitle('');
        setIsAddDocumentModalOpen(false);
        if (res?.document?.id) {
          router.push(`/new/read/${res.document.id}`);
        }
      } else if (addModalDefaultTab === 'upload') {
        const lowerName = (uploadFilename || '').toLowerCase();
        if (lowerName.endsWith('.opml') && uploadTextContent) {
          await mutateState(
            'import-opml',
            { opmlContent: uploadTextContent },
            'Imported OPML RSS subscriptions',
            false
          );
          setIsAddDocumentModalOpen(false);
          router.push('/feed');
          return;
        }
        const res = await mutateState(
          'upload-document-file',
          {
            filename: uploadFilename.trim() || 'Uploaded-Research-Paper.pdf',
            contentPreview: uploadPreview.trim() || undefined,
            base64Data: uploadBase64 || undefined,
            textContent: uploadTextContent || undefined,
          },
          'Uploaded & parsed file into Library Inbox',
          false
        );
        setUploadFilename('');
        setUploadPreview('');
        setUploadBase64('');
        setUploadTextContent('');
        setIsAddDocumentModalOpen(false);
        if (res?.document?.id) {
          router.push(`/new/read/${res.document.id}`);
        }
      } else if (addModalDefaultTab === 'feed' && feedUrlInput.trim()) {
        await mutateState(
          'subscribe-feed',
          {
            url: feedUrlInput.trim(),
            title: feedTitleInput.trim() || undefined,
          },
          'Subscribed to RSS Feed',
          false
        );
        setFeedUrlInput('');
        setFeedTitleInput('');
        setIsAddDocumentModalOpen(false);
        router.push('/feed');
      }
    } finally {
      setIsSavingAdd(false);
    }
  };

  const handleSaveFilteredView = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = editingFilteredView ? editingFilteredView.query : fvQuery;
    const nameStr = editingFilteredView ? editingFilteredView.name : fvName || queryStr;
    if (editingFilteredView?.id && !editingFilteredView.id.startsWith('builtin')) {
      await mutateState(
        'update-filtered-view',
        {
          viewId: editingFilteredView.id,
          name: nameStr,
          query: queryStr,
          isPinned: fvPin,
        },
        `Updated Filtered View "${nameStr}"`
      );
      setIsFilteredViewModalOpen(false);
    } else {
      const res = await mutateState(
        'create-filtered-view',
        {
          name: nameStr,
          query: queryStr,
          isPinned: fvPin,
        },
        `Created Filtered View "${nameStr}"`
      );
      setIsFilteredViewModalOpen(false);
      if (res?.filteredView?.key) {
        router.push(`/filtered?id=${res.filteredView.key}`);
      }
    }
  };

  const liveMatchingDocs = evaluateQueryDsl(
    documents,
    editingFilteredView ? editingFilteredView.query : fvQuery
  );

  return (
    <>
      {/* 1. Command Palette (Cmd+K) */}
      {isCommandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 backdrop-blur-xs"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Command Palette"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#151922]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3.5 dark:border-gray-800">
              <Command className="h-4 w-4 text-blue-500" />
              <input
                autoFocus
                type="text"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Type a command or search actions... (e.g., Archive, Ghostreader, Dark Mode)"
                className="w-full bg-transparent text-sm text-gray-900 focus:outline-none dark:text-white"
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setIsCommandPaletteOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                >
                  <div>
                    <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {cmd.section}
                    </span>
                    <span className="font-medium">{cmd.label}</span>
                  </div>
                  <kbd className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    {cmd.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Document / Upload / Feed Modal */}
      {isAddDocumentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setIsAddDocumentModalOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Add to Readwise Reader"
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-[#151922]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Add to Readwise Reader
              </h3>
              <button
                onClick={() => setIsAddDocumentModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1 text-xs font-semibold dark:bg-gray-800/80">
              <button
                type="button"
                onClick={() => setAddModalDefaultTab('url')}
                className={`rounded-lg py-2 transition ${
                  addModalDefaultTab === 'url'
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-[#1e2433] dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Save URL / Video
              </button>
              <button
                type="button"
                onClick={() => setAddModalDefaultTab('upload')}
                className={`rounded-lg py-2 transition ${
                  addModalDefaultTab === 'upload'
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-[#1e2433] dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Upload PDF / EPUB
              </button>
              <button
                type="button"
                onClick={() => setAddModalDefaultTab('feed')}
                className={`rounded-lg py-2 transition ${
                  addModalDefaultTab === 'feed'
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-[#1e2433] dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Subscribe RSS Feed
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              {addModalDefaultTab === 'url' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Web Article, YouTube Video, PDF, or X Thread URL
                    </label>
                    <input
                      autoFocus
                      required
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://paulgraham.com/superlinear.html or https://youtube.com/watch?v=..."
                      className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        Custom Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={urlTitle}
                        onChange={(e) => setUrlTitle(e.target.value)}
                        placeholder="Auto-detected from URL"
                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        Category Override
                      </label>
                      <select
                        value={urlCategory}
                        onChange={(e) => setUrlCategory(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
                      >
                        <option value="">Auto-detect</option>
                        <option value="article">Article</option>
                        <option value="video">Video (YouTube)</option>
                        <option value="pdf">PDF Document</option>
                        <option value="epub">EPUB Book</option>
                        <option value="tweet">Tweet / Thread</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {addModalDefaultTab === 'upload' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Choose Local PDF, EPUB, HTML, Markdown, or OPML File
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.epub,.html,.htm,.txt,.md,.opml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadFilename(file.name);
                          // Read binary as base64 for PDF/EPUB parsing
                          const b64Reader = new FileReader();
                          b64Reader.onload = () => {
                            const res = String(b64Reader.result || '');
                            const commaIdx = res.indexOf(',');
                            setUploadBase64(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
                          };
                          b64Reader.readAsDataURL(file);

                          // Also read text for HTML/MD/TXT/OPML
                          const txtReader = new FileReader();
                          txtReader.onload = () => {
                            setUploadTextContent(String(txtReader.result || ''));
                          };
                          txtReader.readAsText(file);
                        }
                      }}
                      className="mt-1.5 w-full rounded-xl border border-dashed border-gray-300 p-3 text-xs dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Or Enter Filename Directly
                    </label>
                    <input
                      type="text"
                      value={uploadFilename}
                      onChange={(e) => setUploadFilename(e.target.value)}
                      placeholder="Scaling-Laws-for-Neural-Language-Models.pdf"
                      className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Extracted Text / Executive Summary (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={uploadPreview}
                      onChange={(e) => setUploadPreview(e.target.value)}
                      placeholder="Paste abstract or notes to include in the document..."
                      className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-xs dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                </>
              )}

              {addModalDefaultTab === 'feed' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      RSS / Atom Feed URL
                    </label>
                    <input
                      autoFocus
                      required
                      type="url"
                      value={feedUrlInput}
                      onChange={(e) => setFeedUrlInput(e.target.value)}
                      placeholder="https://overreacted.io/rss.xml"
                      className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Feed Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={feedTitleInput}
                      onChange={(e) => setFeedTitleInput(e.target.value)}
                      placeholder="Overreacted — Dan Abramov"
                      className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDocumentModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdd}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSavingAdd ? 'Saving...' : 'Save to Reader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Filtered View Query DSL Builder Modal */}
      {isFilteredViewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setIsFilteredViewModalOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Filtered View Query Builder"
            className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-[#151922]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingFilteredView ? 'Edit Filtered View' : 'New Filtered View (Query DSL)'}
                </h3>
              </div>
              <button
                onClick={() => setIsFilteredViewModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFilteredView} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  View Name
                </label>
                <input
                  type="text"
                  required
                  value={editingFilteredView ? editingFilteredView.name : fvName}
                  onChange={(e) =>
                    editingFilteredView
                      ? setEditingFilteredView({ ...editingFilteredView, name: e.target.value })
                      : setFvName(e.target.value)
                  }
                  placeholder="e.g., High-Signal AI Research (<15 mins)"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Boolean Query DSL
                  </label>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {liveMatchingDocs.length} matching documents
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={editingFilteredView ? editingFilteredView.query : fvQuery}
                  onChange={(e) =>
                    editingFilteredView
                      ? setEditingFilteredView({ ...editingFilteredView, query: e.target.value })
                      : setFvQuery(e.target.value)
                  }
                  placeholder='category:article AND (in:inbox OR in:later) AND minutes__lt:15'
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 font-mono text-xs text-blue-700 dark:border-gray-700 dark:bg-gray-900 dark:text-blue-300"
                />
              </div>

              {/* Quick DSL Token Insert Chips */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Click a Query Parameter to Append:
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUERY_DSL_SUGGESTIONS.slice(0, 10).map((s) => (
                    <button
                      key={s.token}
                      type="button"
                      onClick={() => {
                        const cur = editingFilteredView ? editingFilteredView.query : fvQuery;
                        const next = cur ? `${cur} AND ${s.token}` : s.token;
                        if (editingFilteredView) {
                          setEditingFilteredView({ ...editingFilteredView, query: next });
                        } else {
                          setFvQuery(next);
                        }
                      }}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[11px] text-gray-700 hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {s.token}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={fvPin}
                  onChange={(e) => setFvPin(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Pin this view to Left Navigation Sidebar
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFilteredViewModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  Save Filtered View
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Keyboard Shortcuts Reference Modal (?) */}
      {isShortcutsReferenceOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setIsShortcutsReferenceOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Keyboard Shortcuts Reference"
            className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-[#151922]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Keyboard Shortcuts Reference
                </h3>
              </div>
              <button
                onClick={() => setIsShortcutsReferenceOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid max-h-[65vh] gap-3 overflow-y-auto sm:grid-cols-2">
              {Object.entries(settings?.shortcuts || {}).map(([key, item]: [string, any]) => {
                const label = typeof item === 'string' ? key : item?.label || key;
                const binding = typeof item === 'string' ? item : item?.binding || '';
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-2 text-xs dark:border-gray-800 dark:bg-gray-900/50"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{label}</span>
                    <kbd className="rounded border border-gray-300 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400">
                      {binding}
                    </kbd>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 text-xs dark:border-gray-800">
              <span className="text-gray-500">
                Press <kbd className="font-mono font-bold">?</kbd> anytime to toggle this overlay.
              </span>
              <button
                onClick={() => {
                  setIsShortcutsReferenceOpen(false);
                  router.push('/preferences/shortcuts');
                }}
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Customize Keybindings →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Global Toast Notifications with Undo ('z') */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-xs font-medium text-white shadow-xl"
          >
            <span>{t.message}</span>
            {t.canUndo && (
              <button
                onClick={() => {
                  undoLastMutation();
                  dismissToast(t.id);
                }}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500"
              >
                <RotateCcw className="h-3 w-3" />
                Undo (z)
              </button>
            )}
            <button
              onClick={() => dismissToast(t.id)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
