const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots', '03-core-views');
  const profileDir = path.join(__dirname, '..', 'data', 'chrome-profile');
  fs.mkdirSync(outDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const page = context.pages()[0] || await context.newPage();

  async function goAndSnap(urlPath, filename, waitMs = 3500) {
    console.log(`Capturing ${filename} (${urlPath})...`);
    await page.goto(`https://read.readwise.io${urlPath}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(waitMs);
    await page.screenshot({ path: path.join(outDir, filename) });
  }

  // 1. Home view
  await goAndSnap('/home', '01-home-top.png', 4500);
  // Scroll down inside the home scroll container
  await page.evaluate(() => {
    const scrollables = Array.from(document.querySelectorAll('div')).filter(el => el.scrollHeight > el.clientHeight + 100 && el.clientWidth > 500);
    scrollables.forEach(el => { el.scrollTop = 600; });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '02-home-scrolled.png') });

  // 2. Ghostreader full-page chat (/ghostreader)
  await goAndSnap('/ghostreader', '03-ghostreader-chat.png', 4000);

  // 3. Library Inbox (/new) + Right Panel Tabs (Info, Notebook, Ghostreader, Edit Metadata)
  await goAndSnap('/new', '04-library-inbox-info-tab.png', 4000);

  const notebookTab = page.locator('button:has-text("Notebook")').first();
  if (await notebookTab.isVisible().catch(() => false)) {
    await notebookTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '05-library-inbox-notebook-tab.png') });
  }

  const ghostreaderTab = page.locator('button:has-text("Ghostreader")').first();
  if (await ghostreaderTab.isVisible().catch(() => false)) {
    await ghostreaderTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '06-library-inbox-ghostreader-tab.png') });
  }

  const infoTab = page.locator('button:has-text("Info")').first();
  if (await infoTab.isVisible().catch(() => false)) {
    await infoTab.click();
    await page.waitForTimeout(800);
  }

  const editMetaBtn = page.locator('button:has-text("Edit metadata")').first();
  if (await editMetaBtn.isVisible().catch(() => false)) {
    await editMetaBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '07-library-inbox-edit-metadata.png') });
    // Cancel or close edit metadata
    const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Done")').first();
    if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click();
  }

  // 4. Library Later & Archive
  await goAndSnap('/later', '08-library-later.png', 3000);
  await goAndSnap('/archive', '09-library-archive.png', 3000);

  // 5. Category Views under Library
  await goAndSnap('/filter/category%253Aarticle/split/triage_status/new', '10-category-articles.png', 3000);
  await goAndSnap('/filter/category%253Aepub/split/triage_status/new', '11-category-books.png', 3000);
  await goAndSnap('/filter/category%253Aemail/split/triage_status/new', '12-category-emails.png', 3000);
  await goAndSnap('/filter/category%253Apdf/split/triage_status/new', '13-category-pdfs.png', 3000);
  await goAndSnap('/filter/category%253Atweet/split/triage_status/new', '14-category-tweets.png', 3000);
  await goAndSnap('/filter/category%253Avideo/split/triage_status/new', '15-category-videos.png', 3000);
  await goAndSnap('/filter/category%253Apodcast/split/triage_status/new', '16-category-podcasts.png', 3000);

  // 6. Tags view
  await goAndSnap('/tags', '17-tags-view.png', 3000);

  // 7. Feed view (Unseen & Seen) and Manage Feeds
  await goAndSnap('/feed', '18-feed-unseen.png', 3500);
  const seenTab = page.locator('a:has-text("SEEN"), button:has-text("SEEN")').first();
  if (await seenTab.isVisible().catch(() => false)) {
    await seenTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '19-feed-seen.png') });
  }
  await goAndSnap('/feed/sources', '20-manage-feeds.png', 3500);

  // 8. Pinned Shortlist & Manage Views
  await goAndSnap('/filter/tag%253Ashortlist%2520AND%2520%28in%253Ainbox%2520OR%2520in%253Alater%29', '21-shortlist-view.png', 3000);
  await goAndSnap('/views', '22-manage-views.png', 3000);

  // 9. Trash view
  await goAndSnap('/trash', '23-trash-view.png', 3000);

  // 10. Search view (empty & with query)
  await goAndSnap('/search', '24-search-empty.png', 3000);
  const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="Search" i]').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill('Ghostreader');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, '25-search-results.png') });
  }

  await context.close();
  console.log('Finished capturing core views!');
})();
