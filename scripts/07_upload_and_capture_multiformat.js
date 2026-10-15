const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots', '04-reader-detail');
  const profileDir = path.join(__dirname, '..', 'data', 'chrome-profile');
  fs.mkdirSync(outDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const page = context.pages()[0] || await context.newPage();

  console.log('Opening /new ...');
  await page.goto('https://read.readwise.io/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Ensure left sidebar is pinned open
  const homeX = await page.evaluate(() => {
    const a = document.querySelector('a[href="/home"]');
    return a ? a.getBoundingClientRect().x : -100;
  });
  console.log('Initial Home link x:', homeX);
  if (homeX < 0) {
    console.log('Pinning left sidebar open with [ ...');
    await page.keyboard.press('[');
    await page.waitForTimeout(800);
  }

  // 1. Click the '+' Add button in the left sidebar
  console.log('Clicking Add (+) button...');
  const addBtn = page.locator('button[class*="_addDropdownButton"]').first();
  await addBtn.click({ force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '18-add-menu-dropdown.png') });

  const addMenuItems = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="menuitem"], [role="menu"] button, [role="menu"] div, [data-radix-popper-content-wrapper] *'))
      .map(e => ({ tag: e.tagName, role: e.getAttribute('role'), text: (e.innerText || '').trim() }))
      .filter(x => x.text && x.text.length < 100)
  );
  console.log('Add menu items:', JSON.stringify(addMenuItems));

  // Click "Add URL" or first menu item
  const urlMenuItem = page.locator('[role="menuitem"]:has-text("URL"), [role="menuitem"]:has-text("Web"), [data-radix-popper-content-wrapper] :text-matches("URL|link|Save", "i")').first();
  if (await urlMenuItem.isVisible().catch(() => false)) {
    await urlMenuItem.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '19-add-url-modal.png') });
    const urlInput = page.locator('input[type="url"], input[type="text"], input[placeholder*="http" i], input[placeholder*="URL" i]').last();
    if (await urlInput.isVisible().catch(() => false)) {
      await urlInput.fill('https://www.youtube.com/watch?v=eJBtvfbcic0');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, '19b-add-url-filled.png') });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(6000);
    }
  } else {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Upload PDF and EPUB via the hidden <input type="file"> on the page!
  const fileInputs = await page.locator('input[type="file"]').count();
  console.log('File inputs count:', fileInputs);
  if (fileInputs > 0) {
    console.log('Uploading sample-paper.pdf and sample-book.epub...');
    await page.locator('input[type="file"]').first().setInputFiles([
      path.join(__dirname, '..', 'data', 'sample-paper.pdf'),
      path.join(__dirname, '..', 'data', 'sample-book.epub')
    ]);
    await page.waitForTimeout(10000);
    await page.screenshot({ path: path.join(outDir, '20-after-uploading-pdf-epub.png') });
  }

  // List all documents currently in /new
  await page.goto('https://read.readwise.io/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);
  const docLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/read/"]')).map(a => ({
      href: a.getAttribute('href'),
      text: (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 120)
    }))
  );
  console.log('Documents in /new:', JSON.stringify(docLinks, null, 2));

  await context.close();
})();
