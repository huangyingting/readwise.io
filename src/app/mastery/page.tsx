'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { useReader } from '@/context/ReaderContext';

export default function MasteryFlashcardsPage() {
  const { documents, mutateState } = useReader();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const flashcards = useMemo(() => {
    const cards: any[] = [];
    for (const doc of documents) {
      if (doc.triageStatus === 'trash') continue;
      for (const ann of doc.annotations || []) {
        if (ann.isDiscarded) continue;
        cards.push({
          ...ann,
          docTitle: doc.title,
          docAuthor: doc.author || doc.domain,
          docId: doc.id,
        });
      }
    }
    return cards;
  }, [documents]);

  const stats = useMemo(() => {
    let newCount = 0;
    let learningCount = 0;
    let youngCount = 0;
    let matureCount = 0;
    for (const c of flashcards) {
      const r = c.reviewCount || 0;
      const ivl = c.intervalDays || 1;
      if (r === 0) newCount++;
      else if (ivl <= 3) learningCount++;
      else if (ivl < 14) youngCount++;
      else matureCount++;
    }
    return { newCount, learningCount, youngCount, matureCount };
  }, [flashcards]);

  const activeCard = flashcards[idx % Math.max(1, flashcards.length)] || null;

  const handleGrade = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!activeCard) return;
    await mutateState(
      'review-annotation',
      { annotationId: activeCard.id, rating },
      `Graded flashcard "${rating.toUpperCase()}"`
    );
    setFlipped(false);
    setIdx((prev) => prev + 1);
  };

  return (
    <WorkspaceShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Thematic Mastery &amp; Active Recall Flashcards
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Master your library through Question &amp; Answer flashcards and Cloze Deletions scheduled by SM-2.
            </p>
          </div>
          <Link
            href="/daily-review"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            🔥 Back to Daily Review
          </Link>
        </div>

        {/* Mastery Tier Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500">New Cards</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.newCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Learning (1–3d)</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.learningCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Young (4–13d)</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.youngCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Mastered (14d+)</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.matureCount}</div>
          </div>
        </div>

        {activeCard && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
              <span>
                Source: <strong>{activeCard.docTitle}</strong> ({activeCard.docAuthor})
              </span>
              <span>
                Ease: {(activeCard.easeFactor || 2.5).toFixed(2)} • Interval:{' '}
                {activeCard.intervalDays || 1}d
              </span>
            </div>

            <div className="min-h-[180px] flex flex-col justify-center">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">
                {activeCard.flashcardQuestion ? 'Prompt / Question' : 'Cloze / Context Recall'}
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                {activeCard.flashcardQuestion ||
                  activeCard.clozeText ||
                  `What is the key insight from "${activeCard.docTitle}"?`}
              </h2>

              {!flipped ? (
                <div className="mt-6">
                  <button
                    onClick={() => setFlipped(true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold"
                  >
                    Flip Flashcard
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-bold uppercase text-emerald-600">Answer</div>
                  <p className="text-base text-slate-800 dark:text-slate-200">
                    {activeCard.flashcardAnswer || activeCard.selectedText}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-3">
                    <button
                      onClick={() => handleGrade('again')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200"
                    >
                      Again (1d)
                    </button>
                    <button
                      onClick={() => handleGrade('hard')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                    >
                      Hard (3d)
                    </button>
                    <button
                      onClick={() => handleGrade('good')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Good (7d+)
                    </button>
                    <button
                      onClick={() => handleGrade('easy')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Easy (14d+)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
