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

  // 19. Feed Seen tab (/feed/seen)
  await goAndSnap('/feed/seen', '19-feed-seen.png', 3000);

  // 20. Manage feeds (/feed/sources)
  await goAndSnap('/feed/sources', '20-manage-feeds.png', 3500);

  // Check tabs on /feed/sources
  const feedTabs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a, button, [role="tab"]'))
      .map(el => ({ text: (el.innerText || '').trim(), href: el.getAttribute('href') }))
      .filter(x => x.text)
  );
  console.log('Manage feeds buttons/tabs:', JSON.stringify(feedTabs.slice(0, 30)));

  // 21. Shortlist view
  await goAndSnap('/filter/tag%253Ashortlist%2520AND%2520%28in%253Ainbox%2520OR%2520in%253Alater%29', '21-shortlist-view.png', 3000);

  // 22. Manage views (/views)
  await goAndSnap('/views', '22-manage-views.png', 3000);

  // 23. Trash view (/trash)
  await goAndSnap('/trash', '23-trash-view.png', 3000);

  // 24 & 25. Search view (/search)
  await goAndSnap('/search', '24-search-empty.png', 3000);
  const searchInput = page.locator('input').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill('Ghostreader');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, '25-search-results.png') });
  }

  // 26. Home Configure dropdown/modal
  await page.goto('https://read.readwise.io/home', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  const configBtn = page.locator('button:has-text("Configure")').first();
  if (await configBtn.isVisible().catch(() => false)) {
    await configBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '26-home-configure-menu.png') });
  }

  // 27. Ghostreader active chat (/ghostreader)
  await page.goto('https://read.readwise.io/ghostreader', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  const starterChip = page.locator('button:has-text("Recommend what I should read next")').first();
  if (await starterChip.isVisible().catch(() => false)) {
    console.log('Clicking Ghostreader starter chip...');
    await starterChip.click();
    await page.waitForTimeout(10000);
    await page.screenshot({ path: path.join(outDir, '27-ghostreader-active-chat.png') });
  }

  await context.close();
  console.log('Done 05b_finish_core_views!');
})();
