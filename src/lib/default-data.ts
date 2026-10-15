import { PrismaClient } from '@prisma/client';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  workflow: 'inbox' | 'shortlist' | 'simple';
  defaultPage: 'library' | 'home' | 'feed';
  documentLocations: string[];
  isGhostreaderEnabled: boolean;
  globalGhostreaderEnabled: boolean;
  experimentalOfflineLoadingEnabled: boolean;
  openAiApiKey: string;
  autoAdvance: 'next' | 'previous' | 'close';
  upNextBehavior: 'show' | 'hide';
  leftSidebarPinned: boolean;
  rightSidebarPinned: boolean;
  showSidebarCounts?: boolean;
  autoHighlight?: boolean;
  scrollMarkSeen?: boolean;
  homeViews: string[];
  readerTypography: {
    theme: 'same' | 'light' | 'dark';
    fontFamily: 'sans' | 'serif' | 'mono' | 'dyslexic';
    fontSize: number;
    lineSpacing: number;
    lineWidth: 'narrow' | 'medium' | 'wide';
    justifyText: boolean;
    continuousScroll: boolean;
    autoHighlight: boolean;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string;
  };
  emailPreferences: {
    wisereads: boolean;
    dailySummary: boolean;
    feedbackEmails: boolean;
  };
  twitter: {
    saveThreadsInReader: boolean;
    saveArticlesInReader: boolean;
    saveBookmarksInReader: boolean;
    saveThreadsInReadwise: boolean;
    saveBookmarksInReadwise: boolean;
    saveSingleTweetsInReader: boolean;
    saveSingleTweetsInReadwise: boolean;
  };
  shortcuts: Record<string, string>;
  exportTemplate: string;
}

export const DEFAULT_SHORTCUTS: Record<string, string> = {
  'Open command palette': 'cmd+k',
  'Open search': '/',
  'Pin or unpin left sidebar': '[',
  'Pin or unpin right sidebar': ']',
  'Toggle Zen focus mode': '\\',
  'Open next item': 'j',
  'Open previous item': 'k',
  'Move down and open': 'Shift+J',
  'Move up and open': 'Shift+K',
  'Archive or unarchive item': 'e',
  'Move item to Later': 'l',
  'Move item to Inbox': 'i',
  'Move item to Shortlist': 's',
  'Delete item': 'd',
  'Highlight focused paragraph': 'h',
  'Tag item': 't',
  'Tag document': 'Shift+T',
  'Add note to item': 'n',
  'Add document note': 'Shift+N',
  'Edit metadata': 'Shift+M',
  'Invoke Ghostreader': 'g',
  'Invoke Document Ghostreader': 'Shift+G',
  'Share item': 'Shift+S',
  'Show action menu': 'm',
  'Bulk actions': 'Shift+B',
  'Save new URL': 'a',
  'Upload file': 'u',
  'Undo last action': 'z',
};

export const DEFAULT_EXPORT_TEMPLATE = `# {{ document.title }}
- **Author:** {{ document.author }}
- **URL:** {{ document.url }}
- **Category:** {{ document.category }}
- **Saved:** {{ document.saved_at }}
{% if document.document_note %}
## Document Note
{{ document.document_note }}
{% endif %}
## Highlights & Annotations
{% for h in highlights %}
> {{ h.text }}
{% if h.note %}- *Note:* {{ h.note }}{% endif %}
{% if h.tags %}- *Tags:* {{ h.tags }}{% endif %}
{% endfor %}`;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'light',
  workflow: 'inbox',
  defaultPage: 'library',
  documentLocations: ['feed', 'new', 'later', 'archive'],
  isGhostreaderEnabled: true,
  globalGhostreaderEnabled: true,
  experimentalOfflineLoadingEnabled: true,
  openAiApiKey: '',
  autoAdvance: 'next',
  upNextBehavior: 'show',
  leftSidebarPinned: true,
  rightSidebarPinned: true,
  showSidebarCounts: true,
  autoHighlight: true,
  scrollMarkSeen: false,
  homeViews: [
    'continue_reading',
    'recently_added',
    'shortlist',
    'quick_reads',
    'new_in_feed',
    'long_reads',
    'recently_highlighted',
  ],
  readerTypography: {
    theme: 'same',
    fontFamily: 'serif',
    fontSize: 18,
    lineSpacing: 1.65,
    lineWidth: 'medium',
    justifyText: false,
    continuousScroll: true,
    autoHighlight: true,
  },
  digest: {
    enabled: false,
    frequency: 'daily',
    time: '08:00',
  },
  emailPreferences: {
    wisereads: true,
    dailySummary: true,
    feedbackEmails: true,
  },
  twitter: {
    saveThreadsInReader: true,
    saveArticlesInReader: true,
    saveBookmarksInReader: false,
    saveThreadsInReadwise: true,
    saveBookmarksInReadwise: true,
    saveSingleTweetsInReader: false,
    saveSingleTweetsInReadwise: true,
  },
  shortcuts: DEFAULT_SHORTCUTS,
  exportTemplate: DEFAULT_EXPORT_TEMPLATE,
};

export const BUILTIN_FILTERED_VIEWS = [
  { key: 'articles', name: 'Articles', query: 'category:article', isPinned: false, isBuiltIn: true },
  { key: 'epubs', name: 'Books', query: 'category:epub', isPinned: false, isBuiltIn: true },
  { key: 'emails', name: 'Emails', query: 'category:email', isPinned: false, isBuiltIn: true },
  { key: 'pdfs', name: 'PDFs', query: 'category:pdf', isPinned: false, isBuiltIn: true },
  { key: 'tweets', name: 'Tweets', query: 'category:tweet', isPinned: false, isBuiltIn: true },
  { key: 'videos', name: 'Videos', query: 'category:video', isPinned: false, isBuiltIn: true },
  { key: 'podcasts', name: 'Podcasts', query: 'category:podcast', isPinned: false, isBuiltIn: true },
  { key: 'shortlist', name: '⭐️ Shortlist', query: 'tag:shortlist AND (in:inbox OR in:later)', isPinned: true, isBuiltIn: true },
  { key: 'long_reads', name: '⏳ Long reads', query: 'minutes__gt:30 AND (in:inbox OR in:later)', isPinned: false, isBuiltIn: true },
  { key: 'new_in_feed', name: '✨ New in Feed', query: 'feed:true', isPinned: false, isBuiltIn: true },
  { key: 'quick_reads', name: '⏱ Quick reads', query: 'minutes__lt:10 AND (in:inbox OR in:later)', isPinned: false, isBuiltIn: true },
  { key: 'recently_added', name: '📥 Recently added', query: 'saved__gt:"1 week ago" AND (in:inbox OR in:later)', isPinned: false, isBuiltIn: true },
  { key: 'continue_reading', name: '📖 Continue reading', query: 'progress__gt:5 AND last_opened__after:"1 week ago" AND (in:inbox OR in:later)', isPinned: false, isBuiltIn: true },
  { key: 'recently_highlighted', name: '💎 Recently highlighted', query: 'has:highlights AND last_opened__gt:"1 week ago"', isPinned: false, isBuiltIn: true },
];

export const BUILTIN_GHOSTREADER_PROMPTS = [
  {
    promptType: 'AUTOMATIC',
    actionKey: 'SUMMARIZE_DOCUMENT',
    title: '🤏 Summarize the document',
    emoji: '🤏',
    description: 'Applies to newly saved documents automatically — writes 3 dense sentences.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are a helpful reading assistant.',
    template: `{#- BACKGROUND: This prompt instructs Ghostreader to summarize the document into three information-dense sentences. -#}
Write three easy-to-read sentences summarizing the following text:

===
Title: {{ document.title }}
Author: {{ document.author }}
Domain: {{ document.domain }}
{% if (document.content | num_tokens) > 2500 %}
{{ document.content | central_sentences | join('\\n\\n') }}
{% else %}
{{ document.content }}
{% endif %}
===`,
  },
  {
    promptType: 'AUTOMATIC',
    actionKey: 'TAG_DOCUMENT',
    title: '🏷️ Tag the document',
    emoji: '🏷️',
    description: 'Automatically assigns relevant tags to newly saved documents.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are a taxonomic classification assistant.',
    template: `Select up to 3 relevant tags for "{{ document.title }}" by {{ document.author }} from: {{ user.tags | join(', ') }}.`,
  },
  {
    promptType: 'WORD_PHRASE',
    actionKey: 'DEFINE_TERM',
    title: '📖 Dictionary definition',
    emoji: '📖',
    description: 'Define a word or phrase in context of the surrounding paragraph.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are a concise lexicographer.',
    template: `Provide the dictionary definition of "{{ selection.text }}" as used in the following context:\n\n"{{ selection.context }}"`,
  },
  {
    promptType: 'WORD_PHRASE',
    actionKey: 'ENCYCLOPEDIA_LOOKUP',
    title: '📚 Encyclopedia lookup',
    emoji: '📚',
    description: 'Look up people, places, concepts, or historical events.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are an encyclopedia assistant.',
    template: `Write a concise 2-3 sentence encyclopedia entry explaining "{{ selection.text }}" as referenced in "{{ document.title }}".`,
  },
  {
    promptType: 'WORD_PHRASE',
    actionKey: 'INTERNAL_XRAY',
    title: '🩻 Internal x-ray',
    emoji: '🩻',
    description: 'Identify who or what a character/term is using earlier mentions in this document.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are an expert literary assistant.',
    template: `Based on earlier mentions in "{{ document.title }}", explain who or what "{{ selection.text }}" is without spoiling later sections:\n\n{{ document.content | lexical_search(selection.text) }}`,
  },
  {
    promptType: 'SELECTION',
    actionKey: 'SIMPLIFY_SELECTION',
    title: '💡 Simplify',
    emoji: '💡',
    description: 'Rewrite a dense passage in plain, accessible language.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are a clear science and humanities communicator.',
    template: `Explain the following passage in simple, plain English:\n\n"{{ selection.text }}"`,
  },
  {
    promptType: 'SELECTION',
    actionKey: 'TRANSLATE_SELECTION',
    title: '🌐 Translate',
    emoji: '🌐',
    description: 'Translate the selected passage into English (or Spanish/Chinese/French).',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are an accurate literary translator.',
    template: `Translate the following passage into clear English:\n\n"{{ selection.text }}"`,
  },
  {
    promptType: 'SELECTION',
    actionKey: 'HAIKU_SELECTION',
    title: '🤔 Haiku',
    emoji: '🤔',
    description: 'Distill the passage into a 5-7-5 haiku.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are a poet.',
    template: `Write a 5-7-5 haiku capturing the essence of:\n\n"{{ selection.text }}"`,
  },
  {
    promptType: 'SELECTION',
    actionKey: 'FLASHCARDS_SELECTION',
    title: '🃏 Make flashcards',
    emoji: '🃏',
    description: 'Generate active-recall Q&A flashcards from the selected passage.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are a spaced-repetition learning expert.',
    template: `Create 2-3 Question & Answer flashcards testing the key concepts in:\n\n"{{ selection.text }}"`,
  },
  {
    promptType: 'DOCUMENT',
    actionKey: 'ASK_DOCUMENT',
    title: '❓ Ask the document a question',
    emoji: '❓',
    description: 'Ask any question grounded in the full text of this document.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are a helpful reading assistant. Answer using the provided document text.',
    template: `Answer the user's question based on "{{ document.title }}" by {{ document.author }}:\n\n{{ document.content | central_sentences }}`,
  },
  {
    promptType: 'DOCUMENT',
    actionKey: 'KEY_TAKEAWAYS',
    title: '🔑 Key takeaways',
    emoji: '🔑',
    description: 'Extract the 5 most important bullet-point takeaways from the document.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are an executive synthesis assistant.',
    template: `List the top 5 key takeaways from "{{ document.title }}" by {{ document.author }} as concise bullet points.`,
  },
  {
    promptType: 'DOCUMENT',
    actionKey: 'THOUGHT_PROVOKING_QUESTIONS',
    title: '🤔 Thought-provoking questions',
    emoji: '🤔',
    description: 'Generate Socratic questions to deepen comprehension.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are a Socratic tutor.',
    template: `Generate 3 thought-provoking questions that challenge the assumptions or explore the implications of "{{ document.title }}".`,
  },
  {
    promptType: 'DOCUMENT',
    actionKey: 'DOCUMENT_FLASHCARDS',
    title: '🃏 Make flashcards',
    emoji: '🃏',
    description: 'Generate spaced-repetition Q&A cards covering the whole document.',
    model: 'GPT_6_LUNA',
    systemPrompt: 'You are a spaced-repetition learning expert.',
    template: `Create 4 high-leverage Q&A flashcards covering the core arguments of "{{ document.title }}".`,
  },
];

export const BUILTIN_INTEGRATIONS = [
  { provider: 'instapaper', name: 'Instapaper', category: 'read_later' },
  { provider: 'pocket', name: 'Pocket', category: 'read_later' },
  { provider: 'matter', name: 'Matter', category: 'read_later' },
  { provider: 'raindrop', name: 'Raindrop.io', category: 'read_later' },
  { provider: 'goodreads', name: 'Goodreads', category: 'books' },
  { provider: 'feedly', name: 'Feedly', category: 'rss' },
  { provider: 'feedbin', name: 'Feedbin', category: 'rss' },
  { provider: 'freshrss', name: 'FreshRSS', category: 'rss' },
  { provider: 'inoreader', name: 'Inoreader', category: 'rss' },
];

export const SUGGESTED_FEEDS = [
  {
    title: 'Readwise Wisereads',
    url: 'https://blog.readwise.io/rss/',
    siteUrl: 'https://blog.readwise.io',
    faviconUrl: 'https://blog.readwise.io/favicon.png',
    description: 'Weekly curation of the most highlighted articles, books, and podcasts across Readwise.',
    folder: 'Curation',
    subscriberCount: 48200,
  },
  {
    title: 'Paul Graham: Essays',
    url: 'http://www.aaronsw.com/2002/feeds/pgessays.rss',
    siteUrl: 'https://paulgraham.com',
    faviconUrl: 'https://s.turbifycdn.com/aah/paulgraham/essays-1.gif',
    description: 'Essays on startups, programming, ambitious projects, and clear thinking.',
    folder: 'Essays',
    subscriberCount: 39400,
  },
  {
    title: 'Stratechery by Ben Thompson',
    url: 'https://stratechery.com/feed/',
    siteUrl: 'https://stratechery.com',
    faviconUrl: 'https://stratechery.com/favicon.ico',
    description: 'Analysis of the strategy and business side of technology and media.',
    folder: 'Tech Strategy',
    subscriberCount: 31500,
  },
  {
    title: 'Simon Willison’s Weblog',
    url: 'https://simonwillison.net/atom/everything/',
    siteUrl: 'https://simonwillison.net',
    faviconUrl: 'https://simonwillison.net/favicon.ico',
    description: 'Deep dives into LLMs, SQLite, Datasette, and modern web engineering.',
    folder: 'AI & Engineering',
    subscriberCount: 27800,
  },
  {
    title: 'Gwern.net Newsletter',
    url: 'https://gwern.substack.com/feed',
    siteUrl: 'https://gwern.net',
    faviconUrl: 'https://gwern.net/static/img/logo/logo-smooth.svg',
    description: 'Longform research on AI scaling, psychology, statistics, and design.',
    folder: 'Research',
    subscriberCount: 19300,
  },
];

const seedingPromises = new Map<string, Promise<void>>();

export async function ensureUserSeeded(prisma: PrismaClient, userId: string, email: string) {
  const activePromise = seedingPromises.get(userId);
  if (activePromise) {
    return activePromise;
  }
  const promise = runEnsureUserSeeded(prisma, userId, email).finally(() => {
    seedingPromises.delete(userId);
  });
  seedingPromises.set(userId, promise);
  return promise;
}

async function runEnsureUserSeeded(prisma: PrismaClient, userId: string, email: string) {
  const existingDocs = await prisma.document.count({ where: { userId } });
  if (existingDocs > 0) return;

  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10) || 'reader';

  await prisma.user.update({
    where: { id: userId },
    data: {
      customLibraryEmail: `${prefix}@library.readwise.io`,
      customFeedEmail: `${prefix}@feed.readwise.io`,
      settingsJson: JSON.stringify(DEFAULT_USER_SETTINGS),
    },
  });

  // 1. Seed Built-in Filtered Views
  for (const fv of BUILTIN_FILTERED_VIEWS) {
    await prisma.filteredView.upsert({
      where: { userId_key: { userId, key: fv.key } },
      update: {},
      create: {
        userId,
        key: fv.key,
        name: fv.name,
        query: fv.query,
        isPinned: fv.isPinned,
        isBuiltIn: fv.isBuiltIn,
      },
    });
  }

  // 2. Seed Built-in Ghostreader Prompts
  for (const gp of BUILTIN_GHOSTREADER_PROMPTS) {
    await prisma.ghostreaderPrompt.upsert({
      where: { userId_actionKey: { userId, actionKey: gp.actionKey } },
      update: {},
      create: {
        userId,
        promptType: gp.promptType,
        actionKey: gp.actionKey,
        title: gp.title,
        emoji: gp.emoji,
        description: gp.description,
        model: gp.model,
        systemPrompt: gp.systemPrompt,
        template: gp.template,
      },
    });
  }

  // 3. Seed Integrations
  for (const integ of BUILTIN_INTEGRATIONS) {
    await prisma.integrationConnection.upsert({
      where: { userId_provider: { userId, provider: integ.provider } },
      update: {},
      create: {
        userId,
        provider: integ.provider,
        name: integ.name,
        category: integ.category,
        connected: false,
      },
    });
  }

  // 4. Seed Tags
  const seedTags = [
    { name: 'shortlist', description: 'Priority reading shortlist', color: '#f59e0b' },
    { name: 'reverse-engineering', description: 'Architecture & system design notes', color: '#3b82f6' },
    { name: 'important-architecture', description: 'Core local-first & sync patterns', color: '#10b981' },
    { name: 'ai-agents', description: 'LLM prompt engineering & RAG', color: '#8b5cf6' },
  ];
  for (const t of seedTags) {
    await prisma.tag.upsert({
      where: { userId_name: { userId, name: t.name } },
      update: {},
      create: { userId, ...t },
    });
  }

  // 5. Seed RSS Feeds
  for (const feed of SUGGESTED_FEEDS.slice(0, 2)) {
    await prisma.rssFeed.upsert({
      where: { userId_url: { userId, url: feed.url } },
      update: {},
      create: {
        userId,
        title: feed.title,
        url: feed.url,
        siteUrl: feed.siteUrl,
        faviconUrl: feed.faviconUrl,
        description: feed.description,
        folder: feed.folder,
        subscriberCount: feed.subscriberCount,
        lastFetchedAt: new Date(),
      },
    });
  }

  // 6. Seed Multi-Format Documents
  const now = Date.now();
  const doc1 = await prisma.document.create({
    data: {
      id: `doc-getting-started-${userId.slice(0, 6)}`,
      userId,
      url: 'https://blog.readwise.io/getting-started-with-reader/',
      title: 'Getting Started with Reader',
      author: 'Erin & Daniel Doyon',
      source: 'readwise onboarding',
      siteName: 'Readwise Blog',
      domain: 'blog.readwise.io',
      faviconUrl: 'https://readwise.io/favicon.ico',
      imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
      category: 'article',
      triageStatus: 'new',
      isShortlisted: true,
      wordCount: 1152,
      readingMinutes: 5,
      readingProgress: 35,
      tagsJson: JSON.stringify(['shortlist', 'reverse-engineering']),
      documentNote: 'Key reference document explaining Reader’s 3-pane layout, keyboard-centric triage, and Ghostreader AI.',
      summary: 'Welcome to Reader! To get the most out of Reader, we strongly recommend adopting a keyboard-driven triage workflow and using highlights and margin notes as you read.',
      generatedSummary: 'Readwise Reader unifies web articles, RSS feeds, email newsletters, PDFs, EPUBs, and YouTube videos into a single local-first reading workspace. Users can navigate and highlight entirely by keyboard (j/k, h, n, t, e, l) and invoke Ghostreader AI for instant definitions, summaries, and Q&A. Every annotation automatically syncs to your Notebook for seamless Markdown export.',
      publishedDate: new Date(now - 86400000 * 5),
      savedAt: new Date(now - 3600000 * 12),
      lastOpenedAt: new Date(now - 3600000 * 1),
      ttsJson: JSON.stringify({
        voice: 'Amy (Neural)',
        words: [
          { start: 0.0, end: 0.4, word: 'Welcome' },
          { start: 0.4, end: 0.6, word: 'to' },
          { start: 0.6, end: 1.1, word: 'Readwise' },
          { start: 1.1, end: 1.6, word: 'Reader!' },
        ],
      }),
      htmlContent: `
        <h2 id="section-1">1. Why We Built Readwise Reader</h2>
        <p data-paragraph-index="0">To get the most out of Reader, we recommend thinking of it not merely as a bookmarking locker, but as a unified, local-first reading studio designed for power readers and researchers.</p>
        <p data-paragraph-index="1">Traditional read-it-later apps were built over a decade ago for simple web pages. Today, our reading diet spans Substack newsletters, arXiv PDF papers, EPUB books, Twitter threads, and educational YouTube videos.</p>
        <h2 id="section-2">2. Keyboard-Centric Navigation & Triage</h2>
        <p data-paragraph-index="2">In Reader, you can navigate paragraphs using <code>j</code> and <code>k</code> (or the Down and Up arrow keys). Notice the subtle blue focus indicator in the left margin tracking your reading position.</p>
        <p data-paragraph-index="3">Press <code>h</code> at any time to highlight the focused paragraph, <code>n</code> to attach a margin note right alongside the text, or <code>t</code> to add a structured tag to your highlight.</p>
        <p data-paragraph-index="4">When you finish reading an article, press <code>e</code> to move it to your Archive, or <code>l</code> to defer it to Later. If you make a mistake, simply press <code>z</code> to undo your last action instantly via RFC 6902 JSON Patch reversal.</p>
        <h2 id="section-3">3. Ghostreader: Your AI Reading Copilot</h2>
        <p data-paragraph-index="5">Press <code>G</code> on any selected phrase or paragraph to invoke Ghostreader for in-context dictionary definitions, encyclopedia lookups, translations, or passage simplification.</p>
        <p data-paragraph-index="6">Press <code>Shift + G</code> to run document-level Jinja2 prompts—such as extracting key takeaways, generating Socratic discussion questions, or creating spaced-repetition flashcards.</p>
      `,
    },
  });

  // Create initial highlight & note on doc1
  await prisma.annotation.create({
    data: {
      userId,
      documentId: doc1.id,
      type: 'highlight',
      paragraphIndex: 2,
      selectedText: 'In Reader, you can navigate paragraphs using j and k (or the Down and Up arrow keys). Notice the subtle blue focus indicator in the left margin tracking your reading position.',
      note: 'Core UX insight: paragraph-level focus ring allows 100% keyboard highlighting without touching the mouse.',
      color: 'yellow',
      isFavorite: true,
      reviewCount: 2,
      intervalDays: 3,
      easeFactor: 2.6,
      flashcardQuestion: 'How does Readwise Reader enable 100% mouse-free paragraph highlighting and triage?',
      flashcardAnswer: 'By maintaining a paragraph-level focus cursor navigated with j/k and bound to single-key actions (h to highlight, n for margin note, t for tag, e to archive, z to undo).',
      clozeText: 'In Reader, you can navigate paragraphs using {{c1::j and k}} and press {{c2::h}} to highlight the focused paragraph.',
      tagsJson: JSON.stringify(['important-architecture']),
    },
  });

  // Document 2: FAQ in Archive
  await prisma.document.create({
    data: {
      id: `doc-faq-${userId.slice(0, 6)}`,
      userId,
      url: 'https://blog.readwise.io/reader-faq/',
      title: 'Reader: Frequently Asked Questions & Architecture Guide',
      author: 'Daniel Doyon',
      source: 'readwise onboarding',
      siteName: 'Readwise Blog',
      domain: 'blog.readwise.io',
      faviconUrl: 'https://readwise.io/favicon.ico',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      category: 'article',
      triageStatus: 'archive',
      wordCount: 4820,
      readingMinutes: 19,
      readingProgress: 100,
      tagsJson: JSON.stringify(['important-architecture']),
      summary: 'Pro Tip: Use Ghostreader on this doc 👻 Complete reference covering Filtered View queries, custom email ingestion, OPML feeds, PDF area highlights, and offline SQLite sync.',
      generatedSummary: 'This comprehensive FAQ details how Readwise Reader synchronizes state locally and across devices, how to construct boolean Filtered Views (e.g. category:article AND minutes__lt:10), and how to customize Ghostreader Jinja2 templates.',
      publishedDate: new Date(now - 86400000 * 14),
      savedAt: new Date(now - 86400000 * 3),
      lastOpenedAt: new Date(now - 86400000 * 1),
      htmlContent: `
        <h2 id="faq-1">How does Local-First Sync work?</h2>
        <p data-paragraph-index="0">Reader caches your entire library metadata and active document HTML locally so view transitions, sorting, and Filtered View queries execute in under 16 milliseconds.</p>
        <h2 id="faq-2">How do Filtered Views work?</h2>
        <p data-paragraph-index="1">Filtered Views use a powerful query language supporting predicates like <code>category:pdf</code>, <code>tag:shortlist</code>, <code>minutes__lt:10</code>, <code>has:highlights</code>, and boolean operators <code>AND</code>, <code>OR</code>, and <code>NOT</code>.</p>
        <h2 id="faq-3">Can I customize Ghostreader prompts?</h2>
        <p data-paragraph-index="2">Yes! Under Ghostreader Preferences, every prompt is powered by a Jinja2 template with access to <code>{{ document.title }}</code>, <code>{{ document.content | central_sentences }}</code>, and <code>{{ selection.text }}</code>.</p>
      `,
    },
  });

  // Document 3: YouTube Video with Synchronized Interactive Transcript
  await prisma.document.create({
    data: {
      id: `doc-youtube-${userId.slice(0, 6)}`,
      userId,
      url: 'https://www.youtube.com/watch?v=eJBtvfbcic0',
      title: 'Readwise Reader — Official Product Walkthrough & Power User Guide',
      author: 'Readwise',
      source: 'youtube',
      siteName: 'YouTube',
      domain: 'youtube.com',
      faviconUrl: 'https://www.youtube.com/favicon.ico',
      imageUrl: 'https://img.youtube.com/vi/eJBtvfbcic0/maxresdefault.jpg',
      category: 'video',
      triageStatus: 'new',
      wordCount: 1850,
      readingMinutes: 8,
      readingProgress: 20,
      tagsJson: JSON.stringify(['ai-agents']),
      summary: 'Watch and read along with the synchronized interactive transcript of the official Readwise Reader walkthrough.',
      generatedSummary: 'The walkthrough demonstrates how to triage your reading queue, watch YouTube videos alongside a clickable time-synced transcript, highlight transcript segments directly into your Notebook, and query your library with Ghostreader.',
      publishedDate: new Date(now - 86400000 * 30),
      savedAt: new Date(now - 3600000 * 6),
      lastOpenedAt: new Date(now - 3600000 * 2),
      sourceSpecificJson: JSON.stringify({
        youtubeVideoId: 'eJBtvfbcic0',
        durationSeconds: 360,
      }),
      transcriptJson: JSON.stringify([
        { start: 0, duration: 12, text: 'Welcome to Readwise Reader — the first read-it-later app built from the ground up for power readers.' },
        { start: 12, duration: 15, text: 'When you save a YouTube video to Reader, we automatically fetch the transcript and synchronize it with the video player above.' },
        { start: 27, duration: 18, text: 'You can click any sentence in this transcript to jump the video directly to that exact timestamp, or enable Auto-scroll to follow along.' },
        { start: 45, duration: 16, text: 'Even better, you can highlight any transcript paragraph using the H key or your mouse, and your timestamped quote is saved right into your Notebook.' },
        { start: 61, duration: 20, text: 'Press Shift+G at any point while watching a video to ask Ghostreader questions about the speaker’s core arguments or extract key takeaways.' },
        { start: 81, duration: 19, text: 'Use the playback speed selector in the video bar to switch between 1x, 1.25x, 1.5x, and 2x speeds while reading at your own pace.' },
      ]),
      htmlContent: `<p data-paragraph-index="0">Interactive YouTube Video Transcript loaded.</p>`,
    },
  });

  // Document 4: PDF Paper with Canvas + Area Snapshot + Enhanced Text Mode
  await prisma.document.create({
    data: {
      id: `doc-pdf-${userId.slice(0, 6)}`,
      userId,
      url: 'https://arxiv.org/pdf/1706.03762.pdf',
      title: 'Attention Is All You Need: Transformer Architecture & Self-Attention',
      author: 'Ashish Vaswani et al.',
      source: 'upload',
      siteName: 'arXiv.org',
      domain: 'arxiv.org',
      faviconUrl: 'https://arxiv.org/favicon.ico',
      imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
      category: 'pdf',
      triageStatus: 'new',
      wordCount: 6400,
      readingMinutes: 25,
      readingProgress: 45,
      tagsJson: JSON.stringify(['ai-agents', 'important-architecture']),
      summary: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
      generatedSummary: 'Vaswani et al. introduce the Transformer architecture, replacing recurrence and convolutions entirely with multi-head self-attention. This enables significantly greater parallelization during training and achieves state-of-the-art translation quality.',
      publishedDate: new Date('2017-06-12T00:00:00Z'),
      savedAt: new Date(now - 3600000 * 5),
      lastOpenedAt: new Date(now - 3600000 * 1),
      sourceSpecificJson: JSON.stringify({
        pdfPageCount: 3,
        pages: [
          {
            pageNumber: 1,
            title: 'Page 1 — Abstract & Introduction',
            heading: 'Attention Is All You Need',
            authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin',
            paragraphs: [
              'Abstract: The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
              '1. Introduction: Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation.',
              'Attention mechanisms have become an integral part of compelling sequence modeling and transduction models in various tasks, allowing modeling of dependencies without regard to their distance in the input or output sequences.',
            ],
            diagramCaption: 'Figure 1: Scaled Dot-Product Attention & Multi-Head Attention Architecture: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V',
          },
          {
            pageNumber: 2,
            title: 'Page 2 — Model Architecture & Scaled Dot-Product Attention',
            heading: '3. Model Architecture',
            authors: 'Section 3.1 Encoder and Decoder Stacks — Section 3.2 Attention',
            paragraphs: [
              '3.1 Encoder and Decoder Stacks: The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network.',
              '3.2.1 Scaled Dot-Product Attention: We call our particular attention "Scaled Dot-Product Attention". The input consists of queries and keys of dimension d_k, and values of dimension d_v. We compute the dot products of the query with all keys, divide each by sqrt(d_k), and apply a softmax function to obtain the weights on the values.',
            ],
            diagramCaption: 'Equation (1): Attention(Q, K, V) = softmax((Q K^T) / √d_k) V',
          },
          {
            pageNumber: 3,
            title: 'Page 3 — Multi-Head Attention & Positional Encoding',
            heading: '3.2.2 Multi-Head Attention & 3.5 Positional Encoding',
            authors: 'Transformer Complexity Comparison Table',
            paragraphs: [
              'Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this.',
              '3.5 Positional Encoding: Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence.',
            ],
            diagramCaption: 'Table 1: Maximum path lengths, per-layer complexity and minimum number of sequential operations for Self-Attention O(1) vs Recurrent O(n).',
          },
        ],
      }),
      htmlContent: `
        <h2 id="pdf-sec-1">Abstract</h2>
        <p data-paragraph-index="0">The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.</p>
        <h2 id="pdf-sec-2">1. Introduction</h2>
        <p data-paragraph-index="1">Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems.</p>
        <h2 id="pdf-sec-3">3.2 Scaled Dot-Product Attention</h2>
        <p data-paragraph-index="2">We compute the dot products of the query with all keys, divide each by sqrt(d_k), and apply a softmax function to obtain the weights on the values: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V.</p>
        <h2 id="pdf-sec-4">3.5 Positional Encoding</h2>
        <p data-paragraph-index="3">Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we inject sinusoidal positional encodings of the same dimension d_model as the embeddings.</p>
      `,
    },
  });

  // Document 5: EPUB Book with Multiple Chapters
  await prisma.document.create({
    data: {
      id: `doc-epub-${userId.slice(0, 6)}`,
      userId,
      url: 'epub://local-first-software-engineering.epub',
      title: 'The Art of Local-First Software Engineering',
      author: 'Martin Kleppmann & Ink & Switch',
      source: 'upload',
      siteName: 'EPUB Library',
      domain: 'inkandswitch.com',
      faviconUrl: 'https://www.inkandswitch.com/favicon.ico',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      category: 'epub',
      triageStatus: 'new',
      wordCount: 14200,
      readingMinutes: 55,
      readingProgress: 18,
      tagsJson: JSON.stringify(['reverse-engineering', 'important-architecture']),
      summary: 'A comprehensive treatise on designing cloud software that runs locally on the client using CRDTs, SQLite WASM, and event-sourced JSON Patch synchronization.',
      generatedSummary: 'This book explores the seven ideals of local-first software: zero-spinner instant interactions, multi-device sync, offline capability, collaboration, longevity, privacy, and full user control over data.',
      publishedDate: new Date('2025-02-01T00:00:00Z'),
      savedAt: new Date(now - 3600000 * 4),
      lastOpenedAt: new Date(now - 3600000 * 2),
      sourceSpecificJson: JSON.stringify({
        chapters: [
          { id: 'ch-1', title: 'Chapter 1: The Seven Ideals of Local-First Software' },
          { id: 'ch-2', title: 'Chapter 2: In-Browser SQLite & IndexedDB Storage Engines' },
          { id: 'ch-3', title: 'Chapter 3: Event-Sourced RFC 6902 JSON Patch Sync' },
        ],
      }),
      htmlContent: `
        <h2 id="ch-1">Chapter 1: The Seven Ideals of Local-First Software</h2>
        <p data-paragraph-index="0">In local-first software, the primary copy of your data lives on your own device in a fast embedded database. The cloud server acts as a durable encrypted backup and delta synchronization relay rather than a bottleneck on every click.</p>
        <p data-paragraph-index="1">When you press J or K to move between items, or H to highlight a sentence, the UI updates in under a single 60Hz frame because no network round-trip stands between your keystroke and the local state store.</p>
        <h2 id="ch-2">Chapter 2: In-Browser SQLite & IndexedDB Storage Engines</h2>
        <p data-paragraph-index="2">By compiling SQLite to WebAssembly (sql-wasm.wasm) and persisting pages in IndexedDB chunks, modern web apps can evaluate arbitrary boolean query DSLs over tens of thousands of documents right in the browser tab.</p>
        <h2 id="ch-3">Chapter 3: Event-Sourced RFC 6902 JSON Patch Sync</h2>
        <p data-paragraph-index="3">Every user mutation emits a pair of patches: a <code>forwardPatch</code> that advances the state, and a <code>reversePatch</code> that restores the previous value. Pressing Z applies the reverse patch immediately for effortless Undo.</p>
      `,
    },
  });

  // Document 6: Email Newsletter in Later
  await prisma.document.create({
    data: {
      id: `doc-email-${userId.slice(0, 6)}`,
      userId,
      url: 'mailto:wisereads-142@library.readwise.io',
      title: 'Wisereads Weekly Issue #142: How Great Thinkers Read and Synthesize',
      author: 'Readwise Wisereads',
      source: 'email',
      siteName: 'Newsletter',
      domain: 'library.readwise.io',
      faviconUrl: 'https://readwise.io/favicon.ico',
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
      category: 'email',
      triageStatus: 'later',
      wordCount: 1620,
      readingMinutes: 7,
      readingProgress: 0,
      tagsJson: JSON.stringify(['shortlist']),
      summary: 'Forwarded to your custom @library.readwise.io address: This week’s most highlighted essays on active reading, Feynman notebooks, and spaced repetition.',
      generatedSummary: 'Wisereads #142 curates the top three essays highlighted by Reader users this week, focusing on Mortimer Adler’s syntopical reading framework and Richard Feynman’s "Notebook of Things I Don’t Know About".',
      publishedDate: new Date(now - 86400000 * 2),
      savedAt: new Date(now - 86400000 * 2),
      htmlContent: `
        <h2 id="email-1">1. Syntopical Reading in the Age of AI</h2>
        <p data-paragraph-index="0">Mortimer Adler distinguished four levels of reading: Elementary, Inspectional, Analytical, and Syntopical—reading multiple works on the same subject side-by-side in Split View to construct an independent synthesis.</p>
        <h2 id="email-2">2. Feynman’s Twelve Favorite Problems</h2>
        <p data-paragraph-index="1">Keep a dozen of your favorite open problems constantly present in your mind. Every time you read a new paper or article, test whether any new result unlocks progress on one of your twelve problems.</p>
      `,
    },
  });

  // Document 7: Twitter Thread in Later
  await prisma.document.create({
    data: {
      id: `doc-tweet-${userId.slice(0, 6)}`,
      userId,
      url: 'https://x.com/readwise/status/1845001928374',
      title: 'Thread: 7 Design Principles Behind Readwise Reader’s Keyboard-First UI',
      author: '@readwise',
      source: 'twitter',
      siteName: 'X (Twitter)',
      domain: 'x.com',
      faviconUrl: 'https://abs.twimg.com/favicons/twitter.3.ico',
      category: 'tweet',
      triageStatus: 'later',
      wordCount: 420,
      readingMinutes: 2,
      readingProgress: 0,
      tagsJson: JSON.stringify(['reverse-engineering']),
      summary: '1/7 When we started designing Readwise Reader, we asked: what if a reading app had the speed and command-palette ergonomics of Superhuman and Linear?',
      generatedSummary: 'This thread breaks down Reader’s UI architecture: 100% keyboard reachability, collapsible sidebars ([ and ]), non-destructive JSON Patch undo (z), and inline margin annotations.',
      publishedDate: new Date(now - 86400000 * 4),
      savedAt: new Date(now - 86400000 * 2),
      htmlContent: `
        <h2 id="tweet-1">1/7 Superhuman-Speed Reading</h2>
        <p data-paragraph-index="0">1/7 When we started designing Readwise Reader, we asked: what if a reading app had the speed and command-palette ergonomics of Superhuman and Linear?</p>
        <p data-paragraph-index="1">2/7 Every action in Reader is bound to a single mnemonic key: E to Archive, L for Later, S for Shortlist, H to Highlight, N for Note, T for Tag, and Cmd+K for the global Command Palette.</p>
        <p data-paragraph-index="2">3/7 Collapsible sidebars ([ and ]) let you inspect rich metadata, Notebook highlights, or Ghostreader AI on the right, or press \\ to enter distraction-free Zen Focus Mode.</p>
      `,
    },
  });

  // Document 8: Podcast Episode
  await prisma.document.create({
    data: {
      id: `doc-podcast-${userId.slice(0, 6)}`,
      userId,
      url: 'https://lexfridman.com/ai-reading-assistants',
      title: 'Podcast #412: Designing AI Copilots for Deep Human Reading & Thought',
      author: 'Lex Fridman & Tristan Harris',
      source: 'podcast',
      siteName: 'Lex Fridman Podcast',
      domain: 'lexfridman.com',
      faviconUrl: 'https://lexfridman.com/favicon.ico',
      category: 'podcast',
      triageStatus: 'new',
      wordCount: 3100,
      readingMinutes: 12,
      readingProgress: 10,
      tagsJson: JSON.stringify(['ai-agents']),
      summary: 'Episode transcript and audio notes on how AI reading assistants should augment—rather than replace—deep human comprehension.',
      generatedSummary: 'The episode explores why AI summaries alone cannot replace deep reading, and how Socratic questioning, internal x-ray lookups, and active-recall flashcards deepen retention.',
      publishedDate: new Date(now - 86400000 * 6),
      savedAt: new Date(now - 3600000 * 8),
      htmlContent: `
        <h2 id="pod-1">Augmenting vs. Replacing Reading</h2>
        <p data-paragraph-index="0">If an AI summarizes a book so you never read it, you lose the mental muscle of following a complex argument. Instead, an AI reading copilot should act like a tutor sitting beside you while you read the primary text.</p>
        <p data-paragraph-index="1">When you encounter an unfamiliar concept or historical figure, invoking an in-context encyclopedia lookup keeps you in flow without tab-switching into distraction.</p>
      `,
    },
  });

  // Document 9 & 10: RSS Feed Items (Unseen and Seen)
  await prisma.document.create({
    data: {
      id: `doc-feed-unseen-${userId.slice(0, 6)}`,
      userId,
      url: 'https://simonwillison.net/2026/Oct/10/sqlite-wasm-local-first/',
      title: 'Why SQLite Compiled to WebAssembly Is Taking Over Local-First Web Apps',
      author: 'Simon Willison',
      source: 'Simon Willison’s Weblog',
      siteName: 'Simon Willison’s Weblog',
      domain: 'simonwillison.net',
      faviconUrl: 'https://simonwillison.net/favicon.ico',
      category: 'article',
      triageStatus: 'feed',
      inFeed: true,
      isSeen: false,
      wordCount: 1950,
      readingMinutes: 8,
      readingProgress: 0,
      tagsJson: JSON.stringify(['important-architecture']),
      summary: 'Running full SQLite inside the browser via WebAssembly and OPFS/IndexedDB allows complex relational and full-text queries with zero network latency.',
      generatedSummary: 'Simon Willison explains how modern web applications combine server-side delta sync endpoints with in-browser SQLite WASM to deliver instant search and offline resilience.',
      publishedDate: new Date(now - 3600000 * 18),
      savedAt: new Date(now - 3600000 * 18),
      htmlContent: `
        <h2 id="rss-1">Zero-Latency Queries in the Browser</h2>
        <p data-paragraph-index="0">Running full SQLite inside the browser via WebAssembly allows web applications to execute complex filtered views and full-text search queries in a few milliseconds.</p>
        <p data-paragraph-index="1">Combined with incremental timestamp polling and optimistic JSON Patch updates, users get desktop-class responsiveness inside a standard browser tab.</p>
      `,
    },
  });

  await prisma.document.create({
    data: {
      id: `doc-feed-seen-${userId.slice(0, 6)}`,
      userId,
      url: 'https://paulgraham.com/read.html',
      title: 'The Need to Read: Why Writing and Reading Are Inseparable',
      author: 'Paul Graham',
      source: 'Paul Graham: Essays',
      siteName: 'Paul Graham: Essays',
      domain: 'paulgraham.com',
      category: 'article',
      triageStatus: 'feed',
      inFeed: true,
      isSeen: true,
      wordCount: 1420,
      readingMinutes: 6,
      readingProgress: 100,
      tagsJson: JSON.stringify([]),
      summary: 'Reading isn’t just a way to acquire information; it is how you calibrate your standards for clear thinking.',
      generatedSummary: 'Paul Graham argues that good writing requires good thinking, and good thinking requires deep, active reading rather than skimming.',
      publishedDate: new Date(now - 86400000 * 10),
      savedAt: new Date(now - 86400000 * 5),
      htmlContent: `
        <h2 id="pg-1">Reading as Active Thinking</h2>
        <p data-paragraph-index="0">A good writer doesn't just think, and then write down what they thought; they think by writing—and they learn to think by reading deeply and critically.</p>
      `,
    } as any,
  });

  // 7. Seed a default Ghostreader Chat Thread
  await prisma.ghostreaderThread.create({
    data: {
      userId,
      title: 'Synthesizing Local-First Architecture & Reader Workflows',
      mode: 'ask_library',
      messagesJson: JSON.stringify([
        {
          id: 'msg-1',
          role: 'user',
          content: 'What are the main ideas across the articles in my library?',
          createdAt: new Date(now - 3600000).toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content:
            'Across your saved library, three core themes stand out:\n\n1. **Local-First & Zero-Latency Architecture**: In *The Art of Local-First Software Engineering* and Simon Willison’s essay, client-side SQLite (WASM) paired with RFC 6902 JSON Patch event sourcing enables sub-16ms UI transitions and instant Undo (`z`).\n2. **Keyboard-First Multi-Format Reading**: *Getting Started with Reader* and *Reader FAQ* show how web articles, PDFs, EPUBs, and time-synced YouTube transcripts share a unified annotation pipeline (`j`/`k` focus, `h` highlight, `n` margin note).\n3. **AI-Augmented Active Reading**: Both *Attention Is All You Need* and *Ghostreader* demonstrate how transformer attention and customizable Jinja2 templates can answer grounded questions without replacing deep reading.',
          citations: [
            { id: doc1.id, title: 'Getting Started with Reader', author: 'Erin & Daniel Doyon' },
            { id: `doc-epub-${userId.slice(0, 6)}`, title: 'The Art of Local-First Software Engineering', author: 'Martin Kleppmann' },
            { id: `doc-pdf-${userId.slice(0, 6)}`, title: 'Attention Is All You Need', author: 'Ashish Vaswani et al.' },
          ],
          createdAt: new Date(now - 3590000).toISOString(),
        },
      ]),
    },
  });

  // 8. Seed additional Readwise Spaced Repetition Highlights & Active Recall Flashcards
  await prisma.annotation.create({
    data: {
      userId,
      documentId: `doc-pdf-${userId.slice(0, 6)}`,
      type: 'highlight',
      paragraphIndex: 2,
      selectedText: 'We compute the dot products of the query with all keys, divide each by sqrt(d_k), and apply a softmax function to obtain the weights on the values: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V.',
      note: 'Why scale by 1/sqrt(d_k)? For large d_k, dot products grow large in magnitude, pushing softmax into regions with vanishingly small gradients.',
      color: 'blue',
      isFavorite: true,
      reviewCount: 4,
      intervalDays: 7,
      easeFactor: 2.7,
      flashcardQuestion: 'Why does Scaled Dot-Product Attention divide QK^T by sqrt(d_k) before applying softmax?',
      flashcardAnswer: 'To prevent large dot-product magnitudes at high dimensions d_k from pushing the softmax function into saturation regions with vanishing gradients.',
      clozeText: 'Scaled Dot-Product Attention computes {{c1::softmax(QK^T / sqrt(d_k))V}} to prevent {{c2::vanishing softmax gradients}} at high key dimensions.',
      tagsJson: JSON.stringify(['ai-agents', 'important-architecture']),
    },
  });

  await prisma.annotation.create({
    data: {
      userId,
      documentId: `doc-epub-${userId.slice(0, 6)}`,
      type: 'highlight',
      paragraphIndex: 0,
      selectedText: 'In local-first software, the primary copy of your data lives on your own device in a fast embedded database. The cloud server acts as a durable encrypted backup and delta synchronization relay rather than a bottleneck on every click.',
      note: '.h1 Core Definition of Local-First Architecture',
      color: 'green',
      isFavorite: true,
      reviewCount: 1,
      intervalDays: 1,
      easeFactor: 2.5,
      flashcardQuestion: 'What role does the cloud server play in a local-first software architecture?',
      flashcardAnswer: 'The primary data copy lives in an embedded client database (like SQLite WASM / IndexedDB), while the cloud acts as an asynchronous durable backup and delta sync relay.',
      clozeText: 'In local-first software, the primary copy of your data lives on {{c1::your own device in a fast embedded database}}, while the cloud acts as a {{c2::durable backup and delta sync relay}}.',
      tagsJson: JSON.stringify(['reverse-engineering', 'important-architecture']),
    },
  });

  await prisma.annotation.create({
    data: {
      userId,
      documentId: `doc-epub-${userId.slice(0, 6)}`,
      type: 'highlight',
      paragraphIndex: 3,
      selectedText: 'Every user mutation emits a pair of patches: a forwardPatch that advances the state, and a reversePatch that restores the previous value. Pressing Z applies the reverse patch immediately for effortless Undo.',
      note: 'RFC 6902 JSON Patch pairs enable deterministic client/server undo.',
      color: 'yellow',
      isFavorite: false,
      reviewCount: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      flashcardQuestion: 'How does Readwise Reader implement instant deterministic Undo (z) across all mutations?',
      flashcardAnswer: 'Every mutation event records both an RFC 6902 forwardPatch and reversePatch; pressing z applies the reversePatch to restore the prior state.',
      clozeText: 'Every user mutation emits a {{c1::forwardPatch}} and a {{c2::reversePatch}} under RFC 6902 JSON Patch.',
      tagsJson: JSON.stringify(['important-architecture']),
    },
  });
}

export const SUPPLEMENTAL_BOOKS_CATALOG = [
  {
    key: 'supp-atomic-habits',
    title: 'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
    author: 'James Clear',
    category: 'epub',
    source: 'supplemental',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    highlights: [
      {
        text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
        note: 'Goals are about the results you want to achieve; systems are about the processes that lead to those results.',
        question: 'According to James Clear, what determines your long-term progress more than your goals?',
        answer: 'Your systems — you do not rise to the level of your goals; you fall to the level of your systems.',
        cloze: 'You do not rise to the level of your {{c1::goals}}. You fall to the level of your {{c2::systems}}.',
      },
      {
        text: 'Every action you take is a vote for the type of person you wish to become. No single instance will transform your beliefs, but as the votes build up, so does the evidence of your new identity.',
        note: 'Identity-based habits vs. outcome-based habits.',
        question: 'How do small daily habits reshape your self-identity over time?',
        answer: 'Each action acts as a vote for the type of person you wish to become; accumulated votes build evidence of your new identity.',
        cloze: 'Every action you take is a {{c1::vote}} for the type of {{c2::person you wish to become}}.',
      },
    ],
  },
  {
    key: 'supp-ddia',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'epub',
    source: 'supplemental',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    highlights: [
      {
        text: 'Reliability means making systems work correctly, even when faults occur; scalability means having strategies for keeping performance good, even when load increases; maintainability means making life better for the engineering and operations teams who need to work with the system.',
        note: 'The three foundational pillars of data-intensive systems.',
        question: 'What are the three foundational concerns of data-intensive systems in DDIA?',
        answer: 'Reliability (working correctly despite faults), Scalability (maintaining performance under load), and Maintainability (operability and evolvability for engineers).',
        cloze: 'The three pillars of data-intensive systems are {{c1::Reliability}}, {{c2::Scalability}}, and {{c3::Maintainability}}.',
      },
      {
        text: 'An append-only log of immutable events is the simplest and most reliable storage abstraction: derived views, search indexes, and caches can all be deterministically rebuilt by replaying the log.',
        note: 'Event sourcing and change data capture (CDC).',
        question: 'Why is an append-only immutable event log advantageous for derived views and caches?',
        answer: 'Because any secondary index, materialized view, or cache can be deterministically reconstructed by replaying the immutable log.',
        cloze: 'An {{c1::append-only log of immutable events}} allows derived views and indexes to be {{c2::deterministically rebuilt}}.',
      },
    ],
  },
  {
    key: 'supp-thinking-fast-slow',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    category: 'epub',
    source: 'supplemental',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    highlights: [
      {
        text: 'System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control. System 2 allocates attention to the effortful mental activities that demand it, including complex computations.',
        note: 'Dual-process theory of human judgment and decision-making.',
        question: 'Contrast System 1 and System 2 thinking in Kahneman’s framework.',
        answer: 'System 1 is fast, automatic, and effortless intuition; System 2 is slow, deliberate, and effortful analytical reasoning.',
        cloze: '{{c1::System 1}} operates automatically and quickly, whereas {{c2::System 2}} allocates attention to effortful mental computations.',
      },
    ],
  },
  {
    key: 'supp-how-to-take-smart-notes',
    title: 'How to Take Smart Notes: One Simple Technique to Boost Writing, Learning and Thinking',
    author: 'Sönke Ahrens',
    category: 'epub',
    source: 'supplemental',
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
    highlights: [
      {
        text: 'Never read without a pen in your hand. Writing is not the outcome of thinking; writing is the medium in which thinking takes place.',
        note: 'Zettelkasten principle: translate what you read into your own words immediately.',
        question: 'Why does Sönke Ahrens argue that note-taking should happen continuously while reading?',
        answer: 'Because writing is not merely the record of finished thoughts — it is the medium in which rigorous thinking and synthesis actually occur.',
        cloze: 'Writing is not the outcome of thinking; {{c1::writing is the medium in which thinking takes place}}.',
      },
    ],
  },
];

