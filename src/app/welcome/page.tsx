'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReader } from '@/context/ReaderContext';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Inbox,
  Clock,
  Rss,
  Globe,
  Smartphone,
  Sparkles,
  Layers,
} from 'lucide-react';

type WizardStep = 1 | 2 | 3 | 4;

export default function WelcomeOnboardingPage() {
  const router = useRouter();
  const { user, integrations, mutateState } = useReader();

  const [step, setStep] = useState<WizardStep>(1);
  const [firstName, setFirstName] = useState(user?.firstName || 'Alex');
  const [role, setRole] = useState('Software Engineer / Researcher');
  const [selectedTools, setSelectedTools] = useState<string[]>([
    'Obsidian',
    'Pocket / Instapaper',
    'RSS Reader',
  ]);
  const [workflow, setWorkflow] = useState<'inbox_archive' | 'later_archive'>('inbox_archive');
  const [enableFeed, setEnableFeed] = useState(true);
  const [connectedProviders, setConnectedProviders] = useState<string[]>(['readwise', 'obsidian']);
  const [extensionInstalled, setExtensionInstalled] = useState(false);

  const toggleTool = (t: string) => {
    setSelectedTools((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleProvider = async (provider: string) => {
    const isNowConnected = !connectedProviders.includes(provider);
    setConnectedProviders((prev) =>
      isNowConnected ? [...prev, provider] : prev.filter((p) => p !== provider)
    );
    await mutateState('toggle-integration', {
      provider,
      connected: isNowConnected,
      accountName: user.email,
    });
  };

  const advanceStep = async (next: WizardStep | 'finish') => {
    if (next === 2) {
      await mutateState('update-profile', { firstName });
      await mutateState('update-onboarding-step', {
        onboardingStep: 'welcome_philosophy',
      });
      setStep(2);
    } else if (next === 3) {
      await mutateState('update-onboarding-step', {
        onboardingStep: 'welcome_integrations',
        workflow,
        enableFeed,
      });
      setStep(3);
    } else if (next === 4) {
      await mutateState('update-onboarding-step', {
        onboardingStep: 'welcome_extension',
      });
      setStep(4);
    } else if (next === 'finish') {
      await mutateState(
        'update-onboarding-step',
        {
          onboardingStep: '/new',
          workflow,
          enableFeed,
        },
        'Onboarding complete! Welcome to Readwise Reader.'
      );
      router.push('/new');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b0d12] dark:text-gray-100">
      {/* Top Progress Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-[#12161f]">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              R
            </div>
            <span className="font-semibold">Readwise Reader Setup</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            {[
              { s: 1, label: '1. Profile' },
              { s: 2, label: '2. Library Philosophy' },
              { s: 3, label: '3. Integrations' },
              { s: 4, label: '4. Extension & Apps' },
            ].map((item) => (
              <button
                key={item.s}
                onClick={() => setStep(item.s as WizardStep)}
                className={`rounded-full px-3 py-1 transition ${
                  step === item.s
                    ? 'bg-blue-600 text-white'
                    : step > item.s
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* STEP 1: Profile & Survey */}
        {step === 1 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#131722]">
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Step 1 of 4 • Welcome Survey
            </span>
            <h1 className="mt-3 text-2xl font-bold">Welcome to Readwise Reader!</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Let&apos;s tailor your reading workspace, keyboard shortcuts, and Ghostreader AI prompts.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  What best describes your primary reading goal?
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option>Software Engineer / Researcher</option>
                  <option>Founder / Product Manager</option>
                  <option>Writer / Content Creator</option>
                  <option>Academic / Student</option>
                  <option>Lifelong Learner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Which tools do you currently use? (Select all that apply)
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {[
                    'Pocket / Instapaper',
                    'Feedly / Reeder',
                    'Obsidian',
                    'Notion',
                    'Logseq / Roam',
                    'Kindle',
                    'Apple Books',
                    'Matter / Raindrop',
                    'Zotero / PDFs',
                  ].map((tool) => {
                    const active = selectedTools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleTool(tool)}
                        className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition ${
                          active
                            ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <span>{tool}</span>
                        {active && <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => advanceStep(2)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Continue to Library Philosophy
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Library Philosophy */}
        {step === 2 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#131722]">
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Step 2 of 4 • Library Triage Philosophy
            </span>
            <h1 className="mt-3 text-2xl font-bold">Choose Your Reading Workflow</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Reader supports two workflows inspired by Inbox Zero and GTD. You can change this anytime in Preferences.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setWorkflow('inbox_archive')}
                className={`rounded-2xl border p-5 text-left transition ${
                  workflow === 'inbox_archive'
                    ? 'border-2 border-blue-600 bg-blue-50/40 dark:border-blue-500 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Inbox className="h-6 w-6 text-blue-600" />
                  <span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
                    Recommended
                  </span>
                </div>
                <h3 className="mt-3 font-bold">Inbox → Later → Archive</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  Newly saved items land in <strong>Inbox</strong>. Triage them to{' '}
                  <strong>Later</strong> (<code>l</code>) for deep reading or{' '}
                  <strong>Archive</strong> (<code>e</code>) when done.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWorkflow('later_archive')}
                className={`rounded-2xl border p-5 text-left transition ${
                  workflow === 'later_archive'
                    ? 'border-2 border-blue-600 bg-blue-50/40 dark:border-blue-500 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <Clock className="h-6 w-6 text-amber-500" />
                <h3 className="mt-3 font-bold">Shortlist / Later → Archive</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  A classic 2-stage queue where saved items go straight to Later, and you star priority items into Shortlist.
                </p>
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <label className="flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-3">
                  <Rss className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="text-sm font-semibold">Enable RSS &amp; Newsletter Feed View</div>
                    <div className="text-xs text-gray-500">
                      Keep high-volume RSS feeds and newsletters separated from your curated Library.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableFeed}
                  onChange={(e) => setEnableFeed(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600"
                />
              </label>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => advanceStep(3)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Continue to Integrations
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Integrations */}
        {step === 3 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#131722]">
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Step 3 of 4 • Import &amp; Sync
            </span>
            <h1 className="mt-3 text-2xl font-bold">Connect Your Existing Reading Services</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Import your existing reading list from Pocket, Instapaper, Matter, or Feedly, and enable automatic note export.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(integrations.length > 0
                ? integrations
                : [
                    { provider: 'pocket', name: 'Pocket', category: 'import' },
                    { provider: 'instapaper', name: 'Instapaper', category: 'import' },
                    { provider: 'feedly', name: 'Feedly OPML', category: 'import' },
                    { provider: 'matter', name: 'Matter', category: 'import' },
                    { provider: 'raindrop', name: 'Raindrop.io', category: 'import' },
                    { provider: 'obsidian', name: 'Obsidian Sync', category: 'export' },
                    { provider: 'notion', name: 'Notion Export', category: 'export' },
                    { provider: 'logseq', name: 'Logseq Export', category: 'export' },
                  ]
              ).map((intg: any) => {
                const isConnected = connectedProviders.includes(intg.provider) || intg.connected;
                return (
                  <div
                    key={intg.provider}
                    className="flex items-center justify-between rounded-xl border border-gray-200 p-3.5 dark:border-gray-800"
                  >
                    <div>
                      <div className="text-sm font-semibold">{intg.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{intg.category} integration</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleProvider(intg.provider)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        isConnected
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {isConnected ? 'Connected ✓' : 'Connect'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => advanceStep(4)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Continue to Browser Extension
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Browser Extension & Mobile */}
        {step === 4 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#131722]">
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Step 4 of 4 • Save From Anywhere
            </span>
            <h1 className="mt-3 text-2xl font-bold">Install the Browser Extension &amp; Mobile Apps</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Save articles with one click and highlight directly on the open web using the Readwise Reader extension.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                <Globe className="h-7 w-7 text-blue-600" />
                <h3 className="mt-3 font-semibold">Browser Web Clipper &amp; Highlighter</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Available for Chrome, Arc, Brave, Edge, Firefox, and Safari.
                </p>
                <button
                  type="button"
                  onClick={() => setExtensionInstalled(true)}
                  className="mt-4 w-full rounded-lg bg-blue-600/10 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-600/20 dark:text-blue-400"
                >
                  {extensionInstalled ? 'Extension Verified ✓' : 'Simulate Extension Install'}
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                <Smartphone className="h-7 w-7 text-purple-600" />
                <h3 className="mt-3 font-semibold">iOS &amp; Android Apps</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Offline-first mobile reading with Text-to-Speech (TTS) and share sheet integration.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium dark:border-gray-700">
                    iOS App Store
                  </span>
                  <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium dark:border-gray-700">
                    Google Play
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => advanceStep('finish')}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
              >
                <Sparkles className="h-4 w-4" />
                Launch Readwise Reader Inbox
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
