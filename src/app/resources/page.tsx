'use client';

import React from 'react';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Globe, Smartphone, Laptop, Bookmark } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <WorkspaceShell
      title="Apps, Browser Extensions & Resources"
      subtitle="Install Readwise Reader across Web, Desktop, iOS, and Android"
    >
      <div className="mx-auto max-w-5xl grid gap-6 p-6 sm:grid-cols-2">
        {[
          {
            icon: Globe,
            title: 'Browser Web Clipper & Highlighter',
            desc: 'Save articles with 1 click and highlight directly on the open web in Chrome, Arc, Brave, Safari, Firefox, and Edge.',
            badge: 'Chrome / Safari / Firefox',
          },
          {
            icon: Smartphone,
            title: 'iOS & Android Mobile Apps',
            desc: 'Offline-first mobile reading with word-synchronized Text-to-Speech (TTS) and iOS/Android system share sheet integration.',
            badge: 'iOS App Store & Google Play',
          },
          {
            icon: Laptop,
            title: 'Desktop Native Apps (macOS, Windows, Linux)',
            desc: 'Dedicated native desktop app with global keyboard shortcuts and local SQLite caching.',
            badge: 'Apple Silicon / Intel / Windows / AppImage',
          },
          {
            icon: Bookmark,
            title: 'Universal Save Bookmarklet',
            desc: 'Drag our lightweight JavaScript bookmarklet to your browser toolbar to save pages from any device without extensions.',
            badge: '1-Click Bookmarklet',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs dark:border-gray-800 dark:bg-[#141821]"
          >
            <div className="flex items-center justify-between">
              <card.icon className="h-7 w-7 text-blue-600" />
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {card.badge}
              </span>
            </div>
            <h3 className="mt-4 text-base font-bold">{card.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{card.desc}</p>
          </div>
        ))}
      </div>
    </WorkspaceShell>
  );
}
