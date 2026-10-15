'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { useReader } from '@/context/ReaderContext';

function renderClozeText(cloze: string, revealed: boolean) {
  if (!cloze) return null;
  const parts = cloze.split(/(\{\{c\d+::[^}]+\}\})/g);
  return parts.map((part, idx) => {
    const m = part.match(/^\{\{c\d+::([^}]+)\}\}$/);
    if (!m) return <span key={idx}>{part}</span>;
    const answer = m[1];
    return revealed ? (
      <span
        key={idx}
        className="px-2 py-0.5 mx-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700"
      >
        {answer}
      </span>
    ) : (
      <span
        key={idx}
        className="px-3 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-mono font-bold border border-blue-300 dark:border-blue-700"
      >
        [ … ]
      </span>
    );
  });
}

export default function DailyReviewPage() {
  const { documents, user, mutateState } = useReader();

  const allReviewable = useMemo(() => {
    const list: {
      annotation: any;
      docTitle: string;
      docAuthor: string;
      docCategory: string;
      docId: string;
    }[] = [];

    for (const doc of documents) {
      if (doc.triageStatus === 'trash' || doc.reviewFrequency === 'never') continue;
      for (const ann of doc.annotations || []) {
        if (ann.isDiscarded) continue;
        list.push({
          annotation: ann,
          docTitle: doc.title,
          docAuthor: doc.author || doc.siteName || doc.domain,
          docCategory: doc.category,
          docId: doc.id,
        });
      }
    }
    return list;
  }, [documents]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [cardMode, setCardMode] = useState<'auto' | 'highlight' | 'qa' | 'cloze'>('auto');
  const [editingCard, setEditingCard] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [clozeInput, setClozeInput] = useState('');
  const [completedSession, setCompletedSession] = useState(false);

  const activeItem = allReviewable[currentIndex] || null;
  const ann = activeItem?.annotation;

  const openEditor = () => {
    if (!ann) return;
    setNoteInput(ann.note || '');
    setQuestionInput(ann.flashcardQuestion || '');
    setAnswerInput(ann.flashcardAnswer || ann.selectedText || '');
    setClozeInput(
      ann.clozeText ||
        ann.selectedText.replace(/\b([A-Za-z]{6,})\b/, '{{c1::$1}}')
    );
    setEditingCard(true);
  };

  const handleSaveCardEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ann) return;
    await mutateState(
      'update-flashcard',
      {
        annotationId: ann.id,
        note: noteInput,
        flashcardQuestion: questionInput,
        flashcardAnswer: answerInput,
        clozeText: clozeInput,
      },
      'Saved flashcard & note updates'
    );
    setEditingCard(false);
  };

  const handleGrade = async (rating: 'discard' | 'soon' | 'later' | 'eventually') => {
    if (!ann) return;
    await mutateState(
      'review-annotation',
      { annotationId: ann.id, rating },
      rating === 'discard'
        ? 'Discarded highlight from future reviews'
        : `Scheduled next review (${rating})`
    );
    setRevealed(false);
    setEditingCard(false);
    if (currentIndex + 1 >= allReviewable.length) {
      await mutateState('complete-daily-review', {}, 'Daily Review completed! Streak +1 🔥');
      setCompletedSession(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleToggleFavorite = async () => {
    if (!ann) return;
    await mutateState(
      'toggle-favorite-annotation',
      { annotationId: ann.id },
      ann.isFavorite ? 'Removed from Favorites' : 'Added to Favorites ❤️'
    );
  };

  const effectiveMode = useMemo(() => {
    if (!ann) return 'highlight';
    if (cardMode !== 'auto') return cardMode;
    if (ann.flashcardQuestion) return 'qa';
    if (ann.clozeText) return 'cloze';
    return 'highlight';
  }, [ann, cardMode]);

  return (
    <WorkspaceShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Daily Review
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                🔥 {user.dailyReviewStreak || 5}-Day Streak
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Spaced Repetition (SM-2) review of your Readwise highlights, Q&amp;A flashcards, and Cloze deletions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/mastery"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              🎴 Flashcard Mastery Deck
            </Link>
            <Link
              href="/highlights"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              ✨ All Highlights ({allReviewable.length})
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        {!completedSession && allReviewable.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>
                Reviewing Card <strong>{currentIndex + 1}</strong> of{' '}
                <strong>{allReviewable.length}</strong>
              </span>
              <span>
                {Math.round(((currentIndex + 1) / allReviewable.length) * 100)}% complete
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((currentIndex + 1) / allReviewable.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Completed State */}
        {completedSession || allReviewable.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              You’ve Completed Today’s Daily Review!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              Your spaced repetition intervals have been updated and your{' '}
              <strong>{user.dailyReviewStreak || 6}-day review streak</strong> is locked in.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {allReviewable.length > 0 && (
                <button
                  onClick={() => {
                    setCompletedSession(false);
                    setCurrentIndex(0);
                    setRevealed(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                >
                  Bonus Round: Review Again
                </button>
              )}
              <Link
                href="/books"
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Add Supplemental Books
              </Link>
              <Link
                href="/new"
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Go to Reader Inbox
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Card Source Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/50">
              <div>
                <Link
                  href={`/new/read/${activeItem.docId}`}
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600"
                >
                  {activeItem.docTitle}
                </Link>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>{activeItem.docAuthor}</span>
                  <span>•</span>
                  <span className="uppercase">{activeItem.docCategory}</span>
                  <span>•</span>
                  <span>
                    Reviewed {ann.reviewCount || 0}x (Interval: {ann.intervalDays || 1}d)
                  </span>
                </div>
              </div>

              {/* Card Format Switcher */}
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg text-xs">
                <button
                  onClick={() => {
                    setCardMode('highlight');
                    setRevealed(false);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    effectiveMode === 'highlight'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Highlight
                </button>
                <button
                  onClick={() => {
                    setCardMode('qa');
                    setRevealed(false);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    effectiveMode === 'qa'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Q&amp;A Card
                </button>
                <button
                  onClick={() => {
                    setCardMode('cloze');
                    setRevealed(false);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    effectiveMode === 'cloze'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Cloze Deletion
                </button>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-8 min-h-[260px] flex flex-col justify-center">
              {effectiveMode === 'qa' && ann.flashcardQuestion ? (
                <div className="space-y-5">
                  <div className="inline-block px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-semibold">
                    Active Recall Question
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {ann.flashcardQuestion}
                  </h3>

                  {!revealed ? (
                    <button
                      onClick={() => setRevealed(true)}
                      className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
                    >
                      Show Answer
                    </button>
                  ) : (
                    <div className="p-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Answer
                      </div>
                      <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed">
                        {ann.flashcardAnswer || ann.selectedText}
                      </p>
                      <blockquote className="text-xs text-slate-500 dark:text-slate-400 border-l-2 border-slate-300 pl-3 mt-2 italic">
                        “{ann.selectedText}”
                      </blockquote>
                    </div>
                  )}
                </div>
              ) : effectiveMode === 'cloze' && ann.clozeText ? (
                <div className="space-y-5">
                  <div className="inline-block px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-semibold">
                    Cloze Deletion Recall
                  </div>
                  <p className="text-xl leading-relaxed text-slate-900 dark:text-slate-100 font-serif">
                    {renderClozeText(ann.clozeText, revealed)}
                  </p>
                  {!revealed && (
                    <button
                      onClick={() => setRevealed(true)}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                    >
                      Reveal Cloze Blank
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <blockquote className="text-xl leading-relaxed font-serif text-slate-900 dark:text-slate-100 border-l-4 border-amber-400 pl-5 py-1">
                    “{ann.selectedText}”
                  </blockquote>
                  {ann.note && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900 text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-amber-800 dark:text-amber-300 mr-2">
                        Note:
                      </span>
                      {ann.note}
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {ann.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-6">
                  {ann.tags.map((t: string) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Inline Flashcard & Note Editor */}
            {editingCard && (
              <form
                onSubmit={handleSaveCardEdits}
                className="px-6 py-5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Edit Note, Q&amp;A Flashcard &amp; Cloze Deletion
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Margin Note
                  </label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Q&amp;A Flashcard Question
                    </label>
                    <input
                      type="text"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder="Ask a question about this highlight..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Q&amp;A Flashcard Answer
                    </label>
                    <input
                      type="text"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cloze Deletion Template (wrap target phrase in {'{{c1::phrase}}'})
                  </label>
                  <input
                    type="text"
                    value={clozeInput}
                    onChange={(e) => setClozeInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingCard(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save Flashcard &amp; Note
                  </button>
                </div>
              </form>
            )}

            {/* Action & Spaced Repetition Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFavorite}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    ann.isFavorite
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {ann.isFavorite ? '❤️ Favorited' : '🤍 Favorite (f)'}
                </button>
                <button
                  onClick={openEditor}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  ✏️ Edit / Q&amp;A / Cloze (q)
                </button>
              </div>

              {/* SM-2 Interval Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleGrade('discard')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition"
                >
                  🗑️ Never (d)
                </button>
                <button
                  onClick={() => handleGrade('soon')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-200 transition"
                >
                  Soon • 1d (1)
                </button>
                <button
                  onClick={() => handleGrade('later')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 hover:bg-blue-200 transition"
                >
                  Later • {Math.max(3, Math.round((ann.intervalDays || 1) * 1.5))}d (2)
                </button>
                <button
                  onClick={() => handleGrade('eventually')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
                >
                  Eventually • {Math.max(7, Math.round((ann.intervalDays || 1) * (ann.easeFactor || 2.5)))}d (3)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
