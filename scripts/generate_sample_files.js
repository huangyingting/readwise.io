const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  // Generate a clean 2-page PDF using Chromium's page.pdf()!
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Georgia, serif; margin: 60px; line-height: 1.6; color: #222; }
        h1 { font-size: 28px; margin-bottom: 8px; }
        h2 { font-size: 20px; margin-top: 28px; }
        .meta { color: #666; font-style: italic; margin-bottom: 32px; }
        p { margin-bottom: 16px; font-size: 14px; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <h1>Designing Local-First Reading Applications</h1>
      <div class="meta">By Alex Rivera &bull; October 2026 &bull; Systems Architecture Journal</div>
      <h2>1. Introduction to Local-First Architecture</h2>
      <p>Modern reading applications require instant responsiveness, offline availability, and seamless multi-device synchronization. By embedding SQLite compiled to WebAssembly inside the browser and persisting chunks in IndexedDB, every navigation and full-text search query executes in under 16 milliseconds.</p>
      <p>Mutations such as highlighting a passage, adding a margin note, or tagging a document are recorded immediately as local JSON Patch events and synchronized asynchronously with the cloud backend.</p>
      <h2>2. Unified Multi-Format Ingestion Pipeline</h2>
      <p>Whether a user saves a web article via a browser extension, subscribes to an RSS feed, forwards an email newsletter, watches a YouTube video with synchronized transcripts, or uploads a PDF or EPUB book, the ingestion pipeline normalizes metadata, extracts clean HTML or structured blocks, and indexes tokens for instant search.</p>
      <div class="page-break"></div>
      <h2>3. AI-Assisted Active Reading (Ghostreader)</h2>
      <p>Active reading goes beyond passive consumption. Integrated language models allow readers to define terms in context, generate encyclopedia lookups, simplify dense academic prose, ask questions grounded in document citations, and synthesize flashcards automatically.</p>
    </body>
    </html>
  `);
  await page.pdf({ path: path.join(dataDir, 'sample-paper.pdf'), format: 'Letter' });
  await browser.close();
  console.log('Generated sample-paper.pdf:', fs.statSync(path.join(dataDir, 'sample-paper.pdf')).size, 'bytes');
})();
