'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { DEFAULT_USER_SETTINGS } from '@/lib/default-data';
import { ReaderDocument, ReaderAnnotation } from '@/lib/query-dsl';

export interface ReaderTag {
  id: string;
  name: string;
  description: string;
  color: string;
  documentCount: number;
  highlightCount: number;
}

export interface ReaderFilteredView {
  id: string;
  key: string;
  name: string;
  query: string;
  icon: string;
  groupName: string;
  isPinned: boolean;
  isBuiltIn: boolean;
  sortBy: string;
  layoutMode: string;
  groupBy: string;
  matchingCount: number;
}

export interface ReaderRssFeed {
  id: string;
  title: string;
  url: string;
  siteUrl: string;
  faviconUrl: string;
  description: string;
  folder: string;
  isMuted: boolean;
  subscriberCount: number;
  lastFetchedAt: string;
}

export interface ReaderGhostreaderPrompt {
  id: string;
  promptType: 'DOCUMENT' | 'CONTENT';
  actionKey: string;
  title: string;
  emoji: string;
  description: string;
  template: string;
  isBuiltIn: boolean;
  isEnabled: boolean;
}

export interface ReaderGhostreaderThread {
  id: string;
  documentId: string | null;
  title: string;
  mode: string;
  messages: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: { id: string; title: string; author: string; category: string }[];
    createdAt: string;
  }[];
  updatedAt: string;
}

export interface ReaderIntegration {
  id: string;
  provider: string;
  name: string;
  category: string;
  connected: boolean;
  accountName: string;
  importedCount: number;
  lastSyncedAt: string | null;
}

export interface ToastItem {
  id: string;
  message: string;
  canUndo?: boolean;
  type?: 'info' | 'success' | 'error';
}

interface ReaderContextValue {
  loading: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    onboardingStep: string;
    onboardedAt: string | null;
    customLibraryEmail: string;
    customFeedEmail: string;
    trialDaysRemaining: number;
    apiToken?: string;
    dailyReviewStreak?: number;
    lastReviewedAt?: string | null;
    reviewsPerDay?: number;
  };
  settings: typeof DEFAULT_USER_SETTINGS;
  homeSections: any[];
  documents: ReaderDocument[];
  filteredViews: ReaderFilteredView[];
  tags: ReaderTag[];
  rssFeeds: ReaderRssFeed[];
  suggestedFeeds: any[];
  supplementalCatalog: any[];
  ghostreaderPrompts: ReaderGhostreaderPrompt[];
  ghostreaderThreads: ReaderGhostreaderThread[];
  integrations: ReaderIntegration[];

  // UI Shell & Modal State
  isLeftSidebarCollapsed: boolean;
  setIsLeftSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isRightSidebarCollapsed: boolean;
  setIsRightSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isShortcutsReferenceOpen: boolean;
  setIsShortcutsReferenceOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAddDocumentModalOpen: boolean;
  setIsAddDocumentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addModalDefaultTab: 'url' | 'upload' | 'feed';
  setAddModalDefaultTab: React.Dispatch<React.SetStateAction<'url' | 'upload' | 'feed'>>;
  isFilteredViewModalOpen: boolean;
  setIsFilteredViewModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingFilteredView: ReaderFilteredView | null;
  setEditingFilteredView: React.Dispatch<React.SetStateAction<ReaderFilteredView | null>>;

  // List Selection & Keyboard Focus
  focusedDocId: string | null;
  setFocusedDocId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedDocIds: string[];
  setSelectedDocIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleSelectDoc: (id: string) => void;

  // Toasts & Undo
  toasts: ToastItem[];
  showToast: (message: string, canUndo?: boolean, type?: 'info' | 'success' | 'error') => void;
  dismissToast: (id: string) => void;
  undoLastMutation: () => Promise<void>;

  // Core Actions
  refreshState: () => Promise<void>;
  mutateState: (action: string, payload?: any, toastMessage?: string, canUndo?: boolean) => Promise<any>;
  triageDocument: (
    documentId: string,
    updates: {
      triageStatus?: 'new' | 'later' | 'archive' | 'feed' | 'trash';
      isShortlisted?: boolean;
      isSeen?: boolean;
      readingProgress?: number;
    },
    toastMsg?: string
  ) => Promise<void>;
  toggleTheme: (mode?: 'light' | 'dark' | 'auto') => Promise<void>;
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [stateData, setStateData] = useState<any>({
    user: {
      id: 'demo',
      email: 'alex@readwise.io',
      firstName: 'Alex',
      lastName: 'Rivera',
      username: 'alexrivera',
      onboardingStep: '/new',
      onboardedAt: new Date().toISOString(),
      customLibraryEmail: 'alex.library@library.readwise.io',
      customFeedEmail: 'alex.feed@feed.readwise.io',
      trialDaysRemaining: 30,
    },
    settings: DEFAULT_USER_SETTINGS,
    home: { sections: [] },
    documents: [],
    filteredViews: [],
    tags: [],
    rssFeeds: [],
    suggestedFeeds: [],
    ghostreaderPrompts: [],
    ghostreaderThreads: [],
    integrations: [],
  });

  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsReferenceOpen, setIsShortcutsReferenceOpen] = useState(false);
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [addModalDefaultTab, setAddModalDefaultTab] = useState<'url' | 'upload' | 'feed'>('url');
  const [isFilteredViewModalOpen, setIsFilteredViewModalOpen] = useState(false);
  const [editingFilteredView, setEditingFilteredView] = useState<ReaderFilteredView | null>(null);

  const [focusedDocId, setFocusedDocId] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, canUndo = false, type: 'info' | 'success' | 'error' = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, canUndo, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/reader/state', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setStateData(json);
        try {
          localStorage.setItem('rw_reader_state_v1', JSON.stringify(json));
        } catch {}
      }
    } catch (e) {
      console.error('Failed to refresh reader state:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate from localStorage immediately, then fetch fresh state
  useEffect(() => {
    try {
      const cached = localStorage.getItem('rw_reader_state_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.documents?.length) {
          setStateData(parsed);
          setLoading(false);
        }
      }
    } catch {}
    refreshState();
  }, [refreshState]);

  // Apply Dark Mode class on <html>
  useEffect(() => {
    const theme = stateData?.settings?.theme || 'light';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [stateData?.settings?.theme]);

  const mutateState = useCallback(
    async (action: string, payload: any = {}, toastMessage?: string, canUndo = false) => {
      try {
        const res = await fetch('/api/reader/state/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        const data = await res.json();
        await refreshState();
        if (toastMessage) {
          showToast(toastMessage, canUndo, 'success');
        }
        return data;
      } catch (err) {
        console.error('Mutation failed:', err);
        showToast('Failed to save change', false, 'error');
        return null;
      }
    },
    [refreshState, showToast]
  );

  const triageDocument = useCallback(
    async (
      documentId: string,
      updates: {
        triageStatus?: 'new' | 'later' | 'archive' | 'feed' | 'trash';
        isShortlisted?: boolean;
        isSeen?: boolean;
        readingProgress?: number;
      },
      toastMsg?: string
    ) => {
      // Optimistic local state update
      setStateData((prev: any) => ({
        ...prev,
        documents: prev.documents.map((d: ReaderDocument) =>
          d.id === documentId
            ? {
                ...d,
                ...(updates.triageStatus !== undefined ? { triageStatus: updates.triageStatus } : {}),
                ...(updates.isShortlisted !== undefined ? { isShortlisted: updates.isShortlisted } : {}),
                ...(updates.isSeen !== undefined ? { isSeen: updates.isSeen } : {}),
                ...(updates.readingProgress !== undefined ? { readingProgress: updates.readingProgress } : {}),
              }
            : d
        ),
      }));

      const defaultMsg =
        updates.triageStatus === 'archive'
          ? 'Moved document to Archive'
          : updates.triageStatus === 'later'
          ? 'Moved document to Later'
          : updates.triageStatus === 'new'
          ? 'Moved document to Inbox'
          : updates.triageStatus === 'trash'
          ? 'Moved document to Trash'
          : updates.isShortlisted !== undefined
          ? updates.isShortlisted
            ? 'Added to Shortlist'
            : 'Removed from Shortlist'
          : undefined;

      await mutateState(
        'triage-document',
        { documentId, ...updates },
        toastMsg ?? defaultMsg,
        true
      );
    },
    [mutateState]
  );

  const undoLastMutation = useCallback(async () => {
    await mutateState('undo-last-mutation', {}, 'Undid last action', false);
  }, [mutateState]);

  const toggleSelectDoc = useCallback((id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleTheme = useCallback(
    async (mode?: 'light' | 'dark' | 'auto') => {
      const current = stateData?.settings?.theme || 'light';
      const next = mode || (current === 'dark' ? 'light' : 'dark');
      setStateData((prev: any) => ({
        ...prev,
        settings: { ...prev.settings, theme: next },
      }));
      await mutateState(
        'update-settings',
        { settings: { theme: next } },
        `Switched appearance to ${next} mode`
      );
    },
    [stateData?.settings?.theme, mutateState]
  );

  // Global keyboard shortcuts (Cmd+K, [, ], ?, z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsShortcutsReferenceOpen(false);
        setIsAddDocumentModalOpen(false);
        setIsFilteredViewModalOpen(false);
        return;
      }

      if (isInput) return;

      if (e.key === '[') {
        e.preventDefault();
        setIsLeftSidebarCollapsed((prev) => !prev);
      } else if (e.key === ']') {
        e.preventDefault();
        setIsRightSidebarCollapsed((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsReferenceOpen((prev) => !prev);
      } else if (e.key === 'z' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        undoLastMutation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastMutation]);

  const value = useMemo<ReaderContextValue>(
    () => ({
      loading,
      user: stateData.user,
      settings: stateData.settings || DEFAULT_USER_SETTINGS,
      homeSections: stateData.home?.sections || [],
      documents: stateData.documents || [],
      filteredViews: stateData.filteredViews || [],
      tags: stateData.tags || [],
      rssFeeds: stateData.rssFeeds || [],
      suggestedFeeds: stateData.suggestedFeeds || [],
      supplementalCatalog: stateData.supplementalCatalog || [],
      ghostreaderPrompts: stateData.ghostreaderPrompts || [],
      ghostreaderThreads: stateData.ghostreaderThreads || [],
      integrations: stateData.integrations || [],
      isLeftSidebarCollapsed,
      setIsLeftSidebarCollapsed,
      isRightSidebarCollapsed,
      setIsRightSidebarCollapsed,
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
      setFocusedDocId,
      selectedDocIds,
      setSelectedDocIds,
      toggleSelectDoc,
      toasts,
      showToast,
      dismissToast,
      undoLastMutation,
      refreshState,
      mutateState,
      triageDocument,
      toggleTheme,
    }),
    [
      loading,
      stateData,
      isLeftSidebarCollapsed,
      isRightSidebarCollapsed,
      isCommandPaletteOpen,
      isShortcutsReferenceOpen,
      isAddDocumentModalOpen,
      addModalDefaultTab,
      isFilteredViewModalOpen,
      editingFilteredView,
      focusedDocId,
      selectedDocIds,
      toggleSelectDoc,
      toasts,
      showToast,
      dismissToast,
      undoLastMutation,
      refreshState,
      mutateState,
      triageDocument,
      toggleTheme,
    ]
  );

  return (
    <SessionProvider>
      <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
    </SessionProvider>
  );
}

export function useReader() {
  const ctx = useContext(ReaderContext);
  if (!ctx) {
    throw new Error('useReader must be used inside ReaderProvider');
  }
  return ctx;
}
