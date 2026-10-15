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

  console.log('Opening https://read.readwise.io/new ...');
  await page.goto('https://read.readwise.io/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Dump all sidebar/header links and buttons
  const navElements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button, [role="button"], [role="tab"], [role="menuitem"]')).map(el => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        title: el.getAttribute('title'),
        href: el.getAttribute('href'),
        text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height)
      };
    }).filter(e => e.w > 0 && e.h > 0);
  });

  fs.writeFileSync(path.join(__dirname, '..', 'data', 'main_nav_elements.json'), JSON.stringify(navElements, null, 2));
  console.log(`Discovered ${navElements.length} visible interactive elements on /new`);

  const hrefs = [...new Set(navElements.map(e => e.href).filter(Boolean))];
  console.log('Discovered hrefs:', hrefs);

  await context.close();
})();
