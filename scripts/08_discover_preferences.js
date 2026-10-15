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

  await page.goto('https://read.readwise.io/preferences', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const info = await page.evaluate(() => ({
    url: location.href,
    text: document.body.innerText,
    elements: Array.from(document.querySelectorAll('a, button, [role="tab"], [role="button"], input, select')).map(el => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        role: el.getAttribute('role'),
        href: el.getAttribute('href'),
        text: (el.innerText || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height)
      };
    }).filter(e => e.w > 0 && e.h > 0)
  }));

  fs.writeFileSync(path.join(__dirname, '..', 'data', 'preferences_dom.json'), JSON.stringify(info, null, 2));
  console.log('Preferences text:\n', info.text);
  console.log('Preferences elements:', JSON.stringify(info.elements.filter(e => e.x > 220), null, 2));

  await context.close();
})();
