const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots', '05-settings-modals-shortcuts');
  const profileDir = path.join(__dirname, '..', 'data', 'chrome-profile');

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const page = context.pages()[0] || await context.newPage();

  async function openLibraryViewMenu() {
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
    await page.waitForTimeout(800);
  }

  await page.goto('https://read.readwise.io/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4500);

  // 23. Switch Library view to "Feed" layout
  console.log('23. Switching Library to Feed layout...');
  await openLibraryViewMenu();
  const feedOption = page.locator('[role="menuitem"]:has-text("Feed"), [role="option"]:has-text("Feed"), div[role="menu"] button:has-text("Feed"), div[role="menu"] div:has-text("Feed")').first();
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [data-radix-collection-item]'));
    const f = items.find(el => (el.innerText || '').trim() === 'Feed');
    if (f) f.click();
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '23-library-feed-layout-view.png') });

  // 24. Switch Library view to "Grid" layout
  console.log('24. Switching Library to Grid layout...');
  await openLibraryViewMenu();
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [data-radix-collection-item]'));
    const g = items.find(el => (el.innerText || '').trim() === 'Grid');
    if (g) g.click();
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '24-library-grid-layout-view.png') });

  // Switch back to "List" layout
  await openLibraryViewMenu();
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [data-radix-collection-item]'));
    const l = items.find(el => (el.innerText || '').trim() === 'List');
    if (l) l.click();
  });
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 25. Trigger Bulk Actions bar (Shift+B)
  console.log('25. Opening Bulk Actions bar (Shift+B)...');
  await page.keyboard.press('Shift+B');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '25-library-bulk-actions-modal.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 26. Open in Split View (from Document Row More menu)
  console.log('26. Opening Split View...');
  await page.mouse.move(500, 120);
  await page.waitForTimeout(400);
  await page.keyboard.press('m');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"], [data-radix-collection-item]'));
    const split = items.find(el => (el.innerText || '').includes('Open in split view'));
    if (split) split.click();
  });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(outDir, '26-reader-split-view-dual-pane.png') });

  // 27. Custom Ghostreader Prompt Editor Modal (/ghostreader/preferences -> Create custom prompt)
  console.log('27. Opening Create Custom Ghostreader Prompt modal...');
  await page.goto('https://read.readwise.io/ghostreader/preferences', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Create custom prompt'));
    if (btn) {
      btn.scrollIntoView();
      btn.click();
    }
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '27-custom-ghostreader-prompt-modal.png') });
  await page.keyboard.press('Escape');

  await context.close();
  console.log('Finished 08c_extra_ui_combinations!');
})();
