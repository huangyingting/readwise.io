'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  FileText,
  Video,
  Rss,
  Mail,
  Zap,
  CheckCircle2,
  ArrowRight,
  Keyboard,
  Search,
  Headphones,
  Layers,
  Globe,
} from 'lucide-react';

export default function ReadLandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0d12] text-gray-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0d12]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/30">
              R
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Readwise <span className="text-blue-400">Reader</span>
            </span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300">
              Public Beta 2.0
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#formats" className="hover:text-white">
              Multi-Format
            </a>
            <a href="#ghostreader" className="hover:text-white">
              Ghostreader AI
            </a>
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/accounts/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/accounts/signup"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
            >
              Start 30-Day Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            The first read-it-later app built specifically for power readers
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:leading-[1.12]">
            All your reading in one place.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Built for speed & synthesis.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300">
            Stop context-switching between Pocket, Instapaper, Feedly, PDF viewers, EPUB readers,
            email inboxes, and YouTube tabs. Readwise Reader unifies everything with a blazing-fast
            local-first engine, Superhuman-style keyboard navigation, and Ghostreader AI.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/accounts/signup"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Try Reader Free for 30 Days
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/home"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Open Live Interactive Workspace
            </Link>
          </div>

          {/* Interactive Preview Mockup */}
          <div className="mt-16 overflow-hidden rounded-2xl border border-white/15 bg-[#12161f] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#171b26] px-4 py-2.5 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-gray-300">read.readwise.io/new</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-blue-300">
                  Cmd+K Command Palette
                </span>
                <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                  Local-First SQLite + Postgres Sync
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 divide-y divide-white/10 text-left md:grid-cols-12 md:divide-y-0 md:divide-x">
              {/* Left Sidebar Preview */}
              <div className="col-span-3 space-y-2 p-4 text-xs">
                <div className="font-semibold uppercase tracking-wider text-gray-400">Library</div>
                <div className="flex items-center justify-between rounded-lg bg-blue-600/20 px-3 py-2 font-medium text-blue-300">
                  <span>Inbox</span>
                  <span>4</span>
                </div>
                <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-gray-300">
                  <span>Later</span>
                  <span>2</span>
                </div>
                <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-gray-300">
                  <span>Archive</span>
                  <span>2</span>
                </div>
                <div className="pt-3 font-semibold uppercase tracking-wider text-gray-400">
                  Pinned Views
                </div>
                <div className="px-3 py-1.5 text-gray-300">★ Shortlist</div>
                <div className="px-3 py-1.5 text-gray-300">⚡ Quick reads (&lt;5m)</div>
                <div className="px-3 py-1.5 text-gray-300">👻 Ask Ghostreader</div>
              </div>

              {/* Center Reader Preview */}
              <div className="col-span-6 p-6">
                <div className="text-xs font-medium text-blue-400">
                  paulgraham.com • 12 min read • Article
                </div>
                <h3 className="mt-1 text-xl font-bold text-white">
                  How to Do Great Work: A Guide for Ambitious Builders
                </h3>
                <p className="mt-3 rounded-lg border-l-2 border-blue-500 bg-blue-500/10 p-3 text-sm leading-relaxed text-gray-200">
                  If you collected lists of techniques for doing great work in a lot of different
                  fields, what would the intersection look like?{' '}
                  <mark className="rounded bg-yellow-400/30 px-1 text-yellow-200">
                    Curiosity is the best guide. Your curiosity never lies, and it knows more than
                    you do about what&apos;s worth paying attention to.
                  </mark>
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                    Press <kbd className="text-blue-300">h</kbd> to Highlight
                  </span>
                  <span className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                    Press <kbd className="text-blue-300">n</kbd> to Add Margin Note
                  </span>
                  <span className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                    Press <kbd className="text-blue-300">Shift+G</kbd> for Ghostreader AI
                  </span>
                </div>
              </div>

              {/* Right Inspector Preview */}
              <div className="col-span-3 space-y-3 p-4 text-xs">
                <div className="font-semibold uppercase tracking-wider text-gray-400">
                  👻 Ghostreader Summary
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 leading-relaxed text-gray-300">
                  • Follow deep curiosity to the frontier of knowledge.
                  <br />• Notice gaps that others overlook.
                  <br />• Build Compounding Daily Habits.
                </div>
                <div className="font-semibold uppercase tracking-wider text-gray-400">
                  Notebook Highlights (2)
                </div>
                <div className="rounded-lg border-l-2 border-yellow-400 bg-yellow-400/10 p-2.5 text-gray-200">
                  &ldquo;Curiosity never lies...&rdquo;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Format Section */}
      <section id="formats" className="border-t border-white/10 bg-[#0e1118] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Every Content Format. One Unified Reading Workflow.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-400">
              Highlight across articles, PDFs, EPUB books, newsletters, Twitter threads, and
              time-synced YouTube transcripts.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Globe,
                title: 'Web Articles & Blog Posts',
                desc: 'Clean, distraction-free parsing with paragraph-level keyboard focus (j/k) and instant highlighting (h).',
              },
              {
                icon: FileText,
                title: 'PDF Research Papers',
                desc: 'Full PDF page canvas, Enhanced Text reflow mode, and rectangular Area Snapshot highlighting for figures & tables.',
              },
              {
                icon: BookOpen,
                title: 'EPUB Long-Form Books',
                desc: 'Multi-chapter table of contents navigation, customizable typography, and bidirectional highlight syncing.',
              },
              {
                icon: Video,
                title: 'YouTube Video Transcripts',
                desc: 'Watch embedded videos alongside an auto-scrolling, clickable transcript. Highlight spoken sentences directly.',
              },
              {
                icon: Rss,
                title: 'RSS Feeds & Unseen Triage',
                desc: 'High-volume RSS aggregation with Unseen/Seen tabs, OPML import/export, and 1-key promotion to your Library.',
              },
              {
                icon: Mail,
                title: 'Email Newsletters & Threads',
                desc: 'Dedicated @library.readwise.io and @feed.readwise.io addresses plus 1-click X/Twitter thread unrolling.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-blue-500/40 hover:bg-white/[0.05]"
              >
                <item.icon className="h-8 w-8 text-blue-400" />
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ghostreader & Power Features */}
      <section id="ghostreader" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-3.5 py-1 text-xs font-semibold text-purple-300">
              <Sparkles className="h-3.5 w-3.5" />
              Programmable Jinja2 AI Copilot
            </div>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Meet Ghostreader: Your AI Reading Partner
            </h2>
            <p className="mt-4 text-gray-300 leading-relaxed">
              Ask questions across your entire library with grounded citations, generate executive
              summaries, define complex terms in context, create Q&amp;A flashcards, or customize
              every prompt using Jinja2 templates and filters like{' '}
              <code className="text-purple-300">central_sentences</code> and{' '}
              <code className="text-purple-300">lexical_search</code>.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Boolean Query DSL Filtered Views (<code>category:article AND minutes__lt:5</code>)
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Word-synchronized Text-to-Speech (TTS) audio player with speed controls
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Customizable Markdown export templates for Obsidian, Notion, Logseq &amp; Roam
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/15 bg-[#141822] p-6 font-mono text-xs text-gray-200 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 text-gray-400">
              <span>Ghostreader Jinja2 Prompt Template</span>
              <span className="text-purple-400">SUMMARIZE_DOCUMENT</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-blue-200">
{`{% if (document.content | num_tokens) > 2500 %}
  {{ document.content | central_sentences }}
{% else %}
  {{ document.content }}
{% endif %}

Summarize "{{ document.title }}" by {{ document.author }}
in three concise bullet points and one key takeaway.`}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#080a0e] px-6 py-12 text-sm text-gray-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              R
            </div>
            <span className="font-semibold text-white">Readwise Reader</span>
            <span>© 2026 Readwise Inc.</span>
          </div>
          <div className="flex flex-wrap gap-6">
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/accounts/login" className="hover:text-white">
              Log In
            </Link>
            <Link href="/accounts/signup" className="hover:text-white">
              Sign Up
            </Link>
            <Link href="/home" className="hover:text-white">
              Launch App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
