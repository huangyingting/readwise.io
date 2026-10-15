# Readwise Reader (`read.readwise.io`) — Full-Stack Next.js + NextAuth + Prisma Clone & 108-Screenshot Reverse-Engineering Archive

This repository contains both:
1. **A Full-Featured Readwise Reader Web Application** built with **Next.js 14 (App Router)**, **NextAuth**, **Prisma ORM** (**SQLite** for local development, **PostgreSQL** for production), **Tailwind CSS**, and a local-first state/sync engine with **100% feature parity** across all 33 routes.
2. **The Complete 108-Screenshot Reverse-Engineering Blueprint & Live API Dataset** captured from `https://read.readwise.io` via automated Playwright scripts.

---

## Quick Start (Local Development — SQLite)

```bash
# 1. Install dependencies
npm install

# 2. Push Prisma schema to local SQLite (prisma/dev.db) and seed sample multi-format library
npm run db:push
npm run db:seed

# 3. Start local development server (http://localhost:3000)
npm run dev
```

- **Default Demo Credentials**: `alex@readwise.io` / `Readwise2026!` (also available via the **1-Click Demo Login** button on `/accounts/login`, or automatic local-first workspace hydration).
- **Run Playwright E2E Feature-Parity Test Suite**:
  ```bash
  npm run build
  npx playwright test tests/e2e-feature-parity.spec.ts
  ```

---

## Production Deployment (PostgreSQL)

The repository supports seamless switching between **SQLite** (local dev) and **PostgreSQL** (production) via `scripts/prepare-prisma.mjs` and `prisma/schema.postgres.prisma`:

```bash
# 1. Configure environment variables for production
export DATABASE_PROVIDER="postgresql"
export DATABASE_URL="postgresql://user:password@host:5432/readwise_reader?schema=public"
export NEXTAUTH_URL="https://your-production-domain.com"
export NEXTAUTH_SECRET="your-production-secret"

# 2. Sync PostgreSQL schema and build Next.js production bundle
npm run db:push:postgres
npm run build
npm run start
```

---

## Implemented Feature Parity Matrix (All 33 Routes)

| Subsystem | Routes | Implemented Capabilities |
|---|---|---|
| **Public & Marketing** | `/read`, `/pricing` | Hero landing page, multi-format feature breakdown, Readwise Full vs. Lite pricing comparison |
| **Authentication (NextAuth)** | `/accounts/login`, `/accounts/signup`, `/accounts/password/reset`, `/api/auth/[...nextauth]`, `/api/auth/register` | Credentials authentication, 1-Click Demo Login, new user registration with automatic library seeding, password reset flow |
| **4-Step Onboarding Wizard** | `/welcome` | Interactive 4-step wizard: Profile, Library Triage Philosophy (`inbox-later-archive` / `shortlist` / `simple`), Integrations connect, and Browser Extension install |
| **Local-First Sync & Undo Engine** | `/api/reader/state`, `/api/reader/state/update` | Full hydration + incremental `updatedAfter` sync, `localStorage` instant cache, ULID mutation logging with **RFC 6902 JSON Patch** `forwardPatch` & `reversePatch`, and `z` Undo support |
| **3-Pane Workspace Shell** | `/home`, `/new`, `/later`, `/archive`, `/trash` | Collapsible Left Navigation Sidebar (`[`), Center Canvas (`List` / `Compact` / `Grid` layouts, sorting, grouping, bulk actions), and Right Context Inspector (`]` with `Info`, `Notebook`, `Chat` tabs + inline metadata editing) |
| **Boolean Query DSL & Filtered Views** | `/filtered`, `/views`, `/search`, `/tags` | Full boolean Query DSL parser (`AND`, `OR`, `NOT`, parentheses, `category:`, `location:`, `tag:`, `minutes__lt:`, `minutes__gt:`, `progress__gt:`, `has:highlights`, `has:notes`, `seen:`, `in:`), pinned views, and full-text search |
| **RSS & Newsletter Feeds** | `/feed`, `/add-to-library`, `/add-to-feed` | Unseen/Seen RSS streams, Manage Feeds (`Your feeds`), Curated Feed Discovery (`Suggested`), custom `@library.readwise.io` & `@feed.readwise.io` email simulation, and OPML export |
| **Multi-Format Document Reader** | `/new/read/[id]` | **Web Articles & Newsletters**, **PDF Viewer** (Page Canvas + Zoom `50%`–`200%` + Rectangular Area Snapshot Highlight + Reflowable Enhanced Text View), **EPUB Book Reader** (Chapter TOC), **YouTube Video Reader** (Embedded player + clickable time-synced interactive transcript with auto-scroll & highlighting), **TTS Audio Bar** (Word-boundary synchronized highlighting), **Typography (`Aa`)**, **Zen Mode (`\`)**, and **Dual-Pane Split View (`?split=<id>`)** |
| **Ghostreader AI (RAG & Jinja2 Studio)** | `/ghostreader`, `/ghostreader/preferences`, `/api/ghostreader` | Library-wide RAG synthesis (`Ask your library` & `Recommend from library`) with clickable document citations, chat history drawer, and customizable **Jinja2 Prompt Templates** supporting `num_tokens`, `central_sentences`, `central_paragraphs`, and `lexical_search` filters |
| **Settings, Shortcuts & Exports** | `/profile`, `/preferences`, `/preferences/shortcuts`, `/integrations`, `/product-emails`, `/resources`, `/api/export` | Command Palette (`Cmd/Ctrl+K`), Keyboard Shortcuts Customizer & `?` Reference Modal, Light/Sepia/Dark theme persistence, and live CSV / OPML / Jinja2 Markdown Notebook exports |

---

## Repository Structure

```
/home/azadmin/readwise.io/
├── README.md                           # Overview & Complete 108-Screenshot Visual Catalog
├── docs/
│   └── ARCHITECTURE_AND_UI_SPEC.md     # Full technical architecture, API schemas, sync protocol & UI spec
├── data/
│   ├── temp_account.json               # Registered temp email account credentials (mail.tm)
│   ├── storage_state.json              # Authenticated Playwright session storage state
│   ├── sample-paper.pdf                # Generated multi-page sample PDF uploaded to Reader
│   ├── sample-book.epub                # Generated multi-chapter sample EPUB book uploaded to Reader
│   └── api-samples/                    # Captured live backend JSON payloads
│       ├── initial_state.txt           # GET /reader/api/state/?schemaVersion=10 snapshot
│       ├── documents_content.json      # GET /reader/api/documents/content (HTML + TTS word boundaries)
│       ├── default_prompts.json        # GET /reader/api/default_prompts/2 (Jinja2 AI prompt templates)
│       └── profile_details.json        # User profile & subscription metadata
├── screenshots/                        # 108 high-resolution (1440x900 & 390x844) PNG screenshots
│   ├── 01-public-auth/                 # 9 screenshots: Login, Signup, Password Reset, Landing, Pricing
│   ├── 02-onboarding/                  # 9 screenshots: Cloudflare Turnstile & 4-step Onboarding Wizard
│   ├── 03-core-views/                  # 35 screenshots: Home, Ghostreader AI, Library, Categories, Feeds, Views, Search
│   ├── 04-reader-detail/               # 25 screenshots: Article, PDF, EPUB, YouTube Video readers & Annotations
│   └── 05-settings-modals-shortcuts/   # 30 screenshots: Settings, Modals, Command Palette, Dark Mode, Mobile, Split View
└── scripts/                            # Playwright automation scripts used to capture all views
    ├── 01_create_temp_email.js
    ├── 02_capture_public_and_signup.js
    ├── 03_solve_turnstile_and_onboard.js
    ├── 04_complete_onboarding.js
    ├── 05_capture_core_views.js
    ├── 05b_capture_remaining_core.js
    ├── 05c_search_and_ghostreader.js
    ├── 06_capture_reader_article_ui.js
    ├── 06b_reader_article_extras.js
    ├── 07_generate_sample_files.js
    ├── 07b_capture_pdf_epub_youtube.js
    ├── 07c_pdf_submodes.js
    ├── 08_capture_settings_and_modals.js
    ├── 08b_finish_settings_and_modals.js
    └── 08c_extra_ui_combinations.js
```

---

## Key Reverse-Engineering Highlights

See **[`docs/ARCHITECTURE_AND_UI_SPEC.md`](docs/ARCHITECTURE_AND_UI_SPEC.md)** for full details:

1. **Local-First Architecture (`sql-wasm.wasm` + IndexedDB)**:
   - Client loads SQLite compiled to WebAssembly (`/sql-wasm.wasm`) and syncs state from `GET /reader/api/state/?schemaVersion=10&isChunkingSupported=true`.
   - Incremental sync polls `GET /reader/api/state/?schemaVersion=10&isChunkingSupported=true&filter[updated_at][gt]=<timestamp>`.
2. **Event-Sourced Optimistic Mutations (`POST /reader/api/state/update/`)**:
   - All client mutations emit ULID-keyed events containing RFC 6902 JSON Patch pairs (`forwardPatch` and `reversePatch`), enabling instant offline mutations and `z` Undo/Redo.
3. **3-Pane Collapsible Workspace**:
   - Left Navigation Sidebar (`[`), Center List/Reader Canvas (with dual-pane `?split=<doc_id>` support), and Right Inspector Panel (`]` with `Info`, `Notebook`, and `Chat` tabs).
4. **Unified Multi-Format Readers**:
   - **Web Articles & Newsletters**: Sanitized HTML + pre-computed Text-to-Speech word-boundary arrays (`tts.Amy.word_boundaries_v3_chunked`), inline margin notes, and customizable typography (`Aa`).
   - **PDF Viewer**: Canvas mode + OCR Enhanced Text reflow mode + rectangular Area Snapshot highlighting.
   - **EPUB Reader**: Chapterized book reader with Table of Contents and reading progress tracking.
   - **YouTube Video Player**: Embedded video with time-synced auto-scrolling interactive transcript that supports text highlighting.
5. **Ghostreader AI (`GPT_6_LUNA` + Jinja2 Prompt Templates)**:
   - Library-wide RAG chat (`/ghostreader`) with grounded document citations + customizable Jinja2 prompt templates (`/reader/api/default_prompts/2`) using custom filters (`num_tokens`, `central_sentences`, `central_paragraphs`, `lexical_search`).

---

## Complete Catalog of 108 Captured Screenshots

### 1. Public & Authentication UI (`screenshots/01-public-auth/`)
| File | Description |
|---|---|
| `01-login-page.png` | Default login screen (`readwise.io/accounts/login/?next=https://read.readwise.io/`) with Google, Apple, and Email login |
| `02-signup-options-card.png` | Signup method selection card ("Create your Readwise account" with Google, Apple, or Email) |
| `03-signup-email-form.png` | Expanded email + password signup form on the login/signup card |
| `04-direct-signup-page.png` | Dedicated `/accounts/signup/?next=/to_reader` registration page |
| `05-password-reset-page.png` | Password reset request page (`/accounts/password/reset/`) |
| `06-login-error-state.png` | Validation error state when submitting invalid credentials |
| `07-reader-landing-hero.png` | Readwise Reader marketing page (`/read`) hero section |
| `07-reader-landing-full.png` | Full-page screenshot of `/read` landing page |
| `08-pricing-page.png` | Readwise pricing comparison page (`/pricing`: Readwise Full vs. Lite) |

### 2. Account Registration & Onboarding Wizard (`screenshots/02-onboarding/`)
| File | Description |
|---|---|
| `01-signup-form-turnstile-prompt.png` | Signup form displaying Cloudflare Turnstile human verification challenge |
| `02-signup-form-turnstile-verified.png` | Signup form with Cloudflare Turnstile solved (`Success!`) |
| `03-post-signup-initial.png` | Initial redirect into Readwise Reader (`/welcome`) after account creation |
| `03-post-signup-initial-full.png` | Full-page capture of initial onboarding entry |
| `04-welcome-step-1.png` | **Onboarding Step 1 (`/welcome`)**: Library Workflow selection (Inbox vs. Shortlist vs. Simple workflow + Feed toggle) |
| `04-welcome-step-2.png` | **Onboarding Step 2 (`/welcome/extension`)**: Browser extension installation prompt |
| `04-welcome-step-3.png` | **Onboarding Step 3 (`/welcome/mobile`)**: Mobile app download QR code screen |
| `04-welcome-step-4.png` | **Onboarding Step 4 (`/welcome/ready`)**: Final onboarding confirmation before entering Library |
| `05-post-onboarding-reader-new.png` | First load of `/new` Library Inbox populated with sample onboarding articles |

### 3. Core Workspace, Library, Feeds, Views, Search & Ghostreader Chat (`screenshots/03-core-views/`)
| File | Description |
|---|---|
| `01-home-top.png` | **Home Dashboard (`/home`)** top section (*Continue reading*, *Recently added*) |
| `02-home-scrolled.png` | **Home Dashboard (`/home`)** scrolled (*Shortlist*, *Quick reads*, *New in Feed*) |
| `26-home-configure-menu.png` | **Home Configure Popover**: Toggle and reorder dashboard carousels |
| `03-ghostreader-chat.png` | **Ghostreader AI Chat (`/ghostreader`)** default landing screen with starter prompt cards |
| `28-ghostreader-mode-selector.png` | Ghostreader mode selector dropdown (`Ask your library` vs. `Recommend from library`) |
| `29-ghostreader-recommend-prompts.png` | Ghostreader switched to `Recommend from library` mode with tailored recommendation prompts |
| `30-ghostreader-history-drawer.png` | Ghostreader right-side **Chat History Drawer** |
| `31-ghostreader-active-chat.png` | Live **Ghostreader AI response** synthesizing library documents with clickable citation pills |
| `04-library-inbox-info-tab.png` | **Library Inbox (`/new`)** with Right Inspector Panel open on the **Info** tab |
| `04b-library-inbox-multiformat.png` | **Library Inbox (`/new`)** populated with Web Articles, YouTube Video, EPUB Book, and PDF Document |
| `05-library-inbox-notebook-tab.png` | **Library Inbox (`/new`)** with Right Inspector Panel on the **Notebook** tab |
| `06-library-inbox-ghostreader-tab.png` | **Library Inbox (`/new`)** with Right Inspector Panel on the **Chat (Ghostreader)** tab |
| `07-library-inbox-edit-metadata.png` | **Inline Metadata Editor** (`Shift+M`) in the Right Inspector Panel (Title, Author, Published Date, URL, Category) |
| `08-library-later.png` | **Library — Later (`/later`)** queue view |
| `09-library-archive.png` | **Library — Archive (`/archive`)** completed items view |
| `10-category-articles.png` | **Articles Filtered View (`/filtered?id=articles`)** |
| `11-category-books.png` | **Books Filtered View (`/filtered?id=epubs`)** — Empty state |
| `11-category-books-populated.png` | **Books Filtered View (`/filtered?id=epubs`)** — Populated with uploaded EPUB book |
| `12-category-emails.png` | **Emails Filtered View (`/filtered?id=emails`)** — Empty state with `@library.readwise.io` instructions |
| `13-category-pdfs.png` | **PDFs Filtered View (`/filtered?id=pdfs`)** — Empty state |
| `13-category-pdfs-populated.png` | **PDFs Filtered View (`/filtered?id=pdfs`)** — Populated with uploaded PDF paper |
| `14-category-tweets.png` | **Tweets Filtered View (`/filtered?id=tweets`)** — Empty state |
| `15-category-videos.png` | **Videos Filtered View (`/filtered?id=videos`)** — Empty state |
| `15-category-videos-populated.png` | **Videos Filtered View (`/filtered?id=videos`)** — Populated with YouTube walkthrough video |
| `16-category-podcasts.png` | **Podcasts Filtered View (`/filtered?id=podcasts`)** — Empty state |
| `17-tags-view.png` | **Manage Tags View (`/tags`)** showing tag table, item counts, and actions |
| `18-feed-unseen.png` | **Feed — Unseen (`/feed`)** RSS & newsletter stream |
| `19-feed-seen.png` | **Feed — Seen (`/feed/seen`)** viewed RSS items |
| `20-manage-feeds.png` | **Manage Feeds (`/feed/sources`)** subscribed RSS feeds table (`Your feeds` tab) |
| `27-manage-feeds-suggested.png` | **Manage Feeds — Suggested (`/feed/suggestions`)** curated RSS feed discovery tab |
| `21-shortlist-view.png` | **Pinned View — Shortlist (`/filtered?id=shortlist`)** |
| `22-manage-views.png` | **Manage Filtered Views (`/views`)** table showing all default and custom query DSL views |
| `23-trash-view.png` | **Trash View (`/trash`)** with `Empty trash` action |
| `24-search-empty.png` | **Full-Text Search (`/search`)** initial empty state |
| `25-search-results.png` | **Full-Text Search (`/search`)** live instant search results for `"Ghostreader"` |

### 4. Multi-Format Document Readers & Annotation Tools (`screenshots/04-reader-detail/`)
| File | Description |
|---|---|
| `01-reader-article-3pane.png` | **3-Pane Web Article Reader** (`/new/read/<id>`) with Left Table of Contents, Center Reading Column, and Right Info Panel |
| `02-reader-appearance-menu.png` | **Appearance / Typography Popover (`Aa`)**: Theme, Typeface, Font Size, Line Spacing, Width, Justification |
| `03-reader-dark-mode-appearance.png` | Reader appearance switched to Dark Mode via `Aa` menu |
| `04-reader-more-actions-menu.png` | Top-bar **More Actions (`...`)** menu inside Article Reader |
| `06-reader-paragraph-highlighted.png` | Keyboard paragraph highlight (`h`) applied to focused paragraph |
| `07-reader-add-note-inline.png` | Inline **Margin Note input card (`n`)** attached to a highlighted paragraph |
| `08-reader-note-typed.png` | Populated Margin Note saved alongside the paragraph in the right gutter |
| `09-reader-notebook-panel-with-annotations.png` | **Notebook Inspector Tab** displaying document note + synced highlights and margin notes |
| `09b-reader-notebook-export-menu.png` | **Notebook Export Menu** (`Copy to clipboard`, `Download annotations`, `Edit export template`) |
| `10-reader-ghostreader-context-menu.png` | **Document-Level Ghostreader Prompt Palette (`Shift+G`)** inside Reader (`Ask the document a question`, `Summarize`, `Key takeaways`, `Make flashcards`, etc.) |
| `11-reader-in-document-search.png` | **In-Document Search Bar (`Ctrl+F`)** searching within the active article |
| `13-reader-zen-focus-mode.png` | **Zen Focus Mode (`\`)** with both left TOC and right inspector panels collapsed |
| `14-reader-floating-selection-toolbar.png` | **Floating Text Selection Toolbar** (Highlight, Note, Tag, Ghostreader `G`, More `...`) |
| `15-reader-tag-highlight-popup.png` | **Tag Highlight Popover (`t`)** adding a highlight-level tag (`important-architecture`) |
| `16-reader-tag-document-popup.png` | **Tag Document Popover (`Shift+T`)** adding a document-level tag (`reverse-engineering`) |
| `18-add-menu-dropdown.png` | Left Sidebar **`+ Add` Button Dropdown** (`Add URL`, `Upload file`, `Add feed`) + **Share Submenu** (`Copy link`, `Enable public link`) |
| `19-add-url-modal.png` | **Add URL Modal (`a`)** empty state |
| `19b-add-url-filled.png` | **Add URL Modal (`a`)** filled with a YouTube URL |
| `20-after-uploading-pdf-epub.png` | Library Inbox after uploading `sample-paper.pdf`, `sample-book.epub`, and YouTube video |
| `21-reader-pdf-viewer.png` | **PDF Document Reader**: Full PDF.js canvas viewer with page controls and right metadata panel |
| `22a-reader-pdf-zoom-menu.png` | **PDF Zoom Selector Dropdown** (`Automatic`, `Page fit`, `Page width`, `50%`–`400%`) |
| `22b-reader-pdf-area-highlight.png` | **PDF Area / Snapshot Highlight**: Drag-selected rectangular region captured as an image annotation in the Notebook |
| `22c-reader-pdf-text-mode.png` | **PDF Enhanced Text View**: Reflowable parsed HTML view of the PDF document |
| `23-reader-epub-book.png` | **EPUB Book Reader**: Multi-chapter e-book view with left Table of Contents and chapter typography |
| `24-reader-youtube-video-transcript.png` | **YouTube Video Reader**: Sticky video player (`1x`, `Auto-scroll`, `follow along`) + time-synced interactive transcript |

### 5. Settings, Preferences, Modals, Layouts, Dark Theme & Mobile (`screenshots/05-settings-modals-shortcuts/`)
| File | Description |
|---|---|
| `01-profile-settings.png` | **Account Profile (`/profile`)**: User details, Subscription status, CSV/PDF/EPUB/OPML data exports |
| `02-preferences-general.png` | **General Preferences (`/preferences`)**: Theme, Library workflow, Auto-advancing, Twitter sync, Offline settings |
| `03-preferences-library-workflow-modal.png` | **Library Configuration Modal** inside `/preferences` |
| `04-preferences-keyboard-shortcuts.png` | **Keyboard Shortcuts Customizer (`/preferences/shortcuts`)** — top section |
| `04b-preferences-keyboard-shortcuts-scrolled.png` | **Keyboard Shortcuts Customizer (`/preferences/shortcuts`)** — scrolled section |
| `05-integrations-page.png` | **Integrations (`/integrations`)** — Instapaper, Pocket, Matter, Raindrop.io, Goodreads |
| `05b-integrations-scrolled.png` | **Integrations (`/integrations`)** — Feedly, Feedbin, FreshRSS, Inoreader |
| `06-ghostreader-preferences.png` | **Ghostreader Settings (`/ghostreader/preferences`)**: AI toggles, custom OpenAI API key, and prompt categories |
| `27-custom-ghostreader-prompt-modal.png` | **Ghostreader Jinja2 Prompt Template Editor Modal** showing `{% if (document.content \| num_tokens) > 2500 %}` logic and live Document Preview |
| `07-product-emails-settings.png` | **Product Emails (`/product-emails`)**: Wisereads, Daily Digest schedule, Feedback emails |
| `08-add-to-library-page.png` | **Add to Library (`/add-to-library`)**: Custom `@library.readwise.io` email, browser extensions, mobile apps |
| `09-add-to-feed-page.png` | **Add to Feed (`/add-to-feed`)**: Custom `@feed.readwise.io` newsletter email, RSS feeds, OPML import |
| `10-resources-page.png` | **Resources (`/resources`)**: Extensions, mobile apps, community, tutorials |
| `11-command-palette-cmd-k.png` | **Command Palette (`Cmd/Ctrl + K`)** overlay with fuzzy search across all Reader commands |
| `12-help-support-menu.png` | **Help & Support Popover (`?`)**: Chat with support, Report bug, Tutorials, Keyboard shortcuts, Discord |
| `13a-library-view-options-menu.png` | **Library View Options Dropdown**: Switch between `List` / `Feed` / `Grid`, Group by, Show seen items, Bulk actions |
| `13b-library-sort-options-menu.png` | **Library Sort Dropdown**: Sort by Manual, Random, Date saved, Date moved, Date published, Progress, Length, Title, Author |
| `14-document-row-more-menu.png` | **Document List Item More (`m` / `...`) Context Menu**: Split view, Ask Ghostreader, Tag, Note, Edit metadata, Share, Export |
| `15-add-filtered-view-modal.png` | **New Filtered View Modal** on `/views` with live query DSL autocomplete and syntax reference table |
| `16-add-rss-feed-modal.png` | **Add RSS Feed Modal** on `/feed/sources` |
| `17-dark-theme-preferences.png` | **Dark Theme** — Preferences page (`/preferences`) |
| `18-dark-theme-library-inbox.png` | **Dark Theme** — Library Inbox (`/new`) |
| `19-dark-theme-home.png` | **Dark Theme** — Home Dashboard (`/home`) |
| `20-dark-theme-reader-article.png` | **Dark Theme** — 3-Pane Article Reader (`/new/read/<id>`) |
| `21-mobile-responsive-library.png` | **Mobile Responsive (`390x844`)** — Library Inbox (`/new`) with mobile header and compact cards |
| `22-mobile-responsive-reader.png` | **Mobile Responsive (`390x844`)** — Article Reader with floating bottom progress pill |
| `23-library-feed-layout-view.png` | **Library Feed Card Layout**: Wide centered cards with thumbnails and multi-line summaries |
| `24-library-grid-layout-view.png` | **Library Grid Card Layout**: Multi-column visual thumbnail grid |
| `25-library-bulk-actions-modal.png` | **Bulk Actions Modal (`Shift+B`)**: Mark all seen, Archive all, Move all to Later/Shortlist, Tag all, Delete all |
| `26-reader-split-view-dual-pane.png` | **Dual-Pane Split View (`?split=<id>`)**: Library list and Document Reader open side-by-side |
