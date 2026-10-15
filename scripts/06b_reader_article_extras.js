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

  console.log('Opening Getting Started with Reader article...');
  await page.goto('https://read.readwise.io/new/read/01m4zm0f2280b7zkvkpc2a1ry4', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Ensure both left and right panels are open first
  const ensurePanels = async (wantLeft, wantRight) => {
    const state = await page.evaluate(() => {
      const hasLeft = Array.from(document.querySelectorAll('a')).some(a => a.innerText.includes('Keyboard shortcuts') && a.getBoundingClientRect().width > 0);
      const hasRight = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Notebook') && b.getBoundingClientRect().width > 0);
      return { hasLeft, hasRight };
    });
    if (state.hasLeft !== wantLeft) {
      await page.keyboard.press('[');
      await page.waitForTimeout(600);
    }
    if (state.hasRight !== wantRight) {
      await page.keyboard.press(']');
      await page.waitForTimeout(600);
    }
  };

  await ensurePanels(true, true);

  // 9. Notebook tab with annotations + Export menu
  console.log('Capturing Notebook tab and Export menu...');
  const nbBtn = page.locator('button:has-text("Notebook")').first();
  if (await nbBtn.isVisible().catch(() => false)) {
    await nbBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '09-reader-notebook-panel-with-annotations.png') });

    const expBtn = page.locator('button:has-text("Export")').first();
    if (await expBtn.isVisible().catch(() => false)) {
      await expBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, '09b-reader-notebook-export-menu.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  // 11. In-document search ('/')
  console.log('Capturing in-document search (/)...');
  await page.mouse.click(600, 300);
  await page.waitForTimeout(300);
  await page.keyboard.press('/');
  await page.waitForTimeout(800);
  await page.keyboard.type('Ghostreader');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '11-reader-in-document-search.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // 12. Listen (Text-to-Speech) button at top of article
  console.log('Capturing Listen (TTS) player...');
  await page.evaluate(() => {
    document.querySelectorAll('div').forEach(d => { if (d.scrollTop > 0) d.scrollTop = 0; });
  });
  await page.waitForTimeout(800);
  const listenBtn = page.locator('button:has-text("Listen")').first();
  if (await listenBtn.isVisible().catch(() => false)) {
    await listenBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '12-reader-tts-audio-player.png') });
    // Pause or close TTS if playing
    await page.keyboard.press('Escape');
  }

  // 13. Zen Focus Mode (both panels hidden)
  console.log('Capturing Zen Focus Mode (both panels hidden)...');
  await ensurePanels(false, false);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '13-reader-zen-focus-mode.png') });
  await ensurePanels(true, true);

  // 14. Floating text selection toolbar
  console.log('Capturing floating text selection toolbar...');
  const selCoords = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const txt = node.textContent.trim();
      if (txt.length > 60 && node.parentElement) {
        const r = node.parentElement.getBoundingClientRect();
        if (r.left > 300 && r.right < 1000 && r.top > 220 && r.top < 500) {
          return { x: r.left + 20, y: r.top + 10, endX: Math.min(r.right - 20, r.left + 220), text: txt.slice(0, 60) };
        }
      }
    }
    return null;
  });
  console.log('Selection target:', selCoords);
  if (selCoords) {
    await page.mouse.move(selCoords.x, selCoords.y);
    await page.mouse.down();
    await page.mouse.move(selCoords.endX, selCoords.y, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '14-reader-floating-selection-toolbar.png') });
  }

  // 15. Tag highlight popup ('t' on highlighted paragraph)
  console.log('Capturing Tag Highlight popup (t)...');
  await page.mouse.click(600, 350);
  await page.waitForTimeout(400);
  await page.keyboard.press('t');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '15-reader-tag-highlight-popup.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 16. Tag document popup ('Shift+T')
  console.log('Capturing Tag Document popup (Shift+T)...');
  await page.keyboard.press('Shift+T');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '16-reader-tag-document-popup.png') });
  await page.keyboard.type('onboarding');
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 17. Share menu ('Shift+S' or via More -> Share)
  console.log('Capturing Share menu...');
  await page.mouse.click(1008, 33);
  await page.waitForTimeout(600);
  const shareItem = page.locator('text="Share"').first();
  if (await shareItem.isVisible().catch(() => false)) {
    await shareItem.hover();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '17-reader-share-submenu.png') });
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 18. Appearance -> Typeface dropdown & Paged scroll mode
  console.log('Capturing Typeface dropdown and Paged scroll mode...');
  const appBtn = page.locator('button:has-text("Appearance")').first();
  if (await appBtn.isVisible().catch(() => false)) {
    await appBtn.click();
    await page.waitForTimeout(800);
    const typefaceBtn = page.locator('text="Default (Sans-serif)"').first();
    if (await typefaceBtn.isVisible().catch(() => false)) {
      await typefaceBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outDir, '18-reader-typeface-dropdown.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  await context.close();
  console.log('Finished 06b_reader_article_extras!');
})();
