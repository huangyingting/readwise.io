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

  console.log('1. Opening Getting Started with Reader article...');
  await page.goto('https://read.readwise.io/new/read/01m4zm0f2280b7zkvkpc2a1ry4', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(outDir, '01-reader-article-3pane.png') });

  // 2. Appearance menu
  console.log('2. Opening Appearance menu...');
  const appBtn = page.locator('button:has-text("Appearance")').first();
  if (await appBtn.isVisible().catch(() => false)) {
    await appBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '02-reader-appearance-menu.png') });

    // Dump appearance menu buttons/options
    const appOptions = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, [role="button"], [role="menuitem"], label'))
        .map(e => ({ text: (e.innerText || '').trim(), rect: e.getBoundingClientRect() }))
        .filter(x => x.text && x.rect.width > 0 && x.rect.x > 250 && x.rect.x < 700 && x.rect.y < 600)
    );
    console.log('Appearance options:', JSON.stringify(appOptions));

    // Try clicking Dark theme inside Appearance menu
    const darkBtn = page.locator('button:has-text("Dark"), [role="button"]:has-text("Dark")').first();
    if (await darkBtn.isVisible().catch(() => false)) {
      await darkBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, '03-reader-dark-mode-appearance.png') });
      // Switch back to Light
      const lightBtn = page.locator('button:has-text("Light"), [role="button"]:has-text("Light")').first();
      if (await lightBtn.isVisible().catch(() => false)) {
        await lightBtn.click();
        await page.waitForTimeout(800);
      }
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 3. More (...) actions menu in top reader bar
  console.log('3. Opening More (...) actions menu...');
  await page.mouse.click(1008, 33);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '04-reader-more-actions-menu.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 4. Text selection floating toolbar
  console.log('4. Selecting text in article to reveal floating toolbar...');
  const selected = await page.evaluate(() => {
    const paras = Array.from(document.querySelectorAll('p')).filter(p => p.innerText.length > 80 && p.getBoundingClientRect().top > 150 && p.getBoundingClientRect().top < 600);
    if (!paras.length) return null;
    const p = paras[0];
    const range = document.createRange();
    const textNode = Array.from(p.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 20) || p.firstChild;
    if (!textNode) return null;
    range.setStart(textNode, 0);
    range.setEnd(textNode, Math.min(45, textNode.textContent.length));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const rect = range.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: sel.toString() };
  });
  console.log('Selected text:', selected);
  if (selected) {
    // Dispatch mouseup to trigger selection popup
    await page.mouse.move(selected.x, selected.y);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(1200);
  }
  // Or drag across paragraph text using mouse
  const paraBox = await page.evaluate(() => {
    const paras = Array.from(document.querySelectorAll('p')).filter(p => p.innerText.length > 80 && p.getBoundingClientRect().top > 180 && p.getBoundingClientRect().top < 550);
    if (!paras.length) return null;
    const r = paras[0].getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (paraBox) {
    await page.mouse.move(paraBox.x + 15, paraBox.y + 12);
    await page.mouse.down();
    await page.mouse.move(paraBox.x + 280, paraBox.y + 12, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '05-reader-text-selection-toolbar.png') });
  }

  // 5. Press 'h' to highlight the focused paragraph and 'n' to add a note
  console.log('5. Creating highlight and note...');
  await page.mouse.click(600, 350);
  await page.waitForTimeout(500);
  await page.keyboard.press('h');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '06-reader-paragraph-highlighted.png') });

  await page.keyboard.press('n');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '07-reader-add-note-inline.png') });
  await page.keyboard.type('Key insight: Readwise Reader unifies all reading workflows in one local-first web app.');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '08-reader-note-typed.png') });
  // Save note (Cmd/Ctrl+Enter or Save button)
  const saveNoteBtn = page.locator('button:has-text("Save")').first();
  if (await saveNoteBtn.isVisible().catch(() => false)) {
    await saveNoteBtn.click();
  } else {
    await page.keyboard.press('Control+Enter');
  }
  await page.waitForTimeout(1000);

  // 6. Switch right panel to Notebook tab to show our highlight & note
  console.log('6. Capturing Notebook tab with highlight and note...');
  const nbTab = page.locator('button:has-text("Notebook")').first();
  if (await nbTab.isVisible().catch(() => false)) {
    await nbTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '09-reader-notebook-panel-with-annotations.png') });
  }

  // 7. Invoke Ghostreader on focused paragraph (press 'G' or Shift+G)
  console.log('7. Invoking Ghostreader menu on paragraph (Shift+G)...');
  await page.mouse.click(600, 450);
  await page.waitForTimeout(500);
  await page.keyboard.press('Shift+G');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '10-reader-ghostreader-context-menu.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 8. In-document search bar (press '/')
  console.log('8. Opening in-document search...');
  await page.keyboard.press('Control+f');
  await page.waitForTimeout(800);
  await page.keyboard.type('Ghostreader');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '11-reader-in-document-search.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 9. Listen (Text-to-Speech) button
  console.log('9. Clicking Listen (Text-to-Speech)...');
  const listenBtn = page.locator('button:has-text("Listen")').first();
  if (await listenBtn.isVisible().catch(() => false)) {
    await listenBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, '12-reader-tts-audio-player.png') });
  }

  // 10. Distraction-free Zen mode (toggle left `[` and right `]` panels)
  console.log('10. Toggling left and right sidebars for Zen reading mode...');
  await page.keyboard.press('[');
  await page.waitForTimeout(500);
  await page.keyboard.press(']');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '13-reader-zen-focus-mode.png') });
  // Restore panels
  await page.keyboard.press('[');
  await page.keyboard.press(']');
  await page.waitForTimeout(500);

  await context.close();
  console.log('Finished 06_capture_reader_article_ui!');
})();
