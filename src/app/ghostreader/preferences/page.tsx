'use client';

import React, { useState } from 'react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Sparkles, RotateCcw, Plus, Check, Play, Code2 } from 'lucide-react';

export default function GhostreaderPreferencesPage() {
  const { ghostreaderPrompts, documents, mutateState } = useReader();
  const [selectedPromptId, setSelectedPromptId] = useState<string>(
    ghostreaderPrompts[0]?.id || ''
  );
  const [customTitle, setCustomTitle] = useState('');
  const [customTemplate, setCustomTemplate] = useState('');
  const [customType, setCustomType] = useState<'DOCUMENT' | 'CONTENT'>('DOCUMENT');
  const [creatingNew, setCreatingNew] = useState(false);
  const [testOutput, setTestOutput] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const selectedPrompt =
    ghostreaderPrompts.find((p) => p.id === selectedPromptId) || ghostreaderPrompts[0];

  const handleSelectPrompt = (p: any) => {
    setCreatingNew(false);
    setSelectedPromptId(p.id);
    setCustomTitle(p.title);
    setCustomTemplate(p.template);
    setCustomType(p.promptType);
    setTestOutput('');
  };

  const activeTitle = creatingNew
    ? customTitle
    : customTitle || selectedPrompt?.title || '';
  const activeTemplate = creatingNew
    ? customTemplate
    : customTemplate || selectedPrompt?.template || '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingNew) {
      await mutateState(
        'save-ghostreader-prompt',
        {
          promptType: customType,
          title: activeTitle || 'Custom Jinja2 Prompt',
          template: activeTemplate,
        },
        'Created custom Ghostreader Jinja2 prompt'
      );
      setCreatingNew(false);
    } else if (selectedPrompt) {
      await mutateState(
        'save-ghostreader-prompt',
        {
          promptId: selectedPrompt.id,
          title: activeTitle,
          template: activeTemplate,
        },
        `Updated "${activeTitle}" prompt template`
      );
    }
  };

  const handleTestRender = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/ghostreader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'prompt',
          documentId: documents[0]?.id,
          actionKey: selectedPrompt?.actionKey || 'CUSTOM',
          customTemplate: activeTemplate,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestOutput(
          `--- RENDERED JINJA2 PROMPT ---\n${data.renderedPrompt}\n\n--- GHOSTREADER OUTPUT ---\n${data.response}`
        );
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <WorkspaceShell
      title="Ghostreader Preferences & Jinja2 Prompt Studio"
      subtitle="Customize built-in prompts or author custom Jinja2 templates with central_sentences, num_tokens, and lexical_search filters"
      headerActions={
        <button
          onClick={() => {
            setCreatingNew(true);
            setCustomTitle('✨ Executive Critique');
            setCustomTemplate(
              `{% if (document.content | num_tokens) > 2500 %}\n{{ document.content | central_sentences }}\n{% else %}\n{{ document.content }}\n{% endif %}\n\nProvide a rigorous technical critique of "{{ document.title }}" by {{ document.author }}.`
            );
          }}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500"
        >
          <Plus className="h-3.5 w-3.5" />
          New Custom Prompt
        </button>
      }
    >
      <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-12">
        {/* Left List of Document & Content Prompts */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#141821]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Document-Level Prompts (Shift+G)
            </h3>
            <div className="mt-2 space-y-1 text-xs">
              {ghostreaderPrompts
                .filter((p) => p.promptType === 'DOCUMENT')
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPrompt(p)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium transition ${
                      !creatingNew && selectedPrompt?.id === p.id
                        ? 'bg-purple-600/15 font-bold text-purple-700 dark:text-purple-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{p.title}</span>
                    <span className="font-mono text-[10px] text-gray-400">{p.actionKey}</span>
                  </button>
                ))}
            </div>

            <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-400">
              Selection / Highlight Prompts (G)
            </h3>
            <div className="mt-2 space-y-1 text-xs">
              {ghostreaderPrompts
                .filter((p) => p.promptType === 'CONTENT')
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPrompt(p)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium transition ${
                      !creatingNew && selectedPrompt?.id === p.id
                        ? 'bg-purple-600/15 font-bold text-purple-700 dark:text-purple-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{p.title}</span>
                    <span className="font-mono text-[10px] text-gray-400">{p.actionKey}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Right Jinja2 Template Editor */}
        <div className="space-y-4 lg:col-span-8">
          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#141821]"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-purple-600" />
                <h2 className="text-base font-bold">
                  {creatingNew ? 'Create Custom Jinja2 Prompt' : `Edit Prompt: ${selectedPrompt?.title}`}
                </h2>
              </div>
              {!creatingNew && selectedPrompt?.isBuiltIn && (
                <button
                  type="button"
                  onClick={() => {
                    mutateState(
                      'reset-ghostreader-prompt',
                      { actionKey: selectedPrompt.actionKey },
                      'Reset prompt to default Jinja2 template'
                    );
                    setCustomTemplate('');
                  }}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to Default
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Prompt Display Title
                </label>
                <input
                  type="text"
                  value={activeTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Prompt Scope
                </label>
                <select
                  value={creatingNew ? customType : selectedPrompt?.promptType || 'DOCUMENT'}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  disabled={!creatingNew}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="DOCUMENT">Document-Level (Shift+G)</option>
                  <option value="CONTENT">Text Selection / Highlight (G)</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Jinja2 Template
                </label>
                <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400">
                  Variables: document.title, document.author, document.content, selection.text, user.tags
                </span>
              </div>
              <textarea
                rows={10}
                value={activeTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-300 bg-gray-950 p-4 font-mono text-xs leading-relaxed text-blue-200 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestRender}
                disabled={testing}
                className="flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
              >
                <Play className="h-3.5 w-3.5" />
                {testing ? 'Testing...' : 'Test Prompt on Sample Document'}
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                <Check className="h-3.5 w-3.5" />
                Save Jinja2 Template
              </button>
            </div>
          </form>

          {testOutput && (
            <div className="rounded-2xl border border-purple-200 bg-white p-5 text-xs dark:border-purple-900/50 dark:bg-[#141821]">
              <div className="font-bold text-purple-600 dark:text-purple-400">
                Live Jinja2 Render &amp; Execution Output
              </div>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-gray-700 dark:text-gray-300">
                {testOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
