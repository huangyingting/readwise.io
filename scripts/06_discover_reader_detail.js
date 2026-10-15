const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, '..', 'data', 'chrome-profile');
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const page = context.pages()[0] || await context.newPage();

  await page.goto('https://read.readwise.io/new/read/01m4zm0f2280b7zkvkpc2a1ry4', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  const elements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button, [role="button"], [role="tab"], [role="menuitem"]')).map(el => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        title: el.getAttribute('title'),
        href: el.getAttribute('href'),
        text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height)
      };
    }).filter(e => e.w > 0 && e.h > 0 && e.y < 900);
  });

  fs.writeFileSync(path.join(__dirname, '..', 'data', 'reader_detail_elements.json'), JSON.stringify(elements, null, 2));
  console.log(`Discovered ${elements.length} visible elements in Reader view.`);
  console.log(JSON.stringify(elements.filter(e => e.y < 120 || e.x < 300 || e.x > 1000), null, 2));

  await context.close();
})();
