const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots', '04-reader-detail');
  const coreDir = path.join(__dirname, '..', 'screenshots', '03-core-views');
  const profileDir = path.join(__dirname, '..', 'data', 'chrome-profile');
  fs.mkdirSync(outDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const page = context.pages()[0] || await context.newPage();

  console.log('1. Opening /new to open Add menu & add YouTube URL...');
  await page.goto('https://read.readwise.io/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Open the '+' Add dropdown using pointerdown on the Radix trigger
  await page.evaluate(() => {
    const btn = document.querySelector('button[class*="_addDropdownButton"]');
    if (btn) {
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
      btn.click();
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '18-add-menu-dropdown.png') });

  // Also press 'a' (shortcut for Save URL)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.mouse.click(500, 30);
  await page.waitForTimeout(300);
  await page.keyboard.press('a');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '19-add-url-modal.png') });

  // Fill YouTube URL in the modal
  const activeInput = page.locator('input:focus, [role="dialog"] input, input[placeholder*="URL" i], input[placeholder*="http" i]').first();
  if (await activeInput.isVisible().catch(() => false)) {
    await activeInput.fill('https://www.youtube.com/watch?v=eJBtvfbcic0');
  } else {
    await page.keyboard.type('https://www.youtube.com/watch?v=eJBtvfbcic0');
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '19b-add-url-filled.png') });
  await page.keyboard.press('Enter');
  console.log('Submitted YouTube URL, waiting for ingestion...');
  await page.waitForTimeout(8000);

  // 2. Capture PDF Document Reader (/new/read/01m4zmw2fytwq167qc36bfr9bn)
  console.log('2. Opening PDF Document Reader...');
  await page.goto('https://read.readwise.io/new/read/01m4zmw2fytwq167qc36bfr9bn', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(outDir, '21-reader-pdf-viewer.png') });

  // Dump PDF toolbar controls
  const pdfControls = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button, [role="button"]'))
      .map(b => ({ text: (b.innerText || b.getAttribute('aria-label') || b.getAttribute('title') || '').trim(), rect: b.getBoundingClientRect() }))
      .filter(x => x.rect.width > 0 && x.rect.y < 100)
  );
  console.log('PDF top controls:', JSON.stringify(pdfControls));

  // Click "Text view" / "Enhanced text mode" button in PDF toolbar if present
  const textViewBtn = page.locator('button:has-text("Text view"), button[aria-label*="text" i], button[title*="text" i]').first();
  if (await textViewBtn.isVisible().catch(() => false)) {
    await textViewBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '22-reader-pdf-text-mode.png') });
  }

  // 3. Capture EPUB Book Reader (/new/read/01m4zmw3v5v6x6dxqa0xkapwfe)
  console.log('3. Opening EPUB Book Reader...');
  await page.goto('https://read.readwise.io/new/read/01m4zmw3v5v6x6dxqa0xkapwfe', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(outDir, '23-reader-epub-book.png') });

  // 4. Check /new for the newly added YouTube video and open it!
  console.log('4. Checking /new for YouTube video...');
  await page.goto('https://read.readwise.io/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(coreDir, '04b-library-inbox-multiformat.png') });

  const docs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/read/"]')).map(a => ({
      href: a.getAttribute('href'),
      text: (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 120)
    }))
  );
  console.log('All Inbox docs:', JSON.stringify(docs, null, 2));

  // Find YouTube video doc (or check /filter/category%253Avideo/split/triage_status/new)
  await page.goto('https://read.readwise.io/filter/category%253Avideo/split/triage_status/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(coreDir, '15-category-videos-populated.png') });

  const videoDoc = await page.evaluate(() => {
    const a = document.querySelector('a[href*="/read/"]');
    return a ? a.getAttribute('href') : null;
  });
  console.log('Video doc href:', videoDoc);
  if (videoDoc) {
    await page.goto(`https://read.readwise.io${videoDoc}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(outDir, '24-reader-youtube-video-transcript.png') });
  }

  // Also update populated PDFs and Books category screenshots
  await page.goto('https://read.readwise.io/filter/category%253Apdf/split/triage_status/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(coreDir, '13-category-pdfs-populated.png') });

  await page.goto('https://read.readwise.io/filter/category%253Aepub/split/triage_status/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(coreDir, '11-category-books-populated.png') });

  await context.close();
  console.log('Finished 07b_capture_pdf_epub_youtube!');
})();
