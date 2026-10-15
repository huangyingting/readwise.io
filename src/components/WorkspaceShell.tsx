'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useReader } from '@/context/ReaderContext';
import { GlobalModals } from './GlobalModals';
import {
  Home,
  Inbox,
  Clock,
  Archive,
  Star,
  Rss,
  Tag,
  Filter,
  Sparkles,
  Search,
  Trash2,
  Plus,
  Settings,
  User,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sun,
  Moon,
  Keyboard,
  Mail,
  Puzzle,
  Download,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  Headphones,
  MessageSquare,
} from 'lucide-react';

interface WorkspaceShellProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export function WorkspaceShell(props: WorkspaceShellProps) {
  return (
    < React.Suspense fallback={<div className="flex h-screen w-screen items-center justify-center text-sm text-gray-500">Loading Readwise Reader...</div>}>
      <WorkspaceShellInner {...props} />
    </React.Suspense>
  );
}

function WorkspaceShellInner({
  children,
  rightSidebar,
  title,
  subtitle,
  headerActions,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    user,
    settings,
    documents,
    filteredViews,
    isLeftSidebarCollapsed,
    setIsLeftSidebarCollapsed,
    isRightSidebarCollapsed,
    setIsRightSidebarCollapsed,
    setIsCommandPaletteOpen,
    setIsShortcutsReferenceOpen,
    setIsAddDocumentModalOpen,
    setAddModalDefaultTab,
    setIsFilteredViewModalOpen,
    setEditingFilteredView,
    toggleTheme,
    focusedDocId,
    mutateState,
    triageDocument,
  } = useReader();

  const [helpOpen, setHelpOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [docNoteDraft, setDocNoteDraft] = useState('');

  const activeDocs = documents.filter((d) => d.triageStatus !== 'trash');
  const inboxCount = documents.filter((d) => d.triageStatus === 'new').length;
  const laterCount = documents.filter((d) => d.triageStatus === 'later').length;
  const archiveCount = documents.filter((d) => d.triageStatus === 'archive').length;
  const unseenFeedCount = documents.filter((d) => d.inFeed && !d.isSeen && d.triageStatus !== 'trash').length;
  const trashCount = documents.filter((d) => d.triageStatus === 'trash').length;

  const pinnedViews = filteredViews.filter((fv) => fv.isPinned);

  const inspectedDoc =
    documents.find((d) => d.id === focusedDocId) ||
    activeDocs[0] ||
    null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-900 dark:bg-[#0f1115] dark:text-gray-100">
      {/* PANE 1: Left Navigation Sidebar */}
      {!isLeftSidebarCollapsed && (
        <aside className="flex w-60 shrink-0 flex-col justify-between border-r border-gray-200 bg-gray-50/70 select-none dark:border-[#222631] dark:bg-[#13161d]">
          {/* Top Brand + Add Action */}
          <div className="flex flex-col overflow-y-auto px-3 pt-3 pb-4">
            <div className="mb-3 flex items-center justify-between px-2">
              <Link href="/home" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-xs">
                  R
                </div>
                <span className="text-sm font-bold tracking-tight">Reader</span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  {user?.trialDaysRemaining ?? 30}d trial
                </span>
              </Link>

              <div className="flex items-center gap-1">
                <button
                  title="Add Document, PDF, EPUB or RSS Feed (a)"
                  onClick={() => {
                    setAddModalDefaultTab('url');
                    setIsAddDocumentModalOpen(true);
                  }}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  title="Toggle Left Sidebar ([)"
                  onClick={() => setIsLeftSidebarCollapsed(true)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Primary Navigation */}
            <nav className="space-y-0.5 text-xs font-medium">
              <Link
                href="/home"
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition ${
                  pathname === '/home'
                    ? 'bg-blue-600/10 font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Home className="h-4 w-4" />
                  Home
                </span>
              </Link>

              <Link
                href="/new"
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition ${
                  pathname === '/new' || pathname === '/later' || pathname === '/archive'
                    ? 'bg-blue-600/10 font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Inbox className="h-4 w-4" />
                  Library
                </span>
                {settings?.showSidebarCounts && (
                  <span className="text-[11px] text-gray-400">{inboxCount}</span>
                )}
              </Link>

              {/* Sub-locations under Library */}
              <div className="ml-5 space-y-0.5 border-l border-gray-200 pl-2 dark:border-gray-800">
                <Link
                  href="/new"
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] ${
                    pathname === '/new'
                      ? 'font-semibold text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <span>Inbox</span>
                  <span>{inboxCount}</span>
                </Link>
                <Link
                  href="/later"
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] ${
                    pathname === '/later'
                      ? 'font-semibold text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <span>Later</span>
                  <span>{laterCount}</span>
                </Link>
                <Link
                  href="/archive"
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] ${
                    pathname === '/archive'
                      ? 'font-semibold text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <span>Archive</span>
                  <span>{archiveCount}</span>
                </Link>
              </div>

              <Link
                href="/feed"
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition ${
                  pathname === '/feed'
                    ? 'bg-blue-600/10 font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Rss className="h-4 w-4" />
                  Feed
                </span>
                {settings?.showSidebarCounts && (
                  <span className="rounded-full bg-orange-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                    {unseenFeedCount}
                  </span>
                )}
              </Link>

              <Link
                href="/ghostreader"
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition ${
                  pathname.startsWith('/ghostreader')
                    ? 'bg-purple-600/10 font-semibold text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'
                    : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Ask Ghostreader
                </span>
              </Link>

              <Link
                href="/search"
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition ${
                  pathname === '/search'
                    ? 'bg-blue-600/10 font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Search className="h-4 w-4" />
                  Search
                </span>
                <kbd className="text-[10px] text-gray-400">/</kbd>
              </Link>
            </nav>

            {/* Readwise Spaced Repetition & Highlights */}
            <div className="mt-4 pt-3 border-t border-gray-200/80 dark:border-gray-800">
              <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Readwise Review
              </div>
              <div className="space-y-0.5 text-xs font-medium">
                <Link
                  href="/daily-review"
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
                    pathname === '/daily-review'
                      ? 'bg-amber-500/15 font-semibold text-amber-600 dark:text-amber-400'
                      : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span>🔥 Daily Review</span>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    {user?.dailyReviewStreak || 5}d
                  </span>
                </Link>
                <Link
                  href="/highlights"
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
                    pathname === '/highlights'
                      ? 'bg-blue-600/10 font-semibold text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span>✨ All Highlights</span>
                </Link>
                <Link
                  href="/books"
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
                    pathname === '/books'
                      ? 'bg-blue-600/10 font-semibold text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span>📚 Books &amp; Sources</span>
                </Link>
                <Link
                  href="/mastery"
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
                    pathname === '/mastery'
                      ? 'bg-blue-600/10 font-semibold text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span>🎴 Flashcard Mastery</span>
                </Link>
              </div>
            </div>

            {/* Pinned Filtered Views */}
            <div className="mt-5">
              <div className="flex items-center justify-between px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <Link href="/views" className="hover:text-gray-700 dark:hover:text-gray-200">
                  Views
                </Link>
                <button
                  title="New Filtered View"
                  onClick={() => {
                    setEditingFilteredView(null);
                    setIsFilteredViewModalOpen(true);
                  }}
                  className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-1.5 space-y-0.5 text-xs">
                {pinnedViews.map((fv) => {
                  const active =
                    pathname === '/filtered' && searchParams.get('id') === fv.key;
                  return (
                    <Link
                      key={fv.id}
                      href={`/filtered?id=${encodeURIComponent(fv.key)}`}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
                        active
                          ? 'bg-blue-600/10 font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                          : 'text-gray-600 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <span className="truncate">{fv.name}</span>
                      {settings?.showSidebarCounts && (
                        <span className="text-[10px] text-gray-400">{fv.matchingCount}</span>
                      )}
                    </Link>
                  );
                })}

                <Link
                  href="/views"
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-gray-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-800/60 ${
                    pathname === '/views' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    All Filtered Views
                  </span>
                </Link>

                <Link
                  href="/tags"
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-gray-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-800/60 ${
                    pathname === '/tags' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />
                    Manage Tags
                  </span>
                </Link>

                <Link
                  href="/trash"
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-gray-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-800/60 ${
                    pathname === '/trash' ? 'font-semibold text-red-600 dark:text-red-400' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5" />
                    Trash
                  </span>
                  {trashCount > 0 && <span className="text-[10px]">{trashCount}</span>}
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Account, Settings & Help Bar */}
          <div className="relative border-t border-gray-200 p-2.5 text-xs dark:border-[#222631]">
            {/* Account Popover */}
            {accountOpen && (
              <div className="absolute bottom-14 left-2.5 right-2.5 z-30 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-[#191d28]">
                <Link
                  href="/profile"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <User className="h-3.5 w-3.5" /> Profile &amp; Account
                </Link>
                <Link
                  href="/preferences"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Settings className="h-3.5 w-3.5" /> Preferences &amp; Export
                </Link>
                <Link
                  href="/preferences/shortcuts"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Keyboard className="h-3.5 w-3.5" /> Keyboard Shortcuts
                </Link>
                <Link
                  href="/integrations"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Puzzle className="h-3.5 w-3.5" /> Integrations
                </Link>
                <Link
                  href="/ghostreader/preferences"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" /> Ghostreader Prompts
                </Link>
                <Link
                  href="/add-to-library"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Mail className="h-3.5 w-3.5" /> Email to Library / Feed
                </Link>
                <Link
                  href="/resources"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Download className="h-3.5 w-3.5" /> Apps &amp; Extensions
                </Link>
              </div>
            )}

            {/* Help Popover */}
            {helpOpen && (
              <div className="absolute bottom-14 left-2.5 right-2.5 z-30 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-[#191d28]">
                <button
                  onClick={() => {
                    setHelpOpen(false);
                    setIsCommandPaletteOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span>Command Palette</span>
                  <kbd className="font-mono text-[10px] text-gray-400">Cmd+K</kbd>
                </button>
                <button
                  onClick={() => {
                    setHelpOpen(false);
                    setIsShortcutsReferenceOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span>Keyboard Reference</span>
                  <kbd className="font-mono text-[10px] text-gray-400">?</kbd>
                </button>
                <Link
                  href="/welcome"
                  onClick={() => setHelpOpen(false)}
                  className="block rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Re-run Welcome Wizard
                </Link>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setAccountOpen((prev) => !prev);
                  setHelpOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium text-gray-700 hover:bg-gray-200/60 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/15 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {(user?.firstName || 'A')[0]}
                </div>
                <span className="max-w-[95px] truncate">{user?.firstName || 'Alex'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  title="Switch Light / Dark Mode"
                  onClick={() => toggleTheme()}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200/70 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  {settings?.theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
                <button
                  title="Command Palette (Cmd+K)"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200/70 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <Keyboard className="h-4 w-4" />
                </button>
                <button
                  title="Help & Shortcuts (?)"
                  onClick={() => {
                    setHelpOpen((prev) => !prev);
                    setAccountOpen(false);
                  }}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200/70 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* PANE 2: Center Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Workspace Header */}
        <header className="flex h-13 shrink-0 items-center justify-between border-b border-gray-200 px-5 dark:border-[#222631]">
          <div className="flex items-center gap-3 min-w-0">
            {isLeftSidebarCollapsed && (
              <button
                title="Expand Left Sidebar ([)"
                onClick={() => setIsLeftSidebarCollapsed(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
            {title && (
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={() => {
                setAddModalDefaultTab('url');
                setIsAddDocumentModalOpen(true);
              }}
              className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 sm:flex dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
            <button
              title="Toggle Right Context Inspector (])"
              onClick={() => setIsRightSidebarCollapsed((prev) => !prev)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {isRightSidebarCollapsed ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <PanelRightClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Content Canvas */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      {/* PANE 3: Right Context Inspector Sidebar */}
      {!isRightSidebarCollapsed && (
        <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-gray-200 bg-gray-50/40 lg:flex dark:border-[#222631] dark:bg-[#13161d]">
          {rightSidebar ? (
            rightSidebar
          ) : inspectedDoc ? (
            <div className="flex flex-col gap-5 p-4 text-xs">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Document Info</span>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">
                    {inspectedDoc.category}
                  </span>
                </div>
                <Link
                  href={`/new/read/${inspectedDoc.id}`}
                  className="mt-2 block text-sm font-bold leading-snug text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                >
                  {inspectedDoc.title}
                </Link>
                <div className="mt-1 text-gray-500">
                  {inspectedDoc.author} • {inspectedDoc.domain}
                </div>
              </div>

              {/* Quick Triage Actions */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() =>
                    triageDocument(inspectedDoc.id, { triageStatus: 'new' })
                  }
                  className={`rounded-lg border py-1.5 font-medium ${
                    inspectedDoc.triageStatus === 'new'
                      ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-400'
                  }`}
                >
                  Inbox
                </button>
                <button
                  onClick={() =>
                    triageDocument(inspectedDoc.id, { triageStatus: 'later' })
                  }
                  className={`rounded-lg border py-1.5 font-medium ${
                    inspectedDoc.triageStatus === 'later'
                      ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-400'
                  }`}
                >
                  Later (l)
                </button>
                <button
                  onClick={() =>
                    triageDocument(inspectedDoc.id, { triageStatus: 'archive' })
                  }
                  className={`rounded-lg border py-1.5 font-medium ${
                    inspectedDoc.triageStatus === 'archive'
                      ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-400'
                  }`}
                >
                  Archive (e)
                </button>
              </div>

              {/* Ghostreader Summary Card */}
              <div className="rounded-xl border border-purple-200/70 bg-purple-50/40 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/20">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Ghostreader Summary
                  </span>
                </div>
                <p className="mt-2 leading-relaxed text-gray-700 dark:text-gray-300">
                  {inspectedDoc.generatedSummary || inspectedDoc.summary}
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-400">Length</span>
                  <span className="font-medium">
                    {inspectedDoc.wordCount.toLocaleString()} words ({inspectedDoc.readingMinutes} mins)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-medium">{inspectedDoc.readingProgress}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Highlights</span>
                  <span className="font-medium">{inspectedDoc.annotations?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tags</span>
                  <span className="font-medium">
                    {inspectedDoc.tags?.length ? inspectedDoc.tags.join(', ') : 'None'}
                  </span>
                </div>
              </div>

              {/* Document Note */}
              <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
                <label className="block font-semibold text-gray-600 dark:text-gray-300">
                  Document Note (Shift+N)
                </label>
                <textarea
                  rows={3}
                  defaultValue={inspectedDoc.documentNote}
                  key={inspectedDoc.id}
                  onBlur={(e) => {
                    if (e.target.value !== inspectedDoc.documentNote) {
                      mutateState(
                        'update-document-metadata',
                        {
                          documentId: inspectedDoc.id,
                          documentNote: e.target.value,
                        },
                        'Saved document note'
                      );
                    }
                  }}
                  placeholder="Add a high-level note or takeaway for this document..."
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs dark:border-gray-700 dark:bg-gray-900"
                />
              </div>

              {/* Saved Highlights Preview */}
              {inspectedDoc.annotations && inspectedDoc.annotations.length > 0 && (
                <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
                  <div className="font-semibold text-gray-600 dark:text-gray-300">
                    Notebook Highlights ({inspectedDoc.annotations.length})
                  </div>
                  <div className="mt-2 space-y-2">
                    {inspectedDoc.annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-lg border-l-2 border-yellow-400 bg-yellow-50/60 p-2.5 text-[11px] dark:bg-yellow-950/20"
                      >
                        <div className="text-gray-800 dark:text-gray-200">
                          &ldquo;{ann.selectedText}&rdquo;
                        </div>
                        {ann.note && (
                          <div className="mt-1 font-medium text-blue-600 dark:text-blue-400">
                            Note: {ann.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-400">
              Select a document to inspect metadata, Ghostreader summary, and highlights.
            </div>
          )}
        </aside>
      )}

      <GlobalModals />
    </div>
  );
}
