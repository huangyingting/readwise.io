const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const outDir = path.join(__dirname, '..', 'screenshots', '01-public-auth');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Navigating to https://read.readwise.io ...');
  await page.goto('https://read.readwise.io', { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('goto warn:', e.message));
  await page.waitForTimeout(3000);

  console.log('Final URL:', page.url());
  console.log('Title:', await page.title());

  await page.screenshot({ path: path.join(outDir, '01-initial-redirect.png'), fullPage: false });
  await page.screenshot({ path: path.join(outDir, '01-initial-redirect-full.png'), fullPage: true });

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button, input')).map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      id: el.id,
      text: (el.innerText || el.value || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '').trim().slice(0, 100),
      href: el.getAttribute('href')
    }));
  });
  console.log('Interactive elements:', JSON.stringify(links, null, 2));

  await browser.close();
})();
