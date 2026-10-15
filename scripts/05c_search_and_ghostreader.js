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

  // 1. Search with query
  console.log('1. Capturing /search with query...');
  await page.goto('https://read.readwise.io/search', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  const searchBox = page.locator('input[placeholder="Search your Library..."]');
  await searchBox.fill('Ghostreader');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(outDir, '25-search-results.png') });

  // 2. Suggested feeds (/feed/suggestions)
  console.log('2. Capturing /feed/suggestions...');
  await page.goto('https://read.readwise.io/feed/suggestions', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outDir, '27-manage-feeds-suggested.png') });

  // 3. Ghostreader UI combinations (/ghostreader)
  console.log('3. Capturing /ghostreader UI combinations...');
  await page.goto('https://read.readwise.io/ghostreader', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);

  // Click "Fast" mode selector
  const fastBtn = page.locator('button:has-text("Fast")').first();
  if (await fastBtn.isVisible().catch(() => false)) {
    await fastBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '28-ghostreader-mode-selector.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Click "Recommend" chip
  const recChip = page.locator('button:has-text("Recommend")').first();
  if (await recChip.isVisible().catch(() => false)) {
    await recChip.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '29-ghostreader-recommend-prompts.png') });
  }

  // Click "Menu" chat history drawer
  const menuBtn = page.locator('button:has-text("Menu")').first();
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '30-ghostreader-history-drawer.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Send a prompt to Ghostreader
  const textarea = page.locator('textarea[placeholder="Ask anything..."]');
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill('What are the main features of Readwise Reader described in my library?');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Send")');
    console.log('Waiting for Ghostreader response...');
    await page.waitForTimeout(12000);
    await page.screenshot({ path: path.join(outDir, '31-ghostreader-active-chat.png') });
  }

  await context.close();
  console.log('Finished 05c_search_and_ghostreader!');
})();
