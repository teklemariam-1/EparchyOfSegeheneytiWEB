import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError, checkSkipNav, checkI18n } from './navigation.spec'

test.describe('Contact page (/contact)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
  })

  test('returns HTTP 200', async ({ request }) => {
    expect((await request.get('/contact')).status()).toBe(200)
  })

  test('renders without errors', async ({ page }) => {
    await checkNoError(page)
  })

  test('has layout (nav + footer)', async ({ page }) => {
    await checkLayout(page)
  })

  test('has a skip-nav link to #main-content', async ({ page }) => {
    await checkSkipNav(page)
  })

  test('html[lang] is "en" by default and language switcher is present', async ({ page }) => {
    await checkI18n(page)
  })

  test('has an h1 containing "Contact"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /Contact/i }),
    ).toBeVisible()
  })

  // ─── Form field rendering ────────────────────────────────────────────────

  test('renders the First Name input', async ({ page }) => {
    await expect(page.getByLabel(/First Name/i)).toBeVisible()
  })

  test('renders the Last Name input', async ({ page }) => {
    await expect(page.getByLabel(/Last Name/i)).toBeVisible()
  })

  test('renders the Email input', async ({ page }) => {
    await expect(page.getByLabel(/Email/i)).toBeVisible()
  })

  test('renders the Subject select', async ({ page }) => {
    await expect(page.getByLabel(/Subject/i)).toBeVisible()
  })

  test('renders the Message textarea', async ({ page }) => {
    await expect(page.getByLabel(/Message/i)).toBeVisible()
  })

  test('renders the Send Message button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Send Message/i }),
    ).toBeVisible()
  })

  // ─── Form submission behaviour ────────────────────────────────────────────

  test('submitting an empty form shows a validation error', async ({ page }) => {
    await page.getByRole('button', { name: /Send Message/i }).click()
    // The server action validates server-side; error banner should appear
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })

  test('submitting with an invalid email shows an error', async ({ page }) => {
    await page.getByLabel(/First Name/i).fill('Tesfai')
    await page.getByLabel(/Last Name/i).fill('Haile')
    await page.getByLabel(/Email/i).fill('not-an-email')
    await page.getByLabel(/Subject/i).selectOption({ index: 1 })
    await page.getByLabel(/Message/i).fill('This is a test message with enough characters.')
    await page.getByRole('button', { name: /Send Message/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('alert')).toContainText(/email/i)
  })

  // ─── Map embed ────────────────────────────────────────────────────────────

  test('embeds a Google Maps iframe', async ({ page }) => {
    const iframe = page.locator('iframe[src*="google.com/maps"]')
    await expect(iframe).toBeVisible()
  })
})
