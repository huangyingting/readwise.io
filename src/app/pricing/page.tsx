'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-[#0b0d12] text-gray-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0b0d12]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/read" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              R
            </div>
            <span className="text-lg font-semibold text-white">Readwise Pricing</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/accounts/login"
              className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/accounts/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Start 30-Day Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
            Invest in Your Reading &amp; Knowledge Retention
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Every plan starts with a full-featured 30-day free trial. No credit card required to
            start reading.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-1.5">
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                annual ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual Billing <span className="ml-1 text-xs text-blue-200">(Save 20%)</span>
            </button>
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                !annual ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {/* Free Trial / Community */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-200">30-Day Full Trial</h3>
              <p className="mt-2 text-sm text-gray-400">
                Experience all of Readwise &amp; Reader without restrictions for 30 days.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-sm text-gray-400">/ first 30 days</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-gray-300">
                {[
                  'Full access to Readwise Reader web, desktop & mobile',
                  'Import from Pocket, Instapaper, Matter & Feedly',
                  'Unlimited highlights, notes & tags',
                  'Try Ghostreader AI summarization & Q&A',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/accounts/signup"
              className="mt-8 block w-full rounded-xl border border-white/20 bg-white/5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Readwise Lite */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.04] p-8">
            <div>
              <h3 className="text-lg font-semibold text-white">Readwise Lite</h3>
              <p className="mt-2 text-sm text-gray-400">
                Daily spaced repetition review of your Kindle, Apple Books, and article highlights.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">
                  ${annual ? '5.59' : '6.99'}
                </span>
                <span className="text-sm text-gray-400">/ month</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {annual ? 'Billed as $67.08 annually' : 'Billed monthly'}
              </p>
              <ul className="mt-8 space-y-3 text-sm text-gray-300">
                {[
                  'Daily Readwise Email & App Review',
                  'Sync highlights from Kindle, Instapaper, Pocket',
                  'Spaced repetition flashcards',
                  'Tagging & search across highlights',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/accounts/signup?plan=lite"
              className="mt-8 block w-full rounded-xl border border-blue-500/40 bg-blue-600/20 py-3 text-center text-sm font-semibold text-blue-200 hover:bg-blue-600/30"
            >
              Choose Readwise Lite
            </Link>
          </div>

          {/* Full Readwise + Reader */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-blue-500 bg-gradient-to-b from-blue-600/15 to-transparent p-8 shadow-2xl shadow-blue-600/10">
            <div className="absolute -top-3.5 right-6 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              <Sparkles className="h-3 w-3" /> Most Popular
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Full Readwise + Reader</h3>
              <p className="mt-2 text-sm text-gray-300">
                Complete access to Readwise Reader, Ghostreader AI, PDF/EPUB/YouTube &amp; Obsidian/Notion exports.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">
                  ${annual ? '9.99' : '12.99'}
                </span>
                <span className="text-sm text-gray-300">/ month</span>
              </div>
              <p className="mt-1 text-xs text-blue-300">
                {annual ? 'Billed as $119.88 annually' : 'Billed monthly'}
              </p>
              <ul className="mt-8 space-y-3 text-sm text-gray-200">
                {[
                  'Everything in Readwise Lite + Full Readwise Reader',
                  'Web Articles, RSS Feeds, Newsletters, PDFs, EPUBs & YouTube',
                  'Ghostreader AI Copilot with custom Jinja2 templates',
                  'Text-to-Speech (TTS) with word-by-word highlighting',
                  'Auto-export to Obsidian, Notion, Logseq, Roam & Markdown',
                  'Boolean Query DSL Filtered Views & Superhuman shortcuts',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/accounts/signup?plan=full"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
            >
              Start 30-Day Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 border-t border-white/10 pt-14">
          <h2 className="text-center text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              {
                q: 'Is Readwise Reader included in Full Readwise?',
                a: 'Yes! Full Readwise includes both the classic Readwise spaced-repetition highlighter review app and the complete Readwise Reader application across Web, Mac, Windows, iOS, and Android.',
              },
              {
                q: 'Do I need a credit card for the 30-day free trial?',
                a: 'No credit card is required to sign up and test every feature of Readwise Reader for 30 days.',
              },
              {
                q: 'What happens to my highlights and library if I cancel?',
                a: 'Your data belongs to you. You can export your entire library as CSV, your RSS feeds as OPML, and all your highlights and notes as Markdown at any time.',
              },
              {
                q: 'Does Ghostreader AI cost extra?',
                a: 'Ghostreader is included in your Full Readwise subscription, along with customizable Jinja2 prompt templates.',
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-6"
              >
                <h4 className="flex items-center gap-2 font-semibold text-white">
                  <HelpCircle className="h-4 w-4 text-blue-400" />
                  {item.q}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
