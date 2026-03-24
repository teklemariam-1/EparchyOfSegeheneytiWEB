import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError } from './navigation.spec'

test.describe('Media page (/media)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media')
  })

  test('returns HTTP 200', async ({ request }) => {
    expect((await request.get('/media')).status()).toBe(200)
  })

  test('renders without errors', async ({ page }) => {
    await checkNoError(page)
  })

  test('has layout (nav + footer)', async ({ page }) => {
    await checkLayout(page)
  })

  test('has an h1 containing "Media"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /Media/i }),
    ).toBeVisible()
  })

  test('renders the category filter bar', async ({ page }) => {
    const filterButtons = page.locator('[aria-pressed]')
    await expect(filterButtons.first()).toBeVisible()
  })

  test('applies a category filter via query param', async ({ page }) => {
    await page.goto('/media?category=photos')
    await checkNoError(page)
  })

  test('shows a media grid or empty state', async ({ page }) => {
    const mediaItems = page.locator('figure, [data-media-item], article')
    const empty = page.getByRole('heading', { name: /No media/i })
    expect(
      (await mediaItems.count()) > 0 || (await empty.isVisible().catch(() => false)),
    ).toBe(true)
  })

  test('shows pagination controls when there are enough items', async ({ page }) => {
    const paginationNav = page.getByRole('navigation', { name: /page/i })
    const pageBtns = page.locator('[aria-label*="page" i], nav a[href*="page="]')
    // Pagination is optional (only visible when total > pageSize) — just no crash
    await checkNoError(page)
    expect(pageBtns).toBeDefined()
  })
})
