# Readwise Reader (`read.readwise.io`) — Reverse Engineering & UI/UX Architecture Specification

This document provides a complete functional, visual, and technical reverse-engineering specification of **Readwise Reader** (`https://read.readwise.io`), captured through live end-to-end Playwright automation, network traffic inspection, and DOM/storage analysis.

---

## 1. Product Overview & Core Philosophy

Readwise Reader is a **local-first, keyboard-centric "Read-It-Later + RSS + Multi-Format Annotation + AI Reading Assistant" workspace**. Unlike traditional bookmarking tools (Instapaper, Pocket), Reader unifies:
1. **Web Articles** (parsed clean HTML with inline annotations & TTS word-boundary sync)
2. **RSS Feeds & Newsletters** (custom `@library.readwise.io` and `@feed.readwise.io` email addresses + OPML/RSS ingestion)
3. **PDF Documents** (PDF.js canvas viewer + OCR/text reflow mode + rectangular area snapshot highlights)
4. **EPUB Books** (multi-chapter paginated/scrollable book reader with Table of Contents)
5. **YouTube Videos & Podcasts** (embedded video player with time-synced auto-scrolling interactive transcript that can be highlighted like text)
6. **Twitter/X Threads & Lists** (formatted thread reader)
7. **Ghostreader AI** (library-wide RAG chat + document/selection Jinja2 prompt engine)

---

## 2. Complete Route Map & URL Structure

### 2.1 Public & Authentication Routes (`readwise.io`)
| Route | Purpose | Screenshot Reference |
|---|---|---|
| `https://read.readwise.io/` (unauthenticated) | Redirects to `https://readwise.io/accounts/login/?next=https://read.readwise.io/` | `01-public-auth/01-login-page.png` |
| `https://readwise.io/accounts/login/` | Login with Google, Apple, Email/Password, or "Create your Readwise account" toggle | `01-public-auth/01-login-page.png`, `02-signup-options-card.png`, `03-signup-email-form.png`, `06-login-error-state.png` |
| `https://readwise.io/accounts/signup/?next=/to_reader` | Direct signup form protected by Cloudflare Turnstile (`0x4AAAAAAA...`) | `01-public-auth/04-direct-signup-page.png`, `02-onboarding/01-signup-form-turnstile-prompt.png` |
| `https://readwise.io/accounts/password/reset/` | Password reset request flow | `01-public-auth/05-password-reset-page.png` |
| `https://readwise.io/read` | Readwise Reader product landing page | `01-public-auth/07-reader-landing-hero.png`, `07-reader-landing-full.png` |
| `https://readwise.io/pricing` | Subscription tiers (Readwise Full vs Lite, Monthly/Annual) | `01-public-auth/08-pricing-page.png` |

### 2.2 Onboarding Wizard Routes (`read.readwise.io/welcome*`)
| Route | Step | Purpose | Screenshot Reference |
|---|---|---|---|
| `/welcome` | Step 1 | **Workflow Configuration**: Choose between *Inbox Workflow* (`Inbox -> Later -> Archive`), *Shortlist Workflow* (`Later -> Shortlist -> Archive`), or *Simple Workflow* (`Later -> Archive`), plus optional **Feed** enablement | `02-onboarding/04-welcome-step-1.png` |
| `/welcome/extension` | Step 2 | **Browser Extension Install**: Prompts to install the Chrome/Firefox/Safari extension | `02-onboarding/04-welcome-step-2.png` |
| `/welcome/mobile` | Step 3 | **Mobile App QR Code**: QR code for iOS App Store / Android Google Play download | `02-onboarding/04-welcome-step-3.png` |
| `/welcome/ready` | Step 4 | **Completion**: Initializes sample onboarding articles and transitions to `/new` | `02-onboarding/04-welcome-step-4.png` |

### 2.3 Core Workspace & Navigation Routes (`read.readwise.io`)
| Route | Section | Purpose | Screenshot Reference |
|---|---|---|---|
| `/home` | Home | Customizable dashboard with horizontal carousels (*Continue reading*, *Recently added*, *Shortlist*, *Quick reads*, *New in Feed*, *Long reads*, *Recently highlighted*) | `03-core-views/01-home-top.png`, `02-home-scrolled.png`, `26-home-configure-menu.png` |
| `/ghostreader` | Ghostreader AI | Full-screen conversational AI assistant across the entire library (`Ask your library` / `Recommend from library`), categorized starter prompts, and conversation history drawer | `03-core-views/03-ghostreader-chat.png`, `28-ghostreader-mode-selector.png`, `29-ghostreader-recommend-prompts.png`, `30-ghostreader-history-drawer.png`, `31-ghostreader-active-chat.png` |
| `/new` | Library — Inbox | Default triage inbox for newly saved documents | `03-core-views/04-library-inbox-info-tab.png`, `04b-library-inbox-multiformat.png` |
| `/later` | Library — Later | Documents triaged for later reading (`l` shortcut) | `03-core-views/08-library-later.png` |
| `/archive` | Library — Archive | Completed/archived documents (`e` shortcut) | `03-core-views/09-library-archive.png` |
| `/filtered?id=<view_id>` | Filtered Views | Built-in or user-created query-based views: `articles`, `epubs` (Books), `emails`, `pdfs`, `tweets`, `videos`, `podcasts`, `shortlist` | `03-core-views/10-category-articles.png` through `16-category-podcasts.png`, `21-shortlist-view.png` |
| `/tags` | Manage Tags | Table of all document/highlight tags with item counts, creation dates, rename/edit, and delete actions | `03-core-views/17-tags-view.png` |
| `/feed` | Feed — Unseen | Unseen RSS and newsletter items | `03-core-views/18-feed-unseen.png` |
| `/feed/seen` | Feed — Seen | Previously viewed RSS and newsletter items | `03-core-views/19-feed-seen.png` |
| `/feed/sources` | Manage Feeds | Subscribed RSS feeds table + Add Feed / Upload OPML / Export OPML | `03-core-views/20-manage-feeds.png` |
| `/feed/suggestions` | Suggested Feeds | Curated/discovered high-signal feeds based on user library | `03-core-views/27-manage-feeds-suggested.png` |
| `/views` | Manage Views | Table of all saved Filtered Views (`query` DSL, pinned status, item counts) | `03-core-views/22-manage-views.png` |
| `/trash` | Trash | Soft-deleted documents (`Empty trash` action) | `03-core-views/23-trash-view.png` |
| `/search` | Full-Text Search | Client-side + server-assisted instant full-text search across titles, authors, body content, and highlights | `03-core-views/24-search-empty.png`, `25-search-results.png` |
| `/new/read/<doc_id>` | Document Reader | 3-pane multi-format reader view; supports `?split=<doc_id_2>` for dual-pane Split View | `04-reader-detail/01-reader-article-3pane.png`, `05-settings-modals-shortcuts/26-reader-split-view-dual-pane.png` |

### 2.4 Settings & Preferences Routes
| Route | Purpose | Screenshot Reference |
|---|---|---|
| `/profile` | User details (First/Last name, Username, Email, Password), Subscription management, and Account Data Export (`Export Library as CSV`, `Export PDFs`, `Export EPUBs`, `Export Feeds as OPML`) | `05-settings-modals-shortcuts/01-profile-settings.png` |
| `/preferences` | Interface theme (`Light`, `Dark`, `System`), Library workflow configuration, Auto-advancing behavior, Up Next behavior, Twitter sync settings, Offline caching toggles | `05-settings-modals-shortcuts/02-preferences-general.png`, `03-preferences-library-workflow-modal.png` |
| `/preferences/shortcuts` | Full interactive keyboard shortcut remapping editor (`Reset all to default`) | `05-settings-modals-shortcuts/04-preferences-keyboard-shortcuts.png`, `04b-preferences-keyboard-shortcuts-scrolled.png` |
| `/integrations` | Third-party importers & sync connections (`Instapaper`, `Pocket`, `Matter`, `Raindrop.io`, `Goodreads`, `Feedly`, `Feedbin`, `FreshRSS`, `Inoreader`) | `05-settings-modals-shortcuts/05-integrations-page.png`, `05b-integrations-scrolled.png` |
| `/ghostreader/preferences` | Enable Ghostreader, custom OpenAI API key, and Jinja2 prompt template manager (`Automatic`, `Word/Phrase`, `Selection`, `Document` prompts) | `05-settings-modals-shortcuts/06-ghostreader-preferences.png`, `27-custom-ghostreader-prompt-modal.png` |
| `/product-emails` | `Wisereads` weekly newsletter, `Daily Digest` frequency/time configuration, `Feedback Emails` | `05-settings-modals-shortcuts/07-product-emails-settings.png` |
| `/add-to-library` | Custom `@library.readwise.io` email address, browser extensions, mobile apps, file uploads | `05-settings-modals-shortcuts/08-add-to-library-page.png` |
| `/add-to-feed` | Custom `@feed.readwise.io` email address, RSS subscription tools, OPML import | `05-settings-modals-shortcuts/09-add-to-feed-page.png` |
| `/resources` | Links toBrowser Extensions, Mobile Apps, Community Discord, Walkthrough Videos, FAQ | `05-settings-modals-shortcuts/10-resources-page.png` |

---

## 3. UI Layout & 3-Pane Workspace Architecture

Readwise Reader uses a responsive **3-pane collapsible layout** orchestrated by `.appContent` with dynamic modifier classes (`_leftSidebarHidden`, `_rightSidebarHidden`):

```
+-----------------------------------------------------------------------------------+
| Left Navigation Sidebar   | Center Workspace Canvas      | Right Inspector Panel   |
| (240px, toggle: `[`)      | (Flex 1, min-width ~600px)   | (340px, toggle: `]`)    |
|---------------------------|------------------------------|-------------------------|
| - Brand Logo & Collapse   | List / Feed / Grid Header:   | Tabs:                   |
| - [+ Add] Dropdown Button |  - View Switcher & Options   |  1. Info (Metadata)     |
| - Home (/home)            |  - Location Tabs (Inbox/     |  2. Notebook (Notes &   |
| - Ghostreader (/ghost...) |    Later/Archive or Unseen/  |     Highlights + Export)|
| - Library (/new)          |    Seen)                     |  3. Chat (Ghostreader   |
|   - Articles              |  - Sort Dropdown             |     Doc Assistant)      |
|   - Books                 |------------------------------|-------------------------|
|   - Emails                | Document List OR             | Context-Sensitive Body: |
|   - PDFs                  | Active Document Reader       |  - Summary & Edit Meta  |
|   - Tweets                | (Article / PDF / EPUB /      |  - Tags & Stats         |
|   - Videos                |  YouTube Video + Transcript) |  - Highlights list      |
|   - Podcasts              |  + Left Margin Table of      |  - Document Note input  |
|   - Tags                  |    Contents (in Reader)      |  - Bottom Help (?) menu |
| - Feed (/feed)            |                              |                         |
|   - Manage feeds          |                              |                         |
| - Pinned Views            |                              |                         |
|   - ⭐️ Shortlist          |                              |                         |
|   - Manage views          |                              |                         |
| - Trash (/trash)          |                              |                         |
| - Search (/search)        |                              |                         |
| - Preferences & Profile   |                              |                         |
+-----------------------------------------------------------------------------------+
```

### Key UX Interaction Patterns
1. **Always-Active Keyboard Focus Ring**: In both document lists and inside the document reader, a subtle blue vertical indicator marks the currently focused row or paragraph. Users navigate rows/paragraphs with `j` / `k` (or `ArrowDown` / `ArrowUp`).
2. **Auto-Hiding Hover Sidebars**: Pressing `[` or `]` unpins the left or right sidebar. When unpinned, moving the mouse to the far left or far right edge slides the panel out as a floating overlay without shifting the reading column. Pressing `\` enters **Zen Focus Mode**, hiding all chrome except the reading text (`04-reader-detail/13-reader-zen-focus-mode.png`).
3. **Three List Display Layouts**: Every list view (`/new`, `/later`, `/archive`, `/feed`, `/filtered`) can switch between:
   - **List View**: High-density rows with favicon, title, snippet, source, author, date, reading time, and hover triage icons (`03-core-views/04b-library-inbox-multiformat.png`).
   - **Feed View**: Centered wide cards showing larger thumbnails and multi-line previews (`05-settings-modals-shortcuts/23-library-feed-layout-view.png`).
   - **Grid View**: Multi-column visual card grid (`05-settings-modals-shortcuts/24-library-grid-layout-view.png`).
4. **Dual-Pane Split View**: Any document can be opened alongside the current view via `Open in split view` (`?split=<doc_id>`), rendering two independent scrollable panes side-by-side (`05-settings-modals-shortcuts/26-reader-split-view-dual-pane.png`).

---

## 4. Multi-Format Document Reader Engines

### 4.1 Web Article & Newsletter Reader
- **Top Action Bar**: Back button (`Escape`), Location triage buttons (`Inbox`, `Later`, `Archive`), Shortlist star (`s`), Tag (`t`), Delete (`d`), Share (`Shift+S`), Ghostreader (`G`), Appearance (`Aa`), More actions (`...`), and Right Sidebar toggle (`]`).
- **Left Margin Table of Contents**: Automatically generated from `h1`–`h3` headings inside the document; highlights the active section during scroll.
- **Typography & Appearance Popover (`Aa`)** (`04-reader-detail/02-reader-appearance-menu.png`):
  - **Theme**: `Light`, `Dark`, `Same as interface`
  - **Typeface**: `Sans-serif` (Inter), `Serif` (Merriweather/Freight), `Mono`, `Atkinson Hyperlegible`, `OpenDyslexic`, or Custom fonts
  - **Font Size**: Steppedpx scale (`14px` – `28px`)
  - **Line Spacing**: `1.2` – `2.0`
  - **Line Width**: Narrow to Wide column widths
  - **Justification & Continuous Scroll**: Toggle switches for justified text alignment and paginated vs. continuous scrolling.

### 4.2 PDF Reader (`04-reader-detail/21-reader-pdf-viewer.png` – `22c-reader-pdf-text-mode.png`)
- **Toolbar Controls**:
  - **Toggle Metadata Sidebar**
  - **Enhanced Text View (`Text view` icon)**: Converts multi-column PDF layouts into clean, reflowable HTML text while preserving headings (`22c-reader-pdf-text-mode.png`).
  - **Zoom Selector**: `Automatic`, `Page fit`, `Page width`, `50%` – `400%` (`22a-reader-pdf-zoom-menu.png`).
  - **Area / Snapshot Highlight Tool (Crop icon)**: Lets the user drag a bounding box over diagrams, equations, or tables on the PDF canvas; saves the cropped image directly into the **Notebook** as a visual highlight (`22b-reader-pdf-area-highlight.png`).
  - **Page Stepper**: `< 1 / N >` input + prev/next buttons.

### 4.3 EPUB Book Reader (`04-reader-detail/23-reader-epub-book.png`)
- Parses `.epub` archives into chapterized HTML sections with full Table of Contents navigation in the left gutter, continuous or paginated scrolling, percentage progress badge (`0%`) at the bottom-right, and identical paragraph/selection highlighting to web articles.

### 4.4 YouTube Video & Podcast Player (`04-reader-detail/24-reader-youtube-video-transcript.png`)
- **Sticky Embedded Player**: Renders the YouTube iframe player at the top of the reading column with custom playback controls:
  - Speed selector (`1x`, `1.25x`, `1.5x`, `2x`)
  - `Auto-scroll` toggle (keeps the active transcript paragraph centered as the video plays)
  - `follow along` word-by-word karaoke highlight mode
- **Interactive Transcript**: Below the video player, each transcript segment displays its timestamp (`0:00`, `0:12`, etc.) in the left margin. Clicking any sentence seeks the video to that timestamp; pressing `h` or selecting text highlights the transcript and records the timestamped quote in the Notebook.

---

## 5. Highlighting, Annotations & Notebook System

1. **Paragraph-Level Keyboard Highlighting**:
   - Navigating paragraphs with `j` / `k` moves the blue left-border focus indicator.
   - Pressing `h` immediately highlights the entire focused paragraph (`04-reader-detail/06-reader-paragraph-highlighted.png`).
   - Pressing `n` opens an inline margin card on the right side of the page (`Add a note...`, `Cancel` / `Save`) (`04-reader-detail/07-reader-add-note-inline.png`, `08-reader-note-typed.png`).
   - Pressing `t` opens an inline tag selector popup for that highlight (`04-reader-detail/15-reader-tag-highlight-popup.png`).
2. **Selection Floating Toolbar** (`04-reader-detail/14-reader-floating-selection-toolbar.png`):
   - Selecting any arbitrary text span with the mouse pops up a compact floating toolbar with 5 actions:
     1. **Highlight (`h`)**
     2. **Add Note (`n`)**
     3. **Tag Highlight (`t`)**
     4. **Invoke Ghostreader (`g`)** (runs word/phrase/selection AI prompts on the selected text)
     5. **More (`...`)** (Copy quote, Share highlight image, etc.)
3. **Notebook Inspector Panel & Export** (`04-reader-detail/09-reader-notebook-panel-with-annotations.png`, `09b-reader-notebook-export-menu.png`):
   - Displays a top-level `Add a document note...` (`Shift+N`) field followed by all highlights/notes ordered by document position.
   - Clicking **Export** in the bottom-right of the Notebook opens the Export Menu:
     - `Copy to clipboard (Cmd+Shift+C)`
     - `Download annotations (.md)`
     - `Edit export template` (customizable Jinja2 markdown template for Obsidian/Logseq/Notion workflows).

---

## 6. Ghostreader AI Architecture

Readwise Reader integrates AI at two levels:

### 6.1 Global Library Chat (`/ghostreader`)
- Accessible from the left sidebar (`Ghostreader`) (`03-core-views/03-ghostreader-chat.png`).
- **Two Modes** (`03-core-views/28-ghostreader-mode-selector.png`):
  - **Ask your library**: Performs hybrid lexical + semantic search across the user's saved documents and highlights, returning grounded answers with inline hoverable document citations (`03-core-views/31-ghostreader-active-chat.png`).
  - **Recommend from library**: Recommends what to read next from the user's unread queue based on mood, topic, or reading time (`03-core-views/29-ghostreader-recommend-prompts.png`).
- **Categories of Starter Prompts**: `Find & Connect`, `Summarize & Synthesize`, `Explore & Discover`, `Review & Reflect`.
- **Chat History Drawer**: Slide-over drawer on the right listing past chat threads (`03-core-views/30-ghostreader-history-drawer.png`).

### 6.2 Document & Selection Jinja2 Prompt Engine (`/reader/api/default_prompts/2`)
- Powered by `GPT_6_LUNA` (or user-supplied OpenAI API key in `/ghostreader/preferences`).
- Every Ghostreader action is defined as a customizable **Jinja2 template** with custom filters (`num_tokens`, `central_sentences`, `central_paragraphs`, `lexical_search`, `join`) and multi-step chains (`{% set classification = response() %}`):
  - **Automatic Document Prompts**:
    - `🤏 Summarize the document`: Generates the 3-sentence `generated_summary` shown in the Right Sidebar Info tab.
    - `🏷️ Tag the document`: Automatically assigns relevant tags from existing tags.
  - **Word & Phrase Prompts** (invoked via selection toolbar `G`):
    - `📖 Dictionary definition`
    - `📚 Encyclopedia lookup`
    - `🩻 Internal x-ray` (searches earlier occurrences of a person/term in the same book/article using `document.content | slice(0, selection.start) | lexical_search(selection.text)`)
    - `❓ Ask a question`
    - `🌐 Translate`
    - `💡 Simplify`
  - **Selection Prompts**: `🤏 Summarize`, `💡 Simplify`, `🌐 Translate`, `❓ Ask a question`, `🤔 Haiku`, `🃏 Make flashcards` (Q&A pairs).
  - **Document Prompts** (`Shift+G` inside Reader): `❓ Ask the document a question`, `🤏 Summarize the document`, `🔑 Key takeaways`, `🤔 Thought-provoking questions`, `🃏 Make flashcards`.

---

## 7. Local-First Data Sync & Backend API Architecture

### 7.1 Local-First Storage Engine (SQLite WASM + IndexedDB)
- On initial load, the web app downloads `/sql-wasm.wasm` and initializes an in-browser SQLite database backed by IndexedDB storage chunks (`isChunkingSupported=true`).
- All UI views (Inbox, Later, Archive, Filtered Views, Tags, Offline Reading) query the local state immediately for zero-latency navigation (`<16ms` view switching).

### 7.2 State Synchronization Protocol (`GET /reader/api/state/`)
1. **Initial Hydration**:
   - `GET /reader/api/state/?schemaVersion=10&isChunkingSupported=true`
   - Returns a comprehensive JSON snapshot (captured in `data/api-samples/initial_state.txt`):
     ```json
     {
       "home": {
         "views": ["continue_reading", "recently_added", "shortlist", "quick_reads", "new_in_feed", "long_reads", "recently_highlighted"]
       },
       "settings": {
         "digest": { "enabled": false },
         "mobile": { "font": "Times New Roman", "fontSize": 1, "autoHighlight": true },
         "twitter": { "saveThreadsInReader": true, "saveArticlesInReader": true, ... },
         "defaultPage": "library",
         "documentLocations": ["feed", "new", "later", "archive"],
         "isGhostreaderEnabled": true,
         "globalGhostreaderEnabled": true,
         "experimentalOfflineLoadingEnabled": true
       },
       "filteredViews": {
         "articles": { "name": "Articles", "query": "category:article" },
         "shortlist": { "name": "⭐️ Shortlist", "query": "tag:shortlist AND (in:inbox OR in:later)" },
         "quick_reads": { "name": "⏱ Quick reads", "query": "minutes__lt:10 AND (in:inbox OR in:later)" },
         "continue_reading": { "name": "📖 Continue reading", "query": "progress__gt:5 AND last_opened__after:\"1 week ago\" AND (in:inbox OR in:later)" }
       },
       "documents": {
         "<ulid>": {
           "id": "01m4zm0f2280b7zkvkpc2a1ry4",
           "url": "https://blog.readwise.io/...",
           "title": "Getting Started with Reader",
           "author": "Erin",
           "source": "readwise onboarding",
           "category": "article",
           "triage_status": "new",
           "tags": {},
           "word_count": 1152,
           "saved_at": 1792062635019,
           "published_date": 1691625600000,
           "summary": "...",
           "generated_summary": "...",
           "image_url": "...",
           "favicon_url": "...",
           "parsed_doc_id": "246927406",
           "children": []
         }
       },
       "rssFeeds": { ... },
       "rssFoldersAndItems": [],
       "customEmails": {},
       "integrations": {},
       "jobs": { ... },
       "meta": {
         "time_of_last_fetch": 1792062638112,
         "was_incremental_sync": false
       }
     }
     ```
2. **Incremental Delta Polling**:
   - Every ~30 seconds (or upon window focus), the client polls:
     `GET /reader/api/state/?schemaVersion=10&isChunkingSupported=true&filter[updated_at][gt]=<time_of_last_fetch>`
   - Returns only modified `documents`, `filteredViews`, `jobs`, etc., with `"was_incremental_sync": true`.
3. **Separate Full Document Content & TTS Endpoint**:
   - `GET /reader/api/documents/content?filter[id]=<parsed_doc_id>`
   - Returns sanitized HTML and pre-computed Text-to-Speech word-boundary arrays (`data/api-samples/documents_content.json`):
     ```json
     {
       "data": [
         {
           "id": "246927406",
           "url": "https://blog.readwise.io/...",
           "status": "success",
           "tts": {
             "Amy": {
               "word_boundaries_v3_chunked": {
                 "single-chunk-full-content": [
                   [0.5, 0, "To", 0, 0, 0.1198, 0.5],
                   [0.6198, 3, "get", 3, 0, 0.1867, 0.6198]
                 ]
               }
             }
           },
           "tts_status": "COMPLETE",
           "truncated_paywall_article": false,
           "html": "<article>...</article>"
         }
       ]
     }
     ```

### 7.3 Event-Sourced Mutation Protocol (`POST /reader/api/state/update/`)
All state changes (highlighting, tagging, moving between Inbox/Later/Archive, creating views, changing preferences) are optimistic client mutations sent in batches to `POST /reader/api/state/update/` using **RFC 6902 JSON Patch** (`forwardPatch` + `reversePatch`) for instant undo/redo (`z` shortcut):

```json
{
  "events": [
    {
      "id": "01m4zm3f0b9x7k...",
      "correlationId": "01m4zm3f0b9x7k...",
      "name": "triage-document",
      "timestamp": 1792062700123,
      "environment": "web",
      "userInteraction": true,
      "dataUpdates": [
        {
          "itemsUpdated": [
            { "type": "document", "id": "01m4zm0f2280b7zkvkpc2a1ry4" }
          ],
          "forwardPatch": [
            { "op": "replace", "path": "/documents/01m4zm0f2280b7zkvkpc2a1ry4/triage_status", "value": "later" },
            { "op": "replace", "path": "/documents/01m4zm0f2280b7zkvkpc2a1ry4/last_status_update", "value": 1792062700123 }
          ],
          "reversePatch": [
            { "op": "replace", "path": "/documents/01m4zm0f2280b7zkvkpc2a1ry4/triage_status", "value": "new" },
            { "op": "replace", "path": "/documents/01m4zm0f2280b7zkvkpc2a1ry4/last_status_update", "value": 1792062635019 }
          ]
        }
      ]
    }
  ]
}
```
Notice how `forwardPatch` and `reversePatch` are stored together: pressing `z` (Undo) simply applies `reversePatch` locally and emits an inverse event!

---

## 8. Filtered View Query DSL Specification

Filtered Views (`/views`, `/filtered?id=...`) use a boolean query DSL evaluated against the local SQLite database (`05-settings-modals-shortcuts/15-add-filtered-view-modal.png`):

| Field / Operator | Description & Examples |
|---|---|
| `in:` | Location filter: `in:inbox`, `in:later`, `in:archive`, `in:shortlist`, `in:feed` |
| `category:` / `type:` | Content type: `category:article`, `category:pdf`, `category:epub`, `category:email`, `category:video`, `category:tweet`, `category:podcast` |
| `tag:` | Document tag: `tag:favorite`, `tag:shortlist`, `tag:"machine learning"` |
| `highlight_tags:` | Highlight-level tag match |
| `has:` | Presence checks: `has:highlights`, `has:notes`, `has:tags`, `has:summary` |
| `minutes__lt:` / `minutes__gt:` | Estimated reading time in minutes (`minutes__lt:10`, `minutes__gt:30`) |
| `progress__gt:` / `progress__lt:` | Reading progress percentage (`progress__gt:5`) |
| `saved__gt:` / `saved__lt:` | Relative or ISO date when saved (`saved__gt:"1 week ago"`) |
| `last_opened__after:` / `last_opened__gt:` | Relative or ISO timestamp of last open (`last_opened__after:"1 week ago"`) |
| `author:` / `domain:` / `feed:` | Metadata string match (`feed:true`, `domain:substack.com`) |
| `AND`, `OR`, `NOT`, `(...)` | Boolean combinators and grouping parentheses |

---

## 9. Complete Keyboard Shortcuts Matrix

Captured from `/preferences/shortcuts` (`05-settings-modals-shortcuts/04-preferences-keyboard-shortcuts.png` & `04b-preferences-keyboard-shortcuts-scrolled.png`):

| Category | Action | Default Shortcut |
|---|---|---|
| **Global** | Open Command Palette | `Cmd/Ctrl + K` |
| **Global** | Open Full-Text Search | `/` |
| **Global** | Pin or unpin Left Sidebar | `[` |
| **Global** | Pin or unpin Right Sidebar | `]` |
| **Global** | Toggle Zen Focus Mode (hide both panels) | `\` |
| **Global** | Undo last action | `z` |
| **Global** | Save new URL | `a` |
| **Global** | Upload file (PDF/EPUB/HTML) | `u` |
| **Navigation** | Focus next item / paragraph | `j` or `ArrowDown` |
| **Navigation** | Focus previous item / paragraph | `k` or `ArrowUp` |
| **Navigation** | Move down and open item | `Shift + J` |
| **Navigation** | Move up and open item | `Shift + K` |
| **Navigation** | Open focused item / Close reader | `Enter` / `Escape` |
| **Triage** | Archive / Unarchive item | `e` |
| **Triage** | Move to Later | `l` |
| **Triage** | Move to Inbox | `i` |
| **Triage** | Toggle Shortlist | `s` |
| **Triage** | Delete item | `d` |
| **Triage** | Bulk actions on current view | `Shift + B` |
| **Annotation** | Highlight focused paragraph or selection | `h` |
| **Annotation** | Add note to focused highlight/paragraph | `n` |
| **Annotation** | Tag focused highlight | `t` |
| **Annotation** | Tag document | `Shift + T` (or `t` in list view) |
| **Annotation** | Add document-level note (opens Notebook) | `Shift + N` |
| **Annotation** | Edit document metadata | `Shift + M` |
| **AI & Sharing** | Invoke Ghostreader on selection/paragraph | `g` |
| **AI & Sharing** | Invoke Ghostreader on entire document | `Shift + G` |
| **AI & Sharing** | Share document / highlight | `Shift + S` |
| **AI & Sharing** | Copy Notebook annotations to clipboard | `Cmd/Ctrl + Shift + C` |
| **Menus** | Show item action menu (`...`) | `m` |
| **Reader** | Find in document | `Cmd/Ctrl + F` |
| **Reader** | Toggle auto-highlighting | `Shift + H` |
| **Navigation Go-To** | Go to Home / Inbox / Later / Archive / Feed | `g h`, `g i`, `g l`, `g a`, `g f` |
