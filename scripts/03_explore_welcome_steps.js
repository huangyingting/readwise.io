const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots', '02-onboarding');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: path.join(__dirname, '..', 'data', 'storage_state.json')
  });
  const page = await context.newPage();

  console.log('Opening https://read.readwise.io/welcome ...');
  await page.goto('https://read.readwise.io/welcome', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  const stepsData = [];

  for (let step = 1; step <= 6; step++) {
    const url = page.url();
    const text = await page.evaluate(() => document.body.innerText);
    const buttons = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, a, [role="button"], input, select')).map(el => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        type: el.getAttribute('type'),
        text: (el.innerText || el.value || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '').trim().slice(0, 120),
        href: el.getAttribute('href')
      })).filter(x => x.text || x.href)
    );

    console.log(`=== Onboarding Step ${step} ===`);
    console.log('URL:', url);
    console.log('Text:\n', text.slice(0, 1000));
    console.log('Buttons:', JSON.stringify(buttons, null, 2));

    stepsData.push({ step, url, text, buttons });
    await page.screenshot({ path: path.join(outDir, `04-welcome-step-${step}.png`) });

    if (!url.includes('/welcome')) {
      console.log('Exited /welcome to:', url);
      break;
    }

    // Find the Continue / Next / Finish / Get started button
    const nextBtn = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Get started"), button:has-text("Finish"), button:has-text("Done"), button:has-text("Start")').first();
    if (await nextBtn.isVisible().catch(() => false)) {
      const btnText = await nextBtn.innerText();
      console.log(`Clicking "${btnText}"...`);
      await nextBtn.click();
      await page.waitForTimeout(4000);
    } else {
      console.log('No Continue button found, stopping loop.');
      break;
    }
  }

  fs.writeFileSync(path.join(__dirname, '..', 'data', 'welcome_steps.json'), JSON.stringify(stepsData, null, 2));
  await context.storageState({ path: path.join(__dirname, '..', 'data', 'storage_state.json') });
  await browser.close();
})();
