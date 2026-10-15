const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const account = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'temp_account.json'), 'utf8'));
  const outDir = path.join(__dirname, '..', 'screenshots', '02-onboarding');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://readwise.io/accounts/signup/?next=/to_reader ...');
  await page.goto('https://readwise.io/accounts/signup/?next=/to_reader', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  await page.fill('#id_first_name', account.firstName);
  await page.fill('#id_email', account.email);
  await page.fill('#id_password1', account.password);
  await page.screenshot({ path: path.join(outDir, '01-signup-form-turnstile-prompt.png') });

  const cfRect = await page.evaluate(() => document.querySelector('.cf-turnstile')?.getBoundingClientRect());
  if (cfRect && cfRect.height > 0) {
    await page.mouse.move(cfRect.x + 30, cfRect.y + 35, { steps: 15 });
    await page.waitForTimeout(200);
    await page.mouse.click(cfRect.x + 30, cfRect.y + 35);
  }

  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(1000);
    const val = await page.evaluate(() => document.querySelector('input[name="cf-turnstile-response"]')?.value || '');
    console.log(`Turnstile check ${i}: token length = ${val.length}`);
    if (val.length > 0) break;
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '02-signup-form-turnstile-verified.png') });

  console.log('2. Submitting signup form...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => console.log('Nav warn:', e.message)),
    page.click('#signup-form button[type="submit"]')
  ]);
  await page.waitForTimeout(6000);

  console.log('Post-signup URL:', page.url());
  console.log('Post-signup Title:', await page.title());
  await page.screenshot({ path: path.join(outDir, '03-post-signup-initial.png') });
  await page.screenshot({ path: path.join(outDir, '03-post-signup-initial-full.png'), fullPage: true });

  // Save authenticated storage state
  await context.storageState({ path: path.join(__dirname, '..', 'data', 'storage_state.json') });

  const domSummary = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    text: document.body.innerText.slice(0, 4000),
    elements: Array.from(document.querySelectorAll('a, button, [role="button"], input, h1, h2, h3')).map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      type: el.getAttribute('type'),
      text: (el.innerText || el.value || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '').trim().slice(0, 120),
      href: el.getAttribute('href')
    })).filter(x => x.text || x.href)
  }));
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'post_signup_dom.json'), JSON.stringify(domSummary, null, 2));
  console.log('DOM Text Preview:\n', domSummary.text);

  await browser.close();
})();
