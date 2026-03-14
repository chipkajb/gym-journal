import { test, expect } from "@playwright/test";

/**
 * Authentication flow E2E tests.
 * These tests verify the register → login → logout cycle.
 *
 * NOTE: These tests require a running app with a connected database.
 * In CI they run against a preview deployment; locally the playwright.config.ts
 * will start the dev server automatically.
 */

const TEST_EMAIL = `e2e-test-${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPassword123!";
const TEST_NAME = "E2E User";

test.describe("Authentication", () => {
  test("landing page renders sign-in and sign-up links", async ({ page }) => {
    await page.goto("/");
    // The root page should have sign-in / sign-up entry points
    await expect(page.getByRole("link", { name: /sign in|log in/i }).first()).toBeVisible();
  });

  test("register page renders the registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create account|sign up|register/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("login page renders the login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("unauthenticated users are redirected from protected routes", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test("registration → login → dashboard flow", async ({ page }) => {
    // Register
    await page.goto("/register");
    await page.getByLabel(/name/i).fill(TEST_NAME);
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /create account|sign up|register/i }).click();

    // After registration, app redirects to dashboard (or login)
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10_000 });

    // If we end up on login, sign in
    if (page.url().includes("/login")) {
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /sign in|log in/i }).click();
      await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    }

    // Dashboard should be accessible
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
