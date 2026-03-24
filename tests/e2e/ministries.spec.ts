import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError } from './navigation.spec'

test.describe('Ministries page (/ministries)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ministries')
  })

  test('returns HTTP 200', async ({ request }) => {
    expect((await request.get('/ministries')).status()).toBe(200)
  })

  test('renders without errors', async ({ page }) => {
    await checkNoError(page)
  })

  test('has layout (nav + footer)', async ({ page }) => {
    await checkLayout(page)
  })

  test('has an h1 containing "Ministries"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /Ministries/i }),
    ).toBeVisible()
  })

  test('shows ministry sections or empty state', async ({ page }) => {
    const sections = page.locator('section, article')
    const empty = page.getByRole('heading', { name: /No ministries/i })
    expect(
      (await sections.count()) > 0 || (await empty.isVisible().catch(() => false)),
    ).toBe(true)
  })
})
