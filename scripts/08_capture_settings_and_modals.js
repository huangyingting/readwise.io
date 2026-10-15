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

  // 1. Profile settings (/profile)
  await goAndSnap('/profile', '01-profile-settings.png', 3500);

  // 2. Preferences (/preferences)
  await goAndSnap('/preferences', '02-preferences-general.png', 3500);

  // 3. Click "Triage" button in Library configuration on /preferences
  const triageBtn = page.locator('button:has-text("Triage")').first();
  if (await triageBtn.isVisible().catch(() => false)) {
    await triageBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '03-preferences-library-workflow-modal.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 4. Keyboard shortcuts customization (/preferences/shortcuts)
  await goAndSnap('/preferences/shortcuts', '04-preferences-keyboard-shortcuts.png', 3500);
  await page.evaluate(() => {
    document.querySelectorAll('div').forEach(el => {
      if (el.scrollHeight > el.clientHeight + 100 && el.clientWidth > 400) el.scrollTop = 600;
    });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '04b-preferences-keyboard-shortcuts-scrolled.png') });

  // 5. Integrations (/integrations)
  await goAndSnap('/integrations', '05-integrations-page.png', 3500);
  await page.evaluate(() => {
    document.querySelectorAll('div').forEach(el => {
      if (el.scrollHeight > el.clientHeight + 100 && el.clientWidth > 400) el.scrollTop = 600;
    });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '05b-integrations-scrolled.png') });

  // 6. Ghostreader Preferences (/ghostreader/preferences)
  await goAndSnap('/ghostreader/preferences', '06-ghostreader-preferences.png', 3500);
  // Click "Edit" or first customizable prompt to show the Jinja2 prompt editor modal
  const editPromptBtn = page.locator('button:has-text("Edit"), [role="button"]:has-text("Summarize the document")').first();
  if (await editPromptBtn.isVisible().catch(() => false)) {
    await editPromptBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '06b-ghostreader-prompt-editor.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 7. Product Emails (/product-emails)
  await goAndSnap('/product-emails', '07-product-emails-settings.png', 3000);

  // 8. Add to Library (/add-to-library)
  await goAndSnap('/add-to-library', '08-add-to-library-page.png', 3000);

  // 9. Add to Feed (/add-to-feed)
  await goAndSnap('/add-to-feed', '09-add-to-feed-page.png', 3000);

  // 10. Resources (/resources)
  await goAndSnap('/resources', '10-resources-page.png', 3000);

  // 11. Command Palette (Cmd+K / Ctrl+K) on /new
  await page.goto('https://read.readwise.io/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  console.log('Opening Command Palette (Control+k)...');
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '11-command-palette-cmd-k.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 12. Help menu (?) in bottom right corner
  console.log('Opening Help menu...');
  const helpBtn = page.locator('button:has-text("Help")').last();
  if (await helpBtn.isVisible().catch(() => false)) {
    await helpBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '12-help-support-menu.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 13. View Options dropdown ("Library down" at top-left of center pane) & Sort dropdown ("Date moved down")
  console.log('Opening View Options and Sort menus on /new...');
  const viewMenuBtn = page.locator('button:has-text("Library")').first();
  if (await viewMenuBtn.isVisible().catch(() => false)) {
    await viewMenuBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '13a-library-view-options-menu.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  const sortMenuBtn = page.locator('button:has-text("Date moved")').first();
  if (await sortMenuBtn.isVisible().catch(() => false)) {
    await sortMenuBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '13b-library-sort-options-menu.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 14. Document row More (...) menu on /new
  console.log('Opening document row More (...) menu on /new...');
  const rowMoreBtn = page.locator('button:has-text("More")').first();
  if (await rowMoreBtn.isVisible().catch(() => false)) {
    await rowMoreBtn.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '14-document-row-more-menu.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 15. Create Filtered View modal on /views
  console.log('Opening Add filtered view modal on /views...');
  await page.goto('https://read.readwise.io/views', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  const addViewBtn = page.locator('button:has-text("Add filtered view")').first();
  if (await addViewBtn.isVisible().catch(() => false)) {
    await addViewBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '15-add-filtered-view-modal.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 16. Add Feed modal on /feed/sources
  console.log('Opening Add feed modal on /feed/sources...');
  await page.goto('https://read.readwise.io/feed/sources', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  const addFeedBtn = page.locator('button:has-text("Add feed")').first();
  if (await addFeedBtn.isVisible().catch(() => false)) {
    await addFeedBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '16-add-rss-feed-modal.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 17-19. Switch Interface Theme to Dark Mode and capture Dark Theme across Preferences, Library, Home, and Reader
  console.log('Switching to Dark Theme...');
  await page.goto('https://read.readwise.io/preferences', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  const darkThemeBtn = page.locator('button:has-text("Dark theme")').first();
  if (await darkThemeBtn.isVisible().catch(() => false)) {
    await darkThemeBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '17-dark-theme-preferences.png') });

    await goAndSnap('/new', '18-dark-theme-library-inbox.png', 3500);
    await goAndSnap('/home', '19-dark-theme-home.png', 3500);
    await goAndSnap('/new/read/01m4zm0f2280b7zkvkpc2a1ry4', '20-dark-theme-reader-article.png', 4000);

    // Switch back to Light theme
    await page.goto('https://read.readwise.io/preferences', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    const lightThemeBtn = page.locator('button:has-text("Light theme")').first();
    if (await lightThemeBtn.isVisible().catch(() => false)) {
      await lightThemeBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  // 21-22. Mobile responsive viewport (390x844)
  console.log('Capturing Mobile Responsive layouts (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await goAndSnap('/new', '21-mobile-responsive-library.png', 3500);
  await goAndSnap('/new/read/01m4zm0f2280b7zkvkpc2a1ry4', '22-mobile-responsive-reader.png', 4000);

  await page.setViewportSize({ width: 1440, height: 900 });
  await context.close();
  console.log('Finished 08_capture_settings_and_modals!');
})();
