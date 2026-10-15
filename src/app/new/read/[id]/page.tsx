'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useReader } from '@/context/ReaderContext';
import { GlobalModals } from '@/components/GlobalModals';
import {
  ArrowLeft,
  Inbox,
  Clock,
  Archive,
  Star,
  Trash2,
  Type,
  Sparkles,
  Headphones,
  Play,
  Pause,
  Columns,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ZoomIn,
  ZoomOut,
  Crop,
  FileText,
  BookOpen,
  Video,
  Download,
  Copy,
  Check,
  Edit3,
  MessageSquare,
  Tag,
  Plus,
  X,
} from 'lucide-react';

function DocumentReaderInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = params?.id as string;
  const splitDocId = searchParams.get('split');

  const {
    documents,
    settings,
    ghostreaderPrompts,
    isLeftSidebarCollapsed,
    setIsLeftSidebarCollapsed,
    isRightSidebarCollapsed,
    setIsRightSidebarCollapsed,
    triageDocument,
    mutateState,
    showToast,
  } = useReader();

  const doc = documents.find((d) => d.id === docId) || documents[0];
  const splitDoc = splitDocId ? documents.find((d) => d.id === splitDocId) : null;

  // Reader UI states
  const [rightTab, setRightTab] = useState<'notebook' | 'info' | 'chat'>('notebook');
  const [focusedParagraphIdx, setFocusedParagraphIdx] = useState(0);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [ghostMenuOpen, setGhostMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [editMetadataModalOpen, setEditMetadataModalOpen] = useState(false);

  // Selection / Annotation states
  const [selectedText, setSelectedText] = useState('');
  const [inlineNoteDraft, setInlineNoteDraft] = useState('');
  const [activeNoteParagraph, setActiveNoteParagraph] = useState<number | null>(null);

  // TTS Audio Player state
  const [ttsOpen, setTtsOpen] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [ttsProgressSec, setTtsProgressSec] = useState(0);

  // PDF Specific states
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTextMode, setPdfTextMode] = useState(false);
  const [pdfAreaMode, setPdfAreaMode] = useState(false);

  // Video Specific states
  const [videoCurrentSec, setVideoCurrentSec] = useState(0);

  // Ghostreader Execution states
  const [ghostLoading, setGhostLoading] = useState(false);
  const [ghostOutputs, setGhostOutputs] = useState<
    { id: string; title: string; response: string; renderedPrompt?: string }[]
  >([]);
  const [docQuestion, setDocQuestion] = useState('');

  // Metadata Edit Form states
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaUrl, setMetaUrl] = useState('');
  const [copiedMd, setCopiedMd] = useState(false);

  useEffect(() => {
    if (doc) {
      setMetaTitle(doc.title);
      setMetaAuthor(doc.author);
      setMetaUrl(doc.url);
    }
  }, [doc]);

  // Mark document as seen on open
  useEffect(() => {
    if (doc && !doc.isSeen) {
      mutateState('triage-document', { documentId: doc.id, isSeen: true });
    }
  }, [doc?.id]);

  // TTS simulated timer
  useEffect(() => {
    if (!ttsPlaying) return;
    const timer = setInterval(() => {
      setTtsProgressSec((prev) => (prev >= 180 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [ttsPlaying]);

  // Parse paragraphs & headings from htmlContent
  const parsedParagraphs = useMemo(() => {
    if (!doc?.htmlContent) return [];
    const blocks: { type: 'h2' | 'p' | 'blockquote'; id?: string; text: string; pIndex?: number }[] = [];
    const regex = /<(h2|p|blockquote)([^>]*)>([\s\S]*?)<\/\1>/gi;
    let match;
    let pCounter = 0;
    while ((match = regex.exec(doc.htmlContent)) !== null) {
      const tag = match[1].toLowerCase() as 'h2' | 'p' | 'blockquote';
      const attrs = match[2] || '';
      const rawInner = match[3].replace(/<[^>]+>/g, '').trim();
      const idMatch = attrs.match(/id="([^"]+)"/);
      if (tag === 'h2') {
        blocks.push({ type: 'h2', id: idMatch ? idMatch[1] : `sec-${blocks.length}`, text: rawInner });
      } else {
        blocks.push({ type: tag, text: rawInner, pIndex: pCounter++ });
      }
    }
    return blocks;
  }, [doc?.htmlContent]);

  const tocHeadings = useMemo(
    () => parsedParagraphs.filter((b) => b.type === 'h2'),
    [parsedParagraphs]
  );

  const paragraphBlocks = useMemo(
    () => parsedParagraphs.filter((b) => b.type !== 'h2'),
    [parsedParagraphs]
  );

  const handleHighlightParagraph = async (
    pIdx: number,
    text: string,
    color: 'yellow' | 'blue' | 'pink' | 'orange' = 'yellow',
    note = '',
    timestampSeconds?: number
  ) => {
    if (!doc) return;
    await mutateState(
      'add-annotation',
      {
        documentId: doc.id,
        type: 'highlight',
        paragraphIndex: pIdx,
        selectedText: text,
        color,
        note,
        timestampSeconds,
      },
      'Saved highlight to Notebook'
    );
  };

  const handleCapturePdfAreaSnapshot = async (pageNumber: number, caption: string) => {
    if (!doc) return;
    await mutateState(
      'add-annotation',
      {
        documentId: doc.id,
        type: 'area_snapshot',
        paragraphIndex: pageNumber,
        selectedText: `[PDF Page ${pageNumber} Area Snapshot] ${caption}`,
        note: `Captured visual diagram from page ${pageNumber}`,
        color: 'blue',
        boundingBox: { page: pageNumber, x: 48, y: 120, width: 420, height: 180 },
      },
      `Captured PDF Area Snapshot on Page ${pageNumber}`
    );
    setPdfAreaMode(false);
    setRightTab('notebook');
  };

  const runGhostreaderPrompt = async (actionKey: string, questionText = '') => {
    if (!doc) return;
    setGhostLoading(true);
    setGhostMenuOpen(false);
    setRightTab('chat');
    try {
      const focusedText =
        selectedText ||
        paragraphBlocks[focusedParagraphIdx]?.text ||
        doc.summary;

      const res = await fetch('/api/ghostreader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'prompt',
          documentId: doc.id,
          actionKey,
          question: questionText,
          selectionText: focusedText,
          selectionContext: doc.summary,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setGhostOutputs((prev) => [
          {
            id: `go-${Date.now()}`,
            title: data.promptTitle || actionKey,
            response: data.response,
            renderedPrompt: data.renderedPrompt,
          },
          ...prev,
        ]);
        showToast(`Ghostreader completed: ${data.promptTitle}`);
      }
    } finally {
      setGhostLoading(false);
    }
  };

  // Reader-level keyboard shortcuts (j, k, h, n, e, l, s, Shift+G, Esc)
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
      if (!doc) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedParagraphIdx((prev) =>
          Math.min(Math.max(0, paragraphBlocks.length - 1), prev + 1)
        );
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedParagraphIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'h') {
        e.preventDefault();
        const block = paragraphBlocks[focusedParagraphIdx];
        if (block) {
          handleHighlightParagraph(block.pIndex ?? focusedParagraphIdx, block.text, 'yellow');
        }
      } else if (e.key === 'n') {
        e.preventDefault();
        setActiveNoteParagraph(focusedParagraphIdx);
      } else if (e.key === 'e') {
        e.preventDefault();
        triageDocument(doc.id, { triageStatus: 'archive' });
      } else if (e.key === 'l') {
        e.preventDefault();
        triageDocument(doc.id, { triageStatus: 'later' });
      } else if (e.key === 's') {
        e.preventDefault();
        triageDocument(doc.id, { isShortlisted: !doc.isShortlisted });
      } else if (e.key === 'G' && e.shiftKey) {
        e.preventDefault();
        setGhostMenuOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doc, focusedParagraphIdx, paragraphBlocks, triageDocument]);

  if (!doc) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Loading document...
      </div>
    );
  }

  const typo: any = settings?.readerTypography || {
    fontFamily: 'sans',
    fontSize: 18,
    lineSpacing: 1.65,
    lineWidth: 'medium',
  };

  const fontClass =
    typo.fontFamily === 'serif'
      ? 'font-serif'
      : typo.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const activeWidth = typo.lineWidth || typo.maxWidth || 'medium';
  const widthClass =
    activeWidth === 'narrow'
      ? 'max-w-xl'
      : activeWidth === 'wide'
      ? 'max-w-4xl'
      : 'max-w-2xl';

  const docPrompts = ghostreaderPrompts.filter((p) => p.promptType === 'DOCUMENT');
  const contentPrompts = ghostreaderPrompts.filter((p) => p.promptType === 'CONTENT');

  const pdfPages = doc.sourceSpecific?.pages || [
    {
      pageNumber: 1,
      title: 'Page 1 — Executive Summary',
      heading: doc.title,
      authors: doc.author,
      paragraphs: [doc.summary],
      diagramCaption: 'Figure 1: Architecture Diagram',
    },
  ];

  const handleCopyNotebookMarkdown = async () => {
    const res = await fetch(`/api/export?format=markdown&documentId=${doc.id}`);
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    setCopiedMd(true);
    showToast('Copied Jinja2 formatted Markdown to clipboard');
    setTimeout(() => setCopiedMd(false), 2500);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-900 dark:bg-[#0f1115] dark:text-gray-100">
      {/* PANE 1: Table of Contents / Chapters Left Sidebar */}
      {!isLeftSidebarCollapsed && (
        <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-gray-200 bg-gray-50/60 p-4 dark:border-[#222631] dark:bg-[#13161d]">
          <div className="overflow-y-auto">
            <div className="flex items-center justify-between pb-3">
              <Link
                href="/new"
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Library
              </Link>
              <button
                title="Collapse TOC ([)"
                onClick={() => setIsLeftSidebarCollapsed(true)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 border-t border-gray-200 pt-3 dark:border-gray-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {doc.category === 'epub'
                  ? 'Book Chapters (EPUB)'
                  : doc.category === 'pdf'
                  ? 'PDF Pages'
                  : doc.category === 'video'
                  ? 'Video Transcript Segments'
                  : 'Table of Contents'}
              </div>

              <div className="mt-2 space-y-1 text-xs">
                {doc.category === 'pdf' ? (
                  pdfPages.map((p: any) => (
                    <button
                      key={p.pageNumber}
                      onClick={() => setPdfPage(p.pageNumber)}
                      className={`block w-full rounded-lg px-2.5 py-2 text-left transition ${
                        pdfPage === p.pageNumber
                          ? 'bg-blue-600/10 font-semibold text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {p.title}
                    </button>
                  ))
                ) : tocHeadings.length > 0 ? (
                  tocHeadings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="block rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-200/60 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                    >
                      {h.text}
                    </a>
                  ))
                ) : (
                  <div className="px-2 py-2 text-gray-400">
                    Use <kbd className="font-mono">j</kbd> / <kbd className="font-mono">k</kbd> to
                    step through paragraphs.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reading Progress Footer */}
          <div className="border-t border-gray-200 pt-3 text-xs dark:border-gray-800">
            <div className="flex items-center justify-between text-gray-500">
              <span>Reading Progress</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {doc.readingProgress}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={doc.readingProgress}
              onChange={(e) =>
                triageDocument(doc.id, { readingProgress: Number(e.target.value) })
              }
              className="mt-1.5 w-full accent-blue-600"
            />
          </div>
        </aside>
      )}

      {/* PANE 2: Center Multi-Format Document Canvas */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Reader Toolbar */}
        <header className="relative flex h-13 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-[#222631] dark:bg-[#0f1115]">
          <div className="flex items-center gap-2 min-w-0">
            {isLeftSidebarCollapsed && (
              <button
                onClick={() => setIsLeftSidebarCollapsed(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
            <Link
              href="/new"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Back to Library"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            {/* Triage Pill Group */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-0.5 text-xs dark:border-gray-800">
              <button
                onClick={() => triageDocument(doc.id, { triageStatus: 'new' })}
                className={`rounded-lg px-2.5 py-1 font-medium ${
                  doc.triageStatus === 'new'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                Inbox
              </button>
              <button
                onClick={() => triageDocument(doc.id, { triageStatus: 'later' })}
                className={`rounded-lg px-2.5 py-1 font-medium ${
                  doc.triageStatus === 'later'
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                Later (l)
              </button>
              <button
                onClick={() => triageDocument(doc.id, { triageStatus: 'archive' })}
                className={`rounded-lg px-2.5 py-1 font-medium ${
                  doc.triageStatus === 'archive'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                Archive (e)
              </button>
            </div>

            <button
              title="Toggle Shortlist (s)"
              onClick={() => triageDocument(doc.id, { isShortlisted: !doc.isShortlisted })}
              className={`rounded-lg p-1.5 ${
                doc.isShortlisted ? 'text-amber-400' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Star className={`h-4 w-4 ${doc.isShortlisted ? 'fill-amber-400' : ''}`} />
            </button>
          </div>

          {/* Right Reader Toolbar Controls: TTS, Aa Typography, Ghostreader AI, Split View, More */}
          <div className="flex items-center gap-1.5">
            {/* TTS Listen Button */}
            <button
              onClick={() => {
                setTtsOpen((prev) => !prev);
                setTtsPlaying((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                ttsOpen
                  ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300'
              }`}
            >
              <Headphones className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Listen (TTS)</span>
            </button>

            {/* Aa Appearance Popover Button */}
            <button
              title="Appearance & Typography (Aa)"
              onClick={() => {
                setTypographyOpen((prev) => !prev);
                setGhostMenuOpen(false);
              }}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300"
            >
              Aa
            </button>

            {/* Ghostreader Menu Button */}
            <button
              onClick={() => {
                setGhostMenuOpen((prev) => !prev);
                setTypographyOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50/70 px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ghostreader</span>
            </button>

            {/* Split View Toggle */}
            <button
              title="Toggle Dual-Document Split View"
              onClick={() => {
                if (splitDocId) {
                  router.push(`/new/read/${doc.id}`);
                } else {
                  const second = documents.find((d) => d.id !== doc.id);
                  if (second) {
                    router.push(`/new/read/${doc.id}?split=${second.id}`);
                  }
                }
              }}
              className={`rounded-lg border p-1.5 ${
                splitDocId
                  ? 'border-blue-600 bg-blue-600/10 text-blue-600'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800'
              }`}
            >
              <Columns className="h-4 w-4" />
            </button>

            {/* More Actions Menu */}
            <button
              title="Edit Metadata & Export (Shift+M)"
              onClick={() => setEditMetadataModalOpen(true)}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-800"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              title="Toggle Right Notebook Panel (])"
              onClick={() => setIsRightSidebarCollapsed((prev) => !prev)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isRightSidebarCollapsed ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <PanelRightClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Aa Typography Popover */}
          {typographyOpen && (
            <div className="absolute right-16 top-14 z-30 w-72 rounded-2xl border border-gray-200 bg-white p-4 text-xs shadow-2xl dark:border-gray-800 dark:bg-[#181c26]">
              <div className="font-bold text-gray-900 dark:text-white">
                Reader Typography &amp; Theme
              </div>

              <div className="mt-3">
                <div className="text-[11px] text-gray-400">Typeface</div>
                <div className="mt-1 grid grid-cols-3 gap-1.5">
                  {(['sans', 'serif', 'mono'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() =>
                        mutateState('update-settings', {
                          settings: { readerTypography: { fontFamily: f } },
                        })
                      }
                      className={`rounded-lg border py-1.5 font-semibold capitalize ${
                        typo.fontFamily === f
                          ? 'border-blue-600 bg-blue-600/10 text-blue-600'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Font Size</span>
                  <span>{typo.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={24}
                  value={typo.fontSize}
                  onChange={(e) =>
                    mutateState('update-settings', {
                      settings: {
                        readerTypography: { fontSize: Number(e.target.value) },
                      },
                    })
                  }
                  className="mt-1 w-full accent-blue-600"
                />
              </div>

              <div className="mt-3">
                <div className="text-[11px] text-gray-400">Column Width</div>
                <div className="mt-1 grid grid-cols-3 gap-1.5">
                  {(['narrow', 'medium', 'wide'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() =>
                        mutateState('update-settings', {
                          settings: { readerTypography: { lineWidth: w } },
                        })
                      }
                      className={`rounded-lg border py-1.5 font-semibold capitalize ${
                        activeWidth === w
                          ? 'border-blue-600 bg-blue-600/10 text-blue-600'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ghostreader Prompt Menu Popover */}
          {ghostMenuOpen && (
            <div className="absolute right-8 top-14 z-30 w-80 rounded-2xl border border-purple-200 bg-white p-3 text-xs shadow-2xl dark:border-purple-900/50 dark:bg-[#181c26]">
              <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300">
                  <Sparkles className="h-4 w-4" />
                  Invoke Ghostreader AI (Shift+G)
                </span>
                <Link
                  href="/ghostreader/preferences"
                  className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                >
                  Edit Jinja2
                </Link>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Document Prompts
              </div>
              <div className="mt-1 space-y-1">
                {docPrompts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => runGhostreaderPrompt(p.actionKey)}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-950/30"
                  >
                    <span className="font-medium">{p.title}</span>
                    <span className="text-[10px] text-gray-400">Run →</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Focused Paragraph / Selection Prompts
              </div>
              <div className="mt-1 space-y-1">
                {contentPrompts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => runGhostreaderPrompt(p.actionKey)}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left hover:bg-purple-50 dark:hover:bg-purple-950/30"
                  >
                    <span>{p.title}</span>
                    <span className="text-[10px] text-gray-400">Selection</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* TTS Audio Scrubber Bar (when active) */}
        {ttsOpen && (
          <div className="flex items-center justify-between border-b border-blue-200 bg-blue-50/70 px-6 py-2.5 text-xs dark:border-blue-900/40 dark:bg-blue-950/30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTtsPlaying((prev) => !prev)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white"
              >
                {ttsPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <div>
                <div className="font-semibold text-blue-900 dark:text-blue-200">
                  Neural Text-to-Speech • Word-Synchronized Audio
                </div>
                <div className="text-[11px] text-blue-700/80 dark:text-blue-300/70">
                  0:{String(ttsProgressSec % 60).padStart(2, '0')} / {doc.readingMinutes}:00 • Highlighting active sentence
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[1.0, 1.25, 1.5, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setTtsSpeed(spd)}
                  className={`rounded-lg px-2 py-1 font-mono text-[11px] font-bold ${
                    ttsSpeed === spd
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/60 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {spd}x
                </button>
              ))}
              <button
                onClick={() => {
                  setTtsPlaying(false);
                  setTtsOpen(false);
                }}
                className="ml-2 text-gray-500 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Reader Canvas (Supports Single or Split-Screen Dual Reader) */}
        <div
          className={`flex-1 overflow-y-auto ${
            splitDoc ? 'grid grid-cols-1 divide-x divide-gray-200 lg:grid-cols-2 dark:divide-gray-800' : ''
          }`}
        >
          {/* PRIMARY DOCUMENT RENDERER */}
          <div className="px-6 py-10">
            <div className={`mx-auto ${widthClass}`}>
              {/* Document Header Metadata */}
              <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <span>{doc.category}</span>
                  <span>•</span>
                  <span>{doc.domain}</span>
                  <span>•</span>
                  <span>{doc.readingMinutes} min read</span>
                </div>
                <h1 className="mt-2 text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl dark:text-white">
                  {doc.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>By <strong>{doc.author}</strong></span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Original Source ↗
                  </a>
                </div>
              </div>

              {/* FORMAT A: YOUTUBE VIDEO + INTERACTIVE TRANSCRIPT */}
              {doc.category === 'video' && (
                <div className="space-y-6">
                  {/* Embedded YouTube Player */}
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-lg dark:border-gray-800">
                    <div className="aspect-video w-full">
                      <iframe
                        title={doc.title}
                        src={`https://www.youtube-nocookie.com/embed/${
                          doc.sourceSpecific?.youtubeVideoId || 'eJBtvfbcic0'
                        }?start=${videoCurrentSec}`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  {/* Interactive Time-Synced Transcript */}
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-[#141821]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                        <Video className="h-4 w-4 text-rose-500" />
                        Interactive Time-Synced Transcript (Click timestamp to jump, press H to highlight)
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {(doc.transcript?.length
                        ? doc.transcript
                        : [
                            {
                              start: 0,
                              duration: 14,
                              text: 'Welcome to Readwise Reader video mode. Click any sentence to jump the video player to that exact timestamp.',
                            },
                          ]
                      ).map((seg: any, idx: number) => {
                        const isHighlighted = doc.annotations?.some(
                          (a) => a.paragraphIndex === idx || a.selectedText === seg.text
                        );
                        const mins = Math.floor(seg.start / 60);
                        const secs = String(seg.start % 60).padStart(2, '0');

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setVideoCurrentSec(seg.start);
                              setFocusedParagraphIdx(idx);
                            }}
                            className={`group flex items-start justify-between gap-3 rounded-xl border p-3 text-sm transition cursor-pointer ${
                              videoCurrentSec === seg.start
                                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30'
                                : 'border-transparent hover:bg-white dark:hover:bg-gray-900'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 rounded bg-blue-600/10 px-2 py-0.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                {mins}:{secs}
                              </span>
                              <p
                                className={
                                  isHighlighted ? 'rw-highlight-yellow px-1 rounded' : ''
                                }
                              >
                                {seg.text}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHighlightParagraph(
                                  idx,
                                  seg.text,
                                  'yellow',
                                  `Timestamp ${mins}:${secs}`,
                                  seg.start
                                );
                              }}
                              className="shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 hover:border-yellow-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            >
                              Highlight (h)
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* FORMAT B: MULTI-PAGE PDF VIEWER WITH ZOOM, TEXT REFLOW & AREA SNAPSHOT */}
              {doc.category === 'pdf' && (
                <div className="space-y-6">
                  {/* PDF Viewer Sub-Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-gray-100/80 px-4 py-2.5 text-xs dark:border-gray-800 dark:bg-[#161a24]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        Page {pdfPage} of {pdfPages.length}
                      </span>
                      <button
                        disabled={pdfPage <= 1}
                        onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                        className="rounded border border-gray-300 bg-white px-2 py-1 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800"
                      >
                        Prev
                      </button>
                      <button
                        disabled={pdfPage >= pdfPages.length}
                        onClick={() => setPdfPage((p) => Math.min(pdfPages.length, p + 1))}
                        className="rounded border border-gray-300 bg-white px-2 py-1 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800"
                      >
                        Next
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPdfZoom((z) => Math.max(75, z - 15))}
                        className="rounded border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
                        title="Zoom Out"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono font-semibold">{pdfZoom}%</span>
                      <button
                        onClick={() => setPdfZoom((z) => Math.min(150, z + 15))}
                        className="rounded border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
                        title="Zoom In"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPdfAreaMode((prev) => !prev)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                          pdfAreaMode
                            ? 'bg-blue-600 text-white shadow'
                            : 'border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <Crop className="h-3.5 w-3.5" />
                        Area Snapshot Highlight
                      </button>
                      <button
                        onClick={() => setPdfTextMode((prev) => !prev)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                          pdfTextMode
                            ? 'bg-indigo-600 text-white shadow'
                            : 'border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {pdfTextMode ? 'PDF Canvas View' : 'Enhanced Text View'}
                      </button>
                    </div>
                  </div>

                  {/* PDF Canvas vs Reflow Text Mode */}
                  {!pdfTextMode ? (
                    <div className="space-y-8">
                      {pdfPages.map((pg: any) => (
                        <div
                          key={pg.pageNumber}
                          style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}
                          className="mx-auto rounded-xl border border-gray-300 bg-white p-10 text-gray-900 shadow-xl dark:border-gray-700 dark:bg-[#191d26] dark:text-gray-100"
                        >
                          <div className="flex items-center justify-between border-b border-gray-200 pb-3 text-xs text-gray-400 dark:border-gray-800">
                            <span>{pg.title}</span>
                            <span>Page {pg.pageNumber}</span>
                          </div>
                          <h2 className="mt-6 text-center font-serif text-xl font-bold">
                            {pg.heading}
                          </h2>
                          <div className="mt-1 text-center font-serif text-xs italic text-gray-500">
                            {pg.authors}
                          </div>

                          <div className="mt-6 space-y-4 font-serif text-sm leading-relaxed">
                            {pg.paragraphs.map((pText: string, i: number) => {
                              const isHl = doc.annotations?.some((a) =>
                                a.selectedText.includes(pText.slice(0, 30))
                              );
                              return (
                                <div key={i} className="group relative">
                                  <p className={isHl ? 'rw-highlight-yellow p-1 rounded' : ''}>
                                    {pText}
                                  </p>
                                  <button
                                    onClick={() =>
                                      handleHighlightParagraph(i, pText, 'yellow')
                                    }
                                    className="mt-1 rounded bg-yellow-400/20 px-2 py-0.5 font-sans text-[11px] font-semibold text-yellow-700 opacity-0 group-hover:opacity-100 dark:text-yellow-300"
                                  >
                                    + Highlight PDF Passage
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Interactive Figure / Diagram Box for Area Snapshot */}
                          <div
                            onClick={() =>
                              handleCapturePdfAreaSnapshot(pg.pageNumber, pg.diagramCaption)
                            }
                            className={`mt-6 cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition ${
                              pdfAreaMode
                                ? 'border-blue-500 bg-blue-500/10 ring-4 ring-blue-500/20'
                                : 'border-gray-300 bg-gray-50 hover:border-blue-400 dark:border-gray-700 dark:bg-gray-800/50'
                            }`}
                          >
                            <div className="mx-auto flex h-24 max-w-md items-center justify-center rounded-lg bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 font-mono text-xs font-semibold text-blue-700 dark:text-blue-300">
                              [ Multi-Head Self-Attention / Scaling Architecture Diagram ]
                            </div>
                            <div className="mt-2 font-serif text-xs font-medium text-gray-600 dark:text-gray-300">
                              {pg.diagramCaption}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 font-sans text-[11px] font-semibold text-white">
                              <Crop className="h-3 w-3" />
                              Click to Capture Rectangular Area Snapshot to Notebook
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* FORMAT C: ARTICLE / EPUB / EMAIL / TWEET / PDF-TEXT-REFLOW */}
              {(doc.category !== 'pdf' || pdfTextMode) && (
                <article
                  style={{
                    fontSize: `${typo.fontSize || 18}px`,
                    lineHeight: typo.lineSpacing || typo.lineHeight || 1.65,
                  }}
                  className={`reader-article-content mt-6 ${fontClass}`}
                  onMouseUp={() => {
                    const sel = window.getSelection()?.toString().trim();
                    if (sel && sel.length > 3) {
                      setSelectedText(sel);
                    }
                  }}
                >
                  {/* Floating Selection Action Bar */}
                  {selectedText && (
                    <div className="sticky top-3 z-20 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-xs text-white shadow-xl">
                      <span className="max-w-xs truncate text-gray-300">
                        Selected: &ldquo;{selectedText}&rdquo;
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(['yellow', 'blue', 'pink', 'orange'] as const).map((col) => (
                          <button
                            key={col}
                            onClick={() => {
                              handleHighlightParagraph(
                                focusedParagraphIdx,
                                selectedText,
                                col
                              );
                              setSelectedText('');
                            }}
                            className="rounded px-2 py-1 text-[11px] font-bold capitalize hover:bg-white/10"
                          >
                            {col}
                          </button>
                        ))}
                        <button
                          onClick={() => runGhostreaderPrompt('DEFINE_TERM')}
                          className="rounded bg-purple-600 px-2.5 py-1 text-[11px] font-semibold"
                        >
                          👻 Define
                        </button>
                        <button
                          onClick={() => runGhostreaderPrompt('SIMPLIFY_PASSAGE')}
                          className="rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold"
                        >
                          👻 Simplify
                        </button>
                        <button
                          onClick={() => setSelectedText('')}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {parsedParagraphs.map((block, idx) => {
                    if (block.type === 'h2') {
                      return (
                        <h2 key={idx} id={block.id}>
                          {block.text}
                        </h2>
                      );
                    }

                    const pIdx = block.pIndex ?? 0;
                    const isFocused = focusedParagraphIdx === pIdx;
                    const matchingAnn = doc.annotations?.find(
                      (a) =>
                        a.paragraphIndex === pIdx ||
                        block.text.includes(a.selectedText.slice(0, 32))
                    );

                    const hlClass = matchingAnn
                      ? `rw-highlight-${matchingAnn.color || 'yellow'}`
                      : '';

                    return (
                      <div
                        key={idx}
                        onClick={() => setFocusedParagraphIdx(pIdx)}
                        className="group relative"
                      >
                        {block.type === 'blockquote' ? (
                          <blockquote className={hlClass}>{block.text}</blockquote>
                        ) : (
                          <p
                            className={`${
                              isFocused ? 'paragraph-focused' : ''
                            } ${hlClass}`}
                          >
                            {block.text}
                          </p>
                        )}

                        {/* Paragraph Hover Action Pill */}
                        <div className="mt-0.5 mb-2 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHighlightParagraph(pIdx, block.text, 'yellow');
                            }}
                            className="rounded border border-gray-200 bg-white px-2 py-0.5 font-sans text-[11px] font-semibold text-gray-600 hover:border-yellow-500 hover:text-yellow-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            Highlight (h)
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveNoteParagraph(pIdx);
                            }}
                            className="rounded border border-gray-200 bg-white px-2 py-0.5 font-sans text-[11px] font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            Add Note (n)
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFocusedParagraphIdx(pIdx);
                              runGhostreaderPrompt('SIMPLIFY_PASSAGE');
                            }}
                            className="rounded border border-purple-200 bg-purple-50 px-2 py-0.5 font-sans text-[11px] font-semibold text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
                          >
                            👻 Explain
                          </button>
                        </div>

                        {/* Inline Margin Note Composer */}
                        {activeNoteParagraph === pIdx && (
                          <div className="my-3 rounded-xl border border-blue-300 bg-blue-50/50 p-3 font-sans text-xs dark:border-blue-800 dark:bg-blue-950/30">
                            <div className="font-semibold text-blue-800 dark:text-blue-300">
                              Attach Margin Note to Paragraph #{pIdx + 1}
                            </div>
                            <textarea
                              autoFocus
                              rows={2}
                              value={inlineNoteDraft}
                              onChange={(e) => setInlineNoteDraft(e.target.value)}
                              placeholder="Type your margin note..."
                              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-900"
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <button
                                onClick={() => setActiveNoteParagraph(null)}
                                className="rounded px-2.5 py-1 text-gray-500"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  handleHighlightParagraph(
                                    pIdx,
                                    block.text,
                                    'yellow',
                                    inlineNoteDraft
                                  );
                                  setInlineNoteDraft('');
                                  setActiveNoteParagraph(null);
                                }}
                                className="rounded-lg bg-blue-600 px-3 py-1 font-semibold text-white"
                              >
                                Save Highlight &amp; Note
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </article>
              )}
            </div>
          </div>

          {/* SECONDARY SPLIT-VIEW DOCUMENT RENDERER (?split=...) */}
          {splitDoc && (
            <div className="bg-gray-50/40 px-6 py-10 dark:bg-[#12151e]">
              <div className="mx-auto max-w-xl">
                <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-600">
                      Split-Screen Comparison View
                    </span>
                    <h2 className="text-lg font-bold">{splitDoc.title}</h2>
                  </div>
                  <button
                    onClick={() => router.push(`/new/read/${doc.id}`)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div
                  className="reader-article-content text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: splitDoc.htmlContent }}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* PANE 3: Right Inspector Panel (Notebook | Info | Ghostreader Chat) */}
      {!isRightSidebarCollapsed && (
        <aside className="flex w-84 shrink-0 flex-col border-l border-gray-200 bg-gray-50/50 dark:border-[#222631] dark:bg-[#13161d]">
          {/* Right Panel Tabs */}
          <div className="grid grid-cols-3 border-b border-gray-200 p-1.5 text-xs font-semibold dark:border-[#222631]">
            <button
              onClick={() => setRightTab('notebook')}
              className={`rounded-lg py-1.5 transition ${
                rightTab === 'notebook'
                  ? 'bg-white text-blue-600 shadow-2xs dark:bg-[#1d2230] dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              Notebook ({doc.annotations?.length || 0})
            </button>
            <button
              onClick={() => setRightTab('info')}
              className={`rounded-lg py-1.5 transition ${
                rightTab === 'info'
                  ? 'bg-white text-blue-600 shadow-2xs dark:bg-[#1d2230] dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setRightTab('chat')}
              className={`rounded-lg py-1.5 transition ${
                rightTab === 'chat'
                  ? 'bg-white text-purple-600 shadow-2xs dark:bg-[#1d2230] dark:text-purple-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              👻 AI Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 text-xs">
            {/* TAB 1: NOTEBOOK (Highlights, Notes, Area Snapshots, Markdown Export) */}
            {rightTab === 'notebook' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-gray-400">
                    Document Annotations
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyNotebookMarkdown}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                    >
                      {copiedMd ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy MD
                    </button>
                    <a
                      href={`/api/export?format=markdown&documentId=${doc.id}`}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500"
                    >
                      <Download className="h-3 w-3" />
                      Export
                    </a>
                  </div>
                </div>

                {/* Document-Level Note */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500">
                    Document Note (Shift+N)
                  </label>
                  <textarea
                    rows={2}
                    defaultValue={doc.documentNote}
                    key={doc.id}
                    onBlur={(e) => {
                      if (e.target.value !== doc.documentNote) {
                        mutateState(
                          'update-document-metadata',
                          { documentId: doc.id, documentNote: e.target.value },
                          'Updated document note'
                        );
                      }
                    }}
                    placeholder="Write an overarching synthesis note for this document..."
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>

                {/* Highlights List */}
                {(!doc.annotations || doc.annotations.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-400 dark:border-gray-800">
                    Press <kbd className="font-mono font-bold">h</kbd> on any paragraph or select
                    text to add your first highlight.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doc.annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs dark:border-gray-800 dark:bg-[#171b24]"
                      >
                        <div
                          className={`border-l-3 pl-2.5 text-xs leading-relaxed ${
                            ann.color === 'blue'
                              ? 'border-blue-500'
                              : ann.color === 'pink'
                              ? 'border-pink-500'
                              : ann.color === 'orange'
                              ? 'border-orange-500'
                              : 'border-yellow-400'
                          }`}
                        >
                          &ldquo;{ann.selectedText}&rdquo;
                        </div>

                        {/* Color Swatches + Delete */}
                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {(['yellow', 'blue', 'pink', 'orange'] as const).map((c) => (
                              <button
                                key={c}
                                title={`Color: ${c}`}
                                onClick={() =>
                                  mutateState('update-annotation', {
                                    annotationId: ann.id,
                                    color: c,
                                  })
                                }
                                className={`h-3.5 w-3.5 rounded-full border ${
                                  c === 'yellow'
                                    ? 'bg-yellow-400'
                                    : c === 'blue'
                                    ? 'bg-blue-400'
                                    : c === 'pink'
                                    ? 'bg-pink-400'
                                    : 'bg-orange-400'
                                } ${ann.color === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                              />
                            ))}
                          </div>
                          <button
                            onClick={() =>
                              mutateState(
                                'delete-annotation',
                                { annotationId: ann.id },
                                'Deleted highlight'
                              )
                            }
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Editable Note */}
                        <input
                          type="text"
                          defaultValue={ann.note}
                          onBlur={(e) => {
                            if (e.target.value !== ann.note) {
                              mutateState(
                                'update-annotation',
                                { annotationId: ann.id, note: e.target.value },
                                'Saved highlight note'
                              );
                            }
                          }}
                          placeholder="Add a note or .c1 flashcard tag..."
                          className="mt-2 w-full rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[11px] dark:border-gray-800 dark:bg-gray-900"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DOCUMENT INFO & GHOSTREADER SUMMARY */}
            {rightTab === 'info' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-purple-200/70 bg-purple-50/40 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/20">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      Ghostreader Auto-Summary
                    </span>
                    <button
                      onClick={() => runGhostreaderPrompt('SUMMARIZE_DOCUMENT')}
                      className="text-[11px] font-semibold text-purple-600 hover:underline dark:text-purple-400"
                    >
                      Regenerate
                    </button>
                  </div>
                  <p className="mt-2 leading-relaxed text-gray-700 dark:text-gray-300">
                    {doc.generatedSummary || doc.summary}
                  </p>
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Title</span>
                    <span className="font-semibold text-right max-w-[180px] truncate">{doc.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Author</span>
                    <span className="font-medium">{doc.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category</span>
                    <span className="uppercase font-semibold">{doc.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Word Count</span>
                    <span>{doc.wordCount.toLocaleString()} words</span>
                  </div>
                </div>

                <button
                  onClick={() => setEditMetadataModalOpen(true)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  Edit Metadata (Shift+M)
                </button>
              </div>
            )}

            {/* TAB 3: GHOSTREADER DOCUMENT AI CHAT */}
            {rightTab === 'chat' && (
              <div className="flex h-full flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="rounded-xl border border-purple-200/60 bg-purple-50/40 p-3 dark:border-purple-900/40 dark:bg-purple-950/20">
                    <div className="font-bold text-purple-700 dark:text-purple-300">
                      👻 Ghostreader Document Copilot
                    </div>
                    <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
                      Ask questions grounded in <strong>{doc.title}</strong> or click a quick Jinja2 prompt below.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {docPrompts.slice(0, 4).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => runGhostreaderPrompt(p.actionKey)}
                          className="rounded-lg border border-purple-200 bg-white px-2 py-1 text-[10px] font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-gray-900 dark:text-purple-300"
                        >
                          {p.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {ghostLoading && (
                    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center text-purple-600 animate-pulse dark:border-gray-800 dark:bg-gray-900">
                      Ghostreader is rendering Jinja2 template &amp; synthesizing response...
                    </div>
                  )}

                  {ghostOutputs.map((out) => (
                    <div
                      key={out.id}
                      className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs dark:border-gray-800 dark:bg-[#171b24]"
                    >
                      <div className="font-bold text-purple-600 dark:text-purple-400">
                        {out.title}
                      </div>
                      <div className="mt-1.5 whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">
                        {out.response}
                      </div>
                      <button
                        onClick={() =>
                          handleHighlightParagraph(
                            0,
                            out.response.slice(0, 220),
                            'blue',
                            `Ghostreader (${out.title})`
                          )
                        }
                        className="mt-2 text-[10px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        + Save Output to Notebook
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!docQuestion.trim()) return;
                    runGhostreaderPrompt('ASK_DOCUMENT', docQuestion.trim());
                    setDocQuestion('');
                  }}
                  className="pt-2"
                >
                  <input
                    type="text"
                    value={docQuestion}
                    onChange={(e) => setDocQuestion(e.target.value)}
                    placeholder="Ask a question about this document..."
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
                  />
                </form>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Edit Metadata Modal (Shift+M) */}
      {editMetadataModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditMetadataModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-[#151922]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold">Edit Document Metadata</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-500">Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-500">Author</label>
                <input
                  type="text"
                  value={metaAuthor}
                  onChange={(e) => setMetaAuthor(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-500">Source URL</label>
                <input
                  type="text"
                  value={metaUrl}
                  onChange={(e) => setMetaUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setEditMetadataModalOpen(false)}
                className="rounded-xl px-4 py-2 text-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await mutateState(
                    'update-document-metadata',
                    {
                      documentId: doc.id,
                      title: metaTitle,
                      author: metaAuthor,
                      url: metaUrl,
                    },
                    'Updated document metadata'
                  );
                  setEditMetadataModalOpen(false);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
              >
                Save Metadata
              </button>
            </div>
          </div>
        </div>
      )}

      <GlobalModals />
    </div>
  );
}

export default function DocumentReaderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Opening Document Reader...</div>}>
      <DocumentReaderInner />
    </Suspense>
  );
}
