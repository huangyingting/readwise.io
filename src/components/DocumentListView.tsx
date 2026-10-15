'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReader } from '@/context/ReaderContext';
import { ReaderDocument } from '@/lib/query-dsl';
import {
  Archive,
  Clock,
  Inbox,
  Star,
  Trash2,
  Tag,
  MoreHorizontal,
  LayoutList,
  LayoutGrid,
  AlignJustify,
  ArrowUpDown,
  CheckSquare,
  Square,
  FileText,
  Video,
  BookOpen,
  Mail,
  Rss,
  Globe,
  Headphones,
  MessageSquare,
  Sparkles,
  Check,
  Plus,
} from 'lucide-react';

interface DocumentListViewProps {
  documents: ReaderDocument[];
  emptyTitle?: string;
  emptySubtitle?: string;
  showLocationTabs?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: { key: string; label: string; count?: number }[];
  banner?: React.ReactNode;
  isTrashView?: boolean;
}

export function DocumentListView({
  documents,
  emptyTitle = 'No documents in this view',
  emptySubtitle = 'Press "a" or click "+ Add" to save a URL, upload a PDF/EPUB, or subscribe to an RSS feed.',
  showLocationTabs = false,
  activeTab,
  onTabChange,
  tabs = [],
  banner,
  isTrashView = false,
}: DocumentListViewProps) {
  const router = useRouter();
  const {
    focusedDocId,
    setFocusedDocId,
    selectedDocIds,
    setSelectedDocIds,
    toggleSelectDoc,
    triageDocument,
    mutateState,
    tags,
    setIsAddDocumentModalOpen,
  } = useReader();

  const [layoutMode, setLayoutMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [sortBy, setSortBy] = useState<'savedAt' | 'publishedDate' | 'readingMinutes' | 'title'>('savedAt');
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'domain'>('none');
  const [viewOptionsOpen, setViewOptionsOpen] = useState(false);
  const [tagPopoverDocId, setTagPopoverDocId] = useState<string | null>(null);
  const [newTagText, setNewTagText] = useState('');

  const sortedDocs = useMemo(() => {
    const copy = [...documents];
    copy.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'readingMinutes') return a.readingMinutes - b.readingMinutes;
      if (sortBy === 'publishedDate') {
        return (
          new Date(b.publishedDate || b.savedAt).getTime() -
          new Date(a.publishedDate || a.savedAt).getTime()
        );
      }
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
    return copy;
  }, [documents, sortBy]);

  // Keep focusedDocId valid
  useEffect(() => {
    if (sortedDocs.length > 0 && (!focusedDocId || !sortedDocs.some((d) => d.id === focusedDocId))) {
      setFocusedDocId(sortedDocs[0].id);
    }
  }, [sortedDocs, focusedDocId, setFocusedDocId]);

  // List-level keyboard shortcuts (j, k, Enter, e, l, i, s, d, x, Shift+X)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (sortedDocs.length === 0) return;
      const currentIndex = Math.max(
        0,
        sortedDocs.findIndex((d) => d.id === focusedDocId)
      );
      const currentDoc = sortedDocs[currentIndex];

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = sortedDocs[Math.min(sortedDocs.length - 1, currentIndex + 1)];
        if (next) setFocusedDocId(next.id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = sortedDocs[Math.max(0, currentIndex - 1)];
        if (prev) setFocusedDocId(prev.id);
      } else if (e.key === 'Enter' && currentDoc) {
        e.preventDefault();
        router.push(`/new/read/${currentDoc.id}`);
      } else if (e.key === 'e' && currentDoc) {
        e.preventDefault();
        triageDocument(currentDoc.id, { triageStatus: 'archive' });
      } else if (e.key === 'l' && currentDoc) {
        e.preventDefault();
        triageDocument(currentDoc.id, { triageStatus: 'later' });
      } else if (e.key === 'i' && currentDoc) {
        e.preventDefault();
        triageDocument(currentDoc.id, { triageStatus: 'new' });
      } else if (e.key === 's' && currentDoc) {
        e.preventDefault();
        triageDocument(currentDoc.id, { isShortlisted: !currentDoc.isShortlisted });
      } else if (e.key === 'd' && currentDoc) {
        e.preventDefault();
        triageDocument(currentDoc.id, { triageStatus: 'trash' });
      } else if (e.key === 'x' && currentDoc) {
        e.preventDefault();
        toggleSelectDoc(currentDoc.id);
      } else if (e.key === 'X') {
        e.preventDefault();
        if (selectedDocIds.length === sortedDocs.length) {
          setSelectedDocIds([]);
        } else {
          setSelectedDocIds(sortedDocs.map((d) => d.id));
        }
      } else if (e.key === 'a') {
        e.preventDefault();
        setIsAddDocumentModalOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    sortedDocs,
    focusedDocId,
    setFocusedDocId,
    router,
    triageDocument,
    toggleSelectDoc,
    selectedDocIds,
    setSelectedDocIds,
    setIsAddDocumentModalOpen,
  ]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'pdf':
        return <FileText className="h-3.5 w-3.5 text-red-500" />;
      case 'epub':
        return <BookOpen className="h-3.5 w-3.5 text-amber-500" />;
      case 'video':
        return <Video className="h-3.5 w-3.5 text-rose-500" />;
      case 'email':
        return <Mail className="h-3.5 w-3.5 text-indigo-500" />;
      case 'tweet':
        return <MessageSquare className="h-3.5 w-3.5 text-sky-500" />;
      case 'podcast':
        return <Headphones className="h-3.5 w-3.5 text-purple-500" />;
      default:
        return <Globe className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  const groupedDocs = useMemo(() => {
    if (groupBy === 'none') {
      return [{ groupTitle: '', items: sortedDocs }];
    }
    const map = new Map<string, ReaderDocument[]>();
    for (const d of sortedDocs) {
      const key = groupBy === 'category' ? d.category.toUpperCase() : d.domain;
      const list = map.get(key) || [];
      list.push(d);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([groupTitle, items]) => ({
      groupTitle,
      items,
    }));
  }, [sortedDocs, groupBy]);

  return (
    <div className="flex flex-col">
      {banner}

      {/* Top Sub-Toolbar: Tabs + Bulk Actions + Sort/View Options */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white/95 px-5 py-2.5 backdrop-blur-xs dark:border-[#222631] dark:bg-[#0f1115]/95">
        <div className="flex items-center gap-1.5">
          {showLocationTabs &&
            tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      activeTab === tab.key
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200/70 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}

          {!showLocationTabs && (
            <span className="text-xs font-medium text-gray-500">
              Showing <strong>{sortedDocs.length}</strong> documents • Use <kbd className="rounded border px-1 font-mono text-[10px]">j</kbd>/<kbd className="rounded border px-1 font-mono text-[10px]">k</kbd> to navigate
            </span>
          )}
        </div>

        {/* Bulk Action Bar or Sort/View Controls */}
        <div className="relative flex items-center gap-2">
          {selectedDocIds.length > 0 ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
              <span>{selectedDocIds.length} selected</span>
              <button
                onClick={() => {
                  mutateState(
                    'bulk-triage',
                    { documentIds: selectedDocIds, bulkOp: 'mark_seen' },
                    `Marked ${selectedDocIds.length} items seen`
                  );
                  setSelectedDocIds([]);
                }}
                className="rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
              >
                Mark Seen
              </button>
              <button
                onClick={() => {
                  mutateState(
                    'bulk-triage',
                    { documentIds: selectedDocIds, bulkOp: 'later' },
                    `Moved ${selectedDocIds.length} items to Later`
                  );
                  setSelectedDocIds([]);
                }}
                className="rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
              >
                Later
              </button>
              <button
                onClick={() => {
                  mutateState(
                    'bulk-triage',
                    { documentIds: selectedDocIds, bulkOp: 'archive' },
                    `Archived ${selectedDocIds.length} items`
                  );
                  setSelectedDocIds([]);
                }}
                className="rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
              >
                Archive
              </button>
              <button
                onClick={() => {
                  mutateState(
                    'bulk-triage',
                    { documentIds: selectedDocIds, bulkOp: 'delete' },
                    `Moved ${selectedDocIds.length} items to Trash`
                  );
                  setSelectedDocIds([]);
                }}
                className="rounded bg-red-500/80 px-2 py-0.5 hover:bg-red-500"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedDocIds([])}
                className="ml-1 text-[11px] underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center rounded-lg border border-gray-200 p-0.5 dark:border-gray-800">
                <button
                  title="List View"
                  onClick={() => setLayoutMode('list')}
                  className={`rounded-md p-1 ${
                    layoutMode === 'list'
                      ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
                      : 'text-gray-400'
                  }`}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </button>
                <button
                  title="Grid Card View"
                  onClick={() => setLayoutMode('grid')}
                  className={`rounded-md p-1 ${
                    layoutMode === 'grid'
                      ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
                      : 'text-gray-400'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  title="Compact Table View"
                  onClick={() => setLayoutMode('compact')}
                  className={`rounded-md p-1 ${
                    layoutMode === 'compact'
                      ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
                      : 'text-gray-400'
                  }`}
                >
                  <AlignJustify className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={() => setViewOptionsOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort &amp; Group
              </button>

              {viewOptionsOpen && (
                <div className="absolute right-0 top-9 z-30 w-56 rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-xl dark:border-gray-800 dark:bg-[#181c26]">
                  <div className="font-semibold text-gray-500">Sort By</div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 p-1.5 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="savedAt">Date Saved (Newest)</option>
                    <option value="publishedDate">Date Published</option>
                    <option value="readingMinutes">Reading Time (Shortest)</option>
                    <option value="title">Title (A–Z)</option>
                  </select>

                  <div className="mt-3 font-semibold text-gray-500">Group By</div>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 p-1.5 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="none">No Grouping</option>
                    <option value="category">Document Category</option>
                    <option value="domain">Source Domain</option>
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Document Rows / Cards */}
      {sortedDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-700" />
          <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">{emptyTitle}</h3>
          <p className="mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400">{emptySubtitle}</p>
        </div>
      ) : (
        <div className="p-4">
          {groupedDocs.map((group) => (
            <div key={group.groupTitle || 'all'} className="mb-6 last:mb-0">
              {group.groupTitle && (
                <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  {group.groupTitle} ({group.items.length})
                </div>
              )}

              <div
                className={
                  layoutMode === 'grid'
                    ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
                    : 'divide-y divide-gray-100 dark:divide-[#1c202b]'
                }
              >
                {group.items.map((doc) => {
                  const isFocused = focusedDocId === doc.id;
                  const isSelected = selectedDocIds.includes(doc.id);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setFocusedDocId(doc.id)}
                      onDoubleClick={() => router.push(`/new/read/${doc.id}`)}
                      className={`group relative flex transition ${
                        layoutMode === 'grid'
                          ? 'flex-col justify-between rounded-2xl border p-4'
                          : layoutMode === 'compact'
                          ? 'items-center justify-between rounded-lg px-3 py-2'
                          : 'items-start justify-between gap-4 rounded-xl px-3.5 py-3.5'
                      } ${
                        isFocused
                          ? 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#151923]'
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        {/* Selection Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectDoc(doc.id);
                          }}
                          className={`mt-1 text-gray-400 hover:text-blue-600 ${
                            isSelected ? 'opacity-100 text-blue-600' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        {/* Unseen Blue Dot */}
                        <div className="mt-2 shrink-0">
                          {!doc.isSeen ? (
                            <span
                              title="Unseen"
                              className="block h-2 w-2 rounded-full bg-blue-600"
                            />
                          ) : (
                            <span className="block h-2 w-2 rounded-full bg-transparent" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Title + Meta */}
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(doc.category)}
                            <Link
                              href={`/new/read/${doc.id}`}
                              className="truncate text-sm font-bold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                            >
                              {doc.title}
                            </Link>
                            {doc.isShortlisted && (
                              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                            )}
                          </div>

                          {layoutMode !== 'compact' && (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                              {doc.summary}
                            </p>
                          )}

                          {/* Bottom Metadata Row */}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                              {doc.author}
                            </span>
                            <span>•</span>
                            <span>{doc.domain}</span>
                            <span>•</span>
                            <span>{doc.readingMinutes}m read</span>
                            {doc.readingProgress > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {doc.readingProgress}% read
                                </span>
                              </>
                            )}
                            {doc.annotations?.length > 0 && (
                              <span className="rounded bg-yellow-400/20 px-1.5 py-0.2 text-[10px] font-semibold text-yellow-700 dark:text-yellow-300">
                                {doc.annotations.length} highlights
                              </span>
                            )}
                            {doc.tags?.map((t) => (
                              <Link
                                key={t}
                                href={`/filtered?query=${encodeURIComponent(`tag:${t}`)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-800 dark:text-gray-300"
                              >
                                #{t}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Hover Quick Action Toolbar */}
                      <div className="relative flex shrink-0 items-center gap-1 opacity-85 group-hover:opacity-100">
                        {isTrashView ? (
                          <>
                            <button
                              title="Restore to Inbox"
                              onClick={(e) => {
                                e.stopPropagation();
                                triageDocument(doc.id, { triageStatus: 'new' }, 'Restored document to Inbox');
                              }}
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            >
                              Restore
                            </button>
                            <button
                              title="Delete Permanently"
                              onClick={(e) => {
                                e.stopPropagation();
                                mutateState(
                                  'delete-document',
                                  { documentId: doc.id, permanent: true },
                                  'Permanently deleted document'
                                );
                              }}
                              className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500"
                            >
                              Delete Forever
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              title="Move to Inbox (i)"
                              onClick={(e) => {
                                e.stopPropagation();
                                triageDocument(doc.id, { triageStatus: 'new' });
                              }}
                              className={`rounded-lg p-1.5 hover:bg-gray-200/70 dark:hover:bg-gray-800 ${
                                doc.triageStatus === 'new' ? 'text-blue-600' : 'text-gray-400'
                              }`}
                            >
                              <Inbox className="h-4 w-4" />
                            </button>
                            <button
                              title="Move to Later (l)"
                              onClick={(e) => {
                                e.stopPropagation();
                                triageDocument(doc.id, { triageStatus: 'later' });
                              }}
                              className={`rounded-lg p-1.5 hover:bg-gray-200/70 dark:hover:bg-gray-800 ${
                                doc.triageStatus === 'later' ? 'text-amber-500' : 'text-gray-400'
                              }`}
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                            <button
                              title="Move to Archive (e)"
                              onClick={(e) => {
                                e.stopPropagation();
                                triageDocument(doc.id, { triageStatus: 'archive' });
                              }}
                              className={`rounded-lg p-1.5 hover:bg-gray-200/70 dark:hover:bg-gray-800 ${
                                doc.triageStatus === 'archive' ? 'text-emerald-500' : 'text-gray-400'
                              }`}
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                            <button
                              title="Toggle Shortlist (s)"
                              onClick={(e) => {
                                e.stopPropagation();
                                triageDocument(doc.id, { isShortlisted: !doc.isShortlisted });
                              }}
                              className={`rounded-lg p-1.5 hover:bg-gray-200/70 dark:hover:bg-gray-800 ${
                                doc.isShortlisted ? 'text-amber-400' : 'text-gray-400'
                              }`}
                            >
                              <Star className="h-4 w-4" />
                            </button>
                            <button
                              title="Tag Document (t)"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTagPopoverDocId(tagPopoverDocId === doc.id ? null : doc.id);
                              }}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-800"
                            >
                              <Tag className="h-4 w-4" />
                            </button>
                            <button
                              title="Move to Trash (d)"
                              onClick={(e) => {
                                e.stopPropagation();
                                triageDocument(doc.id, { triageStatus: 'trash' });
                              }}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {/* Inline Tag Picker Popover */}
                        {tagPopoverDocId === doc.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-9 z-30 w-56 rounded-xl border border-gray-200 bg-white p-2.5 text-xs shadow-xl dark:border-gray-700 dark:bg-[#1a1f2b]"
                          >
                            <div className="font-semibold text-gray-500">Toggle Document Tags</div>
                            <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
                              {tags.map((t) => {
                                const hasTag = doc.tags?.includes(t.name);
                                return (
                                  <button
                                    key={t.id}
                                    onClick={() =>
                                      mutateState(
                                        'toggle-document-tag',
                                        { documentId: doc.id, tagName: t.name },
                                        `Updated tag #${t.name}`
                                      )
                                    }
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    <span>#{t.name}</span>
                                    {hasTag && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                  </button>
                                );
                              })}
                            </div>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!newTagText.trim()) return;
                                mutateState(
                                  'toggle-document-tag',
                                  { documentId: doc.id, tagName: newTagText.trim() },
                                  `Added tag #${newTagText.trim()}`
                                );
                                setNewTagText('');
                              }}
                              className="mt-2 flex gap-1 border-t border-gray-100 pt-2 dark:border-gray-800"
                            >
                              <input
                                type="text"
                                value={newTagText}
                                onChange={(e) => setNewTagText(e.target.value)}
                                placeholder="New tag..."
                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                              />
                              <button
                                type="submit"
                                className="rounded bg-blue-600 px-2 py-1 text-white"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
