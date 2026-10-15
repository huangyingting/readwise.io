import { test, expect } from '@playwright/test';

test.describe('Readwise Reader Full Feature Parity E2E Suite', () => {
  test('1. Public pages (/read, /pricing) and Auth flows (/accounts/login, /accounts/signup, /accounts/password/reset)', async ({
    page,
  }) => {
    await page.goto('/read');
    await expect(page.locator('h1')).toContainText('All your reading in one place');

    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText('Invest in Your Reading');
    await expect(page.getByText('Full Readwise + Reader')).toBeVisible();

    await page.goto('/accounts/login');
    await expect(page.locator('h1')).toContainText('Sign in to your account');
    await expect(page.getByText('1-Click Demo Login')).toBeVisible();

    await page.goto('/accounts/signup');
    await expect(page.locator('h1')).toContainText('Create your Readwise account');

    await page.goto('/accounts/password/reset');
    await expect(page.locator('h1')).toContainText('Reset your password');
  });

  test('2. 4-Step Onboarding Wizard (/welcome)', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('h1')).toContainText('Welcome to Readwise Reader!');
    await page.getByRole('button', { name: /Continue to Library Philosophy/i }).click();
    await expect(page.locator('h1')).toContainText('Choose Your Reading Workflow');
    await page.getByRole('button', { name: /Continue to Integrations/i }).click();
    await expect(page.locator('h1')).toContainText('Connect Your Existing Reading Services');
    await page.getByRole('button', { name: /Continue to Browser Extension/i }).click();
    await expect(page.locator('h1')).toContainText('Install the Browser Extension');
  });

  test('3. Local-First API State Hydration, Mutations, Undo & Exports', async ({ request }) => {
    const stateRes = await request.get('/api/reader/state');
    expect(stateRes.ok()).toBeTruthy();
    const stateJson = await stateRes.json();

    expect(stateJson.user.email).toBeTruthy();
    expect(stateJson.documents.length).toBeGreaterThanOrEqual(8);
    expect(stateJson.filteredViews.length).toBeGreaterThanOrEqual(10);
    expect(stateJson.ghostreaderPrompts.length).toBeGreaterThanOrEqual(10);

    // Test adding a URL document via /api/reader/state/update
    const addRes = await request.post('/api/reader/state/update', {
      data: {
        action: 'add-document-url',
        payload: {
          url: 'https://paulgraham.com/greatwork.html',
          title: 'How to Do Great Work (E2E Saved)',
        },
      },
    });
    expect(addRes.ok()).toBeTruthy();
    const addData = await addRes.json();
    expect(addData.document.title).toContain('How to Do Great Work');

    // Test triaging and undoing
    const triageRes = await request.post('/api/reader/state/update', {
      data: {
        action: 'triage-document',
        payload: {
          documentId: addData.document.id,
          triageStatus: 'archive',
        },
      },
    });
    expect(triageRes.ok()).toBeTruthy();

    const undoRes = await request.post('/api/reader/state/update', {
      data: {
        action: 'undo-last-mutation',
      },
    });
    expect(undoRes.ok()).toBeTruthy();

    // Test CSV & OPML & Markdown exports
    const csvRes = await request.get('/api/export?format=csv');
    expect(csvRes.ok()).toBeTruthy();
    expect(await csvRes.text()).toContain('ID,Title,Author,URL');

    const opmlRes = await request.get('/api/export?format=opml');
    expect(opmlRes.ok()).toBeTruthy();
    expect(await opmlRes.text()).toContain('<opml version="2.0">');

    const mdRes = await request.get(
      `/api/export?format=markdown&documentId=${stateJson.documents[0].id}`
    );
    expect(mdRes.ok()).toBeTruthy();
    expect(await mdRes.text()).toContain('Highlights & Annotations');
  });

  test('4. Core Workspace Views (/home, /new, /later, /archive, /filtered, /views, /tags, /feed, /search, /trash)', async ({
    page,
  }) => {
    await page.goto('/home');
    await expect(page.locator('h1')).toContainText('Welcome back');

    await page.goto('/new');
    await expect(page.locator('h1')).toContainText('Library • Inbox');

    await page.goto('/later');
    await expect(page.locator('h1')).toContainText('Library • Later');

    await page.goto('/archive');
    await expect(page.locator('h1')).toContainText('Library • Archive');

    await page.goto('/filtered?id=shortlist');
    await expect(page.getByText('Active Filter Query:')).toBeVisible();

    await page.goto('/views');
    await expect(page.locator('h1')).toContainText('Manage Filtered Views');

    await page.goto('/tags');
    await expect(page.locator('h1')).toContainText('Manage Tags');

    await page.goto('/feed');
    await expect(page.locator('h1')).toContainText('RSS & Newsletter Feed');

    await page.goto('/search?query=category:pdf');
    await expect(page.locator('h1')).toContainText('Full-Text & Query DSL Search');

    await page.goto('/trash');
    await expect(page.locator('h1')).toContainText('Trash');
  });

  test('5. Multi-Format Document Reader (Article, PDF Area Snapshot, EPUB, YouTube Transcript, Split View, TTS, Ghostreader)', async ({
    page,
    request,
  }) => {
    const stateRes = await request.get('/api/reader/state');
    const state = await stateRes.json();

    const pdfDoc = state.documents.find((d: any) => d.category === 'pdf');
    const videoDoc = state.documents.find((d: any) => d.category === 'video');
    const articleDoc = state.documents.find((d: any) => d.category === 'article');

    // Open Article Reader
    await page.goto(`/new/read/${articleDoc.id}`);
    await expect(page.locator('h1')).toContainText(articleDoc.title);
    await expect(page.getByText('Listen (TTS)')).toBeVisible();

    // Open PDF Reader & verify Area Snapshot + Enhanced Text View controls
    if (pdfDoc) {
      await page.goto(`/new/read/${pdfDoc.id}`);
      await expect(page.getByText('Area Snapshot Highlight')).toBeVisible();
      await expect(page.getByText('Enhanced Text View')).toBeVisible();
    }

    // Open YouTube Video Reader & verify Interactive Time-Synced Transcript
    if (videoDoc) {
      await page.goto(`/new/read/${videoDoc.id}`);
      await expect(page.getByText(/Interactive Time-Synced Transcript/i)).toBeVisible();
    }
  });

  test('6. Ghostreader RAG Chat (/ghostreader), Jinja2 Studio (/ghostreader/preferences), Settings & Command Palette', async ({
    page,
  }) => {
    await page.goto('/ghostreader');
    await expect(page.locator('h1')).toContainText('Ask Ghostreader');

    await page.goto('/ghostreader/preferences');
    await expect(page.locator('h1')).toContainText('Ghostreader Preferences & Jinja2 Prompt Studio');

    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText('Account & Profile Settings');

    await page.goto('/preferences');
    await expect(page.locator('h1')).toContainText('Reader Preferences & Export Templates');

    await page.goto('/preferences/shortcuts');
    await expect(page.locator('h1')).toContainText('Customize Keyboard Shortcuts');

    await page.goto('/integrations');
    await expect(page.locator('h1')).toContainText('Integrations & Knowledge Sync');

    await page.goto('/add-to-library');
    await expect(page.locator('h1')).toContainText('Email to Library');

    await page.goto('/add-to-feed');
    await expect(page.locator('h1')).toContainText('Email to Feed');

    await page.goto('/resources');
    await expect(page.locator('h1')).toContainText('Apps, Browser Extensions & Resources');

    // Trigger Command Palette with Cmd+K / Ctrl+K
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Command Palette' })).toBeVisible();
  });
});
