import { test, expect } from '@playwright/test';

test.describe('major page endpoints', () => {
  test('home page renders and links to verification', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /The Connection — Web/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Verify Email/i })).toBeVisible();
  });

  test('verify email shows resend flow when token is missing', async ({ page }) => {
    await page.goto('/verify-email');

    await expect(page.getByRole('heading', { level: 2, name: /Email Verification/i })).toBeVisible();
    await expect(page.getByText('No token provided in URL')).toBeVisible();
    await expect(page.getByLabel('Email to resend verification:')).toBeVisible();
  });

  test('verify email completes when token is accepted', async ({ page }) => {
    await page.route('**/api/auth/verify-email', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    );

    await page.goto('/verify-email?token=fake-token');

    await expect(page.getByText('Your email has been verified. Redirecting...')).toBeVisible();
    await page.waitForURL('**/');
    await expect(page.getByRole('heading', { level: 1, name: /The Connection — Web/i })).toBeVisible();
  });
});
