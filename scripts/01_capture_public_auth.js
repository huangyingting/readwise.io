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

  // 1. Redirect from https://read.readwise.io -> Login page
  console.log('1. Capturing login page from https://read.readwise.io...');
  await page.goto('https://read.readwise.io', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '01-login-page.png') });

  // 2. Click "Don't have an account? Sign up"
  console.log('2. Capturing signup options card...');
  const signupToggle = page.locator('text="Don\'t have an account? Sign up"');
  if (await signupToggle.isVisible()) {
    await signupToggle.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '02-signup-options-card.png') });
  }

  // 3. Click "Sign up with Email"
  console.log('3. Capturing signup with email form...');
  const emailSignupBtn = page.locator('#show-email-signup');
  if (await emailSignupBtn.isVisible()) {
    await emailSignupBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '03-signup-email-form.png') });
  }

  // 4. Direct /accounts/signup/ page
  console.log('4. Capturing direct /accounts/signup/ page...');
  await page.goto('https://readwise.io/accounts/signup/?next=/to_reader', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '04-direct-signup-page.png') });

  // 5. Forgot password page
  console.log('5. Capturing forgot password page...');
  await page.goto('https://readwise.io/accounts/password/reset/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '05-password-reset-page.png') });

  // 6. Login error state
  console.log('6. Capturing login error state...');
  await page.goto('https://readwise.io/accounts/login/?next=/to_reader', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.fill('#id_login', 'nonexistent_test_user@example.com');
  await page.fill('#id_password', 'WrongPassword123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.click('button:has-text("Sign in with Email")')
  ]);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '06-login-error-state.png') });

  // 7. Readwise Reader landing page (https://readwise.io/read)
  console.log('7. Capturing Readwise Reader product landing page...');
  await page.goto('https://readwise.io/read', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outDir, '07-reader-landing-hero.png') });
  await page.screenshot({ path: path.join(outDir, '07-reader-landing-full.png'), fullPage: true });

  // 8. Pricing page
  console.log('8. Capturing pricing page...');
  await page.goto('https://readwise.io/pricing', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(outDir, '08-pricing-page.png'), fullPage: true });

  await browser.close();
  console.log('Done capturing public/auth pages!');
})();
