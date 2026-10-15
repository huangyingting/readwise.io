const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const account = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'temp_account.json'), 'utf8'));
  const outDir = path.join(__dirname, '..', 'screenshots', '02-onboarding');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('Opening https://read.readwise.io to sign up...');
  await page.goto('https://read.readwise.io', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click "Don't have an account? Sign up"
  await page.click('text="Don\'t have an account? Sign up"');
  await page.waitForTimeout(600);
  await page.click('#show-email-signup');
  await page.waitForTimeout(600);

  await page.fill('#id_first_name', account.firstName);
  await page.fill('#id_email', account.email);
  await page.fill('#id_password1', account.password);
  await page.screenshot({ path: path.join(outDir, '01-signup-filled.png') });

  console.log('Submitting signup form...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => console.log('Nav warn:', e.message)),
    page.click('button:has-text("Sign Up")')
  ]);
  await page.waitForTimeout(5000);

  console.log('Post-signup URL:', page.url());
  console.log('Post-signup Title:', await page.title());
  await page.screenshot({ path: path.join(outDir, '02-post-signup-landing.png') });
  await page.screenshot({ path: path.join(outDir, '02-post-signup-landing-full.png'), fullPage: true });

  // Save storage state
  await context.storageState({ path: path.join(__dirname, '..', 'data', 'storage_state.json') });

  // Inspect current DOM elements
  const info = await page.evaluate(() => {
    return {
      url: location.href,
      title: document.title,
      bodyText: document.body.innerText.slice(0, 2000),
      buttons: Array.from(document.querySelectorAll('button, a, [role="button"], input')).map(el => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        type: el.getAttribute('type'),
        text: (el.innerText || el.value || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '').trim().slice(0, 100),
        href: el.getAttribute('href'),
        className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : ''
      })).filter(x => x.text || x.href)
    };
  });
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'post_signup_dom.json'), JSON.stringify(info, null, 2));
  console.log('Body text preview:\n', info.bodyText);

  await browser.close();
})();
