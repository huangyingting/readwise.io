const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots', '05-settings-modals-shortcuts');
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

  async function triggerButtonByText(textSubstr) {
    return await page.evaluate((sub) => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]')).filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth && (b.innerText || '').includes(sub);
      });
      if (!btns.length) return false;
      const btn = btns[0];
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
      btn.click();
      return true;
    }, textSubstr);
  }

  await page.goto('https://read.readwise.io/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4500);

  // Ensure right sidebar is open
  const hasInfo = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Info') && b.getBoundingClientRect().left > 900 && b.getBoundingClientRect().left < 1400)
  );
  if (!hasInfo) {
    await page.keyboard.press(']');
    await page.waitForTimeout(800);
  }

  // 12. Help menu (?) in bottom right corner
  console.log('12. Opening Help menu...');
  await triggerButtonByText('Help');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '12-help-support-menu.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 13a. View Options menu ("Library" header dropdown at x ~ 272, y ~ 0)
  console.log('13a. Opening View Options menu...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => {
      const r = b.getBoundingClientRect();
      return r.top < 70 && r.left > 240 && r.left < 400 && b.innerText.includes('Library');
    });
    if (btns[0]) {
      btns[0].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
      btns[0].click();
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '13a-library-view-options-menu.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 13b. Sort Options menu ("Date moved" dropdown at top right of list)
  console.log('13b. Opening Sort Options menu...');
  await triggerButtonByText('Date moved');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '13b-library-sort-options-menu.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 14. Document row More (...) menu (press 'm' on focused list item)
  console.log('14. Opening Document row More (m) menu...');
  await page.mouse.move(500, 120);
  await page.waitForTimeout(400);
  await page.keyboard.press('m');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '14-document-row-more-menu.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 15. Create Filtered View modal on /views
  console.log('15. Opening Add filtered view modal on /views...');
  await page.goto('https://read.readwise.io/views', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  await triggerButtonByText('Add filtered view');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '15-add-filtered-view-modal.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 16. Add Feed modal on /feed/sources
  console.log('16. Opening Add feed modal on /feed/sources...');
  await page.goto('https://read.readwise.io/feed/sources', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  await triggerButtonByText('Add feed');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '16-add-rss-feed-modal.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 17-20. Switch Interface Theme to Dark Mode and capture Dark Theme across Preferences, Library, Home, and Reader
  console.log('17-20. Switching to Dark Theme...');
  await page.goto('https://read.readwise.io/preferences', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  await triggerButtonByText('Dark theme');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '17-dark-theme-preferences.png') });

  await goAndSnap('/new', '18-dark-theme-library-inbox.png', 3500);
  await goAndSnap('/home', '19-dark-theme-home.png', 3500);
  await goAndSnap('/new/read/01m4zm0f2280b7zkvkpc2a1ry4', '20-dark-theme-reader-article.png', 4000);

  // Switch back to Light theme
  await page.goto('https://read.readwise.io/preferences', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  await triggerButtonByText('Light theme');
  await page.waitForTimeout(1000);

  // 21-22. Mobile responsive viewport (390x844)
  console.log('21-22. Capturing Mobile Responsive layouts (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await goAndSnap('/new', '21-mobile-responsive-library.png', 3500);
  await goAndSnap('/new/read/01m4zm0f2280b7zkvkpc2a1ry4', '22-mobile-responsive-reader.png', 4000);

  await page.setViewportSize({ width: 1440, height: 900 });
  await context.close();
  console.log('Finished 08b_finish_settings_and_modals!');
})();
