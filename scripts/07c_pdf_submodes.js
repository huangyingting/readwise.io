const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots', '04-reader-detail');
  const profileDir = path.join(__dirname, '..', 'data', 'chrome-profile');

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const page = context.pages()[0] || await context.newPage();

  console.log('Opening PDF Document Reader...');
  await page.goto('https://read.readwise.io/new/read/01m4zmw2fytwq167qc36bfr9bn', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);

  // 1. PDF Zoom dropdown (x: 527, y: 33)
  console.log('1. Clicking PDF Zoom dropdown...');
  await page.mouse.click(527, 33);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '22a-reader-pdf-zoom-menu.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 2. PDF Snapshot / Area Highlight tool (x: 472, y: 33)
  console.log('2. Clicking PDF Snapshot / Area Highlight tool...');
  await page.mouse.click(472, 33);
  await page.waitForTimeout(600);
  // Drag a box over the PDF page
  await page.mouse.move(400, 260);
  await page.mouse.down();
  await page.mouse.move(850, 400, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(2500);
  // Open Notebook tab on right panel to show the captured area highlight image!
  const nbBtn = page.locator('button:has-text("Notebook")').first();
  if (await nbBtn.isVisible().catch(() => false)) {
    await nbBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(outDir, '22b-reader-pdf-area-highlight.png') });

  // 3. PDF Enhanced Text Mode (x: 392, y: 33)
  console.log('3. Clicking PDF Enhanced Text Mode toggle...');
  await page.mouse.click(392, 33);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '22c-reader-pdf-text-mode.png') });

  await context.close();
  console.log('Done PDF sub-modes!');
})();
