const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots', '02-onboarding');
  const apiDir = path.join(__dirname, '..', 'data', 'api-samples');
  const profileDir = path.join(__dirname, '..', 'data', 'chrome-profile');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(apiDir, { recursive: true });

  // First copy cookies from storage_state.json into our persistent context
  const storageState = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'storage_state.json'), 'utf8'));

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  await context.addCookies(storageState.cookies);
  const page = context.pages()[0] || await context.newPage();

  // Capture API responses for reverse-engineering documentation
  page.on('response', async (res) => {
    try {
      const url = res.url();
      if (url.includes('/reader/api/profile_details')) {
        fs.writeFileSync(path.join(apiDir, 'profile_details.json'), JSON.stringify(await res.json(), null, 2));
      } else if (url.includes('/reader/api/default_prompts')) {
        fs.writeFileSync(path.join(apiDir, 'default_prompts.json'), JSON.stringify(await res.json(), null, 2));
      } else if (url.includes('/reader/api/documents/content')) {
        fs.writeFileSync(path.join(apiDir, 'documents_content.json'), JSON.stringify(await res.json(), null, 2));
      } else if (url.includes('/reader/api/state/?') && !url.includes('filter%5Bupdated_at')) {
        const body = await res.text();
        fs.writeFileSync(path.join(apiDir, 'initial_state.txt'), body.slice(0, 200000));
      }
    } catch (e) {}
  });

  // 1. Check Instapaper Connect modal on /welcome
  console.log('Visiting /welcome to check Instapaper Connect button...');
  await page.goto('https://read.readwise.io/welcome', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  // Navigate to /welcome/ready and click "Start reading"
  console.log('Navigating to /welcome/ready and clicking Start reading...');
  await page.goto('https://read.readwise.io/welcome/ready', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  await page.click('button:has-text("Start reading")');
  await page.waitForTimeout(6000);

  console.log('Landed on main app URL:', page.url());
  await page.screenshot({ path: path.join(outDir, '05-post-onboarding-reader-new.png') });

  await context.storageState({ path: path.join(__dirname, '..', 'data', 'storage_state.json') });
  await context.close();
})();
