'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import {
  Sparkles,
  Send,
  BookOpen,
  Compass,
  Plus,
  Settings,
  ExternalLink,
} from 'lucide-react';

export default function GhostreaderLibraryChatPage() {
  const { ghostreaderThreads, refreshState } = useReader();
  const [mode, setMode] = useState<'ask_library' | 'recommend_library'>('ask_library');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    ghostreaderThreads[0]?.id || null
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const activeThread =
    ghostreaderThreads.find((t) => t.id === activeThreadId) || ghostreaderThreads[0];

  const handleSend = async (promptText?: string) => {
    const q = (promptText ?? input).trim();
    if (!q) return;
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/ghostreader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          threadId: activeThread?.id,
          question: q,
        }),
      });
      const data = await res.json();
      if (data.ok && data.thread?.id) {
        await refreshState();
        setActiveThreadId(data.thread.id);
      }
    } finally {
      setSending(false);
    }
  };

  const starterQuestions =
    mode === 'ask_library'
      ? [
          'What are the core architectural insights across my saved articles and PDFs?',
          'How does Paul Graham suggest discovering what to work on?',
          'Summarize the scaling laws findings in my saved AI research papers.',
          'Compare local-first SQLite WASM architectures with traditional cloud sync.',
        ]
      : [
          'What should I read next if I only have 10 minutes?',
          'Recommend the highest-leverage deep read in my Inbox or Later queue.',
          'Which unread article or video relates most to AI engineering?',
        ];

  return (
    <WorkspaceShell
      title="Ask Ghostreader (Library RAG Copilot)"
      subtitle="Synthesize insights across all your saved articles, PDFs, EPUBs, highlights, and notes"
      headerActions={
        <Link
          href="/ghostreader/preferences"
          className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800/50 dark:bg-purple-950/30 dark:text-purple-300"
        >
          <Settings className="h-3.5 w-3.5" />
          Customize Jinja2 Prompts
        </Link>
      }
    >
      <div className="mx-auto flex h-full max-w-5xl flex-col justify-between p-6">
        <div className="space-y-6 overflow-y-auto pb-6">
          {/* Mode Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#141821]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('ask_library')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  mode === 'ask_library'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ask Your Library
              </button>
              <button
                onClick={() => setMode('recommend_library')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  mode === 'recommend_library'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                Discovery &amp; What to Read Next
              </button>
            </div>

            <button
              onClick={() => setActiveThreadId(null)}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Plus className="h-3.5 w-3.5" />
              New Thread
            </button>
          </div>

          {/* Starter Prompt Suggestions */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {starterQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-left text-xs font-medium text-gray-700 transition hover:border-purple-400 hover:bg-purple-50/40 dark:border-gray-800 dark:bg-[#151923] dark:text-gray-300"
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>

          {/* Conversation Messages */}
          {activeThread && activeThread.messages?.length > 0 && (
            <div className="space-y-4">
              {activeThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-2xl border p-5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-12 border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20'
                      : 'mr-6 border-purple-200/70 bg-white shadow-2xs dark:border-gray-800 dark:bg-[#141821]'
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <span>
                      {msg.role === 'user' ? 'You' : '👻 Ghostreader Library Synthesis'}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {msg.content}
                  </div>

                  {/* Grounded Document Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Grounded Library Sources Cited:
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.citations.map((cit) => (
                          <Link
                            key={cit.id}
                            href={`/new/read/${cit.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400"
                          >
                            <BookOpen className="h-3 w-3" />
                            <span>{cit.title}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sending && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-4 text-xs font-semibold text-purple-600 animate-pulse dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-300">
              Ghostreader is searching your library and synthesizing citations...
            </div>
          )}
        </div>

        {/* Bottom Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3 rounded-2xl border border-gray-300 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-[#151922]"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'ask_library'
                ? 'Ask a question across your entire library and highlights...'
                : 'Describe what you are in the mood to read next...'
            }
            className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Ask Ghostreader
          </button>
        </form>
      </div>
    </WorkspaceShell>
  );
}
