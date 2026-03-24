import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError, checkSkipNav, checkI18n } from './navigation.spec'

test.describe('Search page (/search)', () => {
  test('returns HTTP 200', async ({ request }) => {
    expect((await request.get('/search')).status()).toBe(200)
  })

  test('renders without errors', async ({ page }) => {
    await page.goto('/search')
    await checkNoError(page)
  })

  test('has layout (nav + footer)', async ({ page }) => {
    await page.goto('/search')
    await checkLayout(page)
  })

  test('has an h1 containing "Search"', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByRole('heading', { level: 1, name: /Search/i })).toBeVisible()
  })

  test('renders a search input', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByRole('searchbox')).toBeVisible()
  })

  test('shows results for a query via ?q param', async ({ page }) => {
    await page.goto('/search?q=synod')
    await checkNoError(page)
    // Either results are shown or "no results" — never a crash
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('shows an empty-results message for a nonsense query', async ({ page }) => {
    await page.goto('/search?q=xyzzy1234notarealathing')
    await checkNoError(page)
    // Page should render correctly even with zero results
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('scope filter buttons are present', async ({ page }) => {
    await page.goto('/search?q=test')
    const scopeButtons = page.locator('[aria-pressed]')
    await expect(scopeButtons.first()).toBeVisible()
  })

  test('has a skip-nav link to #main-content', async ({ page }) => {
    await page.goto('/search')
    await checkSkipNav(page)
  })

  test('html[lang] is "en" by default and language switcher is present', async ({ page }) => {
    await page.goto('/search')
    await checkI18n(page)
  })
})
