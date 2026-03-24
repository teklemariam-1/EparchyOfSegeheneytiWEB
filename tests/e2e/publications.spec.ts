import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError, checkSkipNav, checkI18n } from './navigation.spec'

test.describe('Publications page (/publications)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/publications')
  })

  test('returns HTTP 200', async ({ request }) => {
    expect((await request.get('/publications')).status()).toBe(200)
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

  test('has an h1 containing "Publications"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /Publications/i }),
    ).toBeVisible()
  })

  test('shows publication cards or empty state', async ({ page }) => {
    const cards = page.locator('article, [data-publication]')
    const empty = page.getByRole('heading', { name: /No publications/i })
    expect(
      (await cards.count()) > 0 || (await empty.isVisible().catch(() => false)),
    ).toBe(true)
  })
})
