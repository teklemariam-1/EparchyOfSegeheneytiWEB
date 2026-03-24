import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError } from './navigation.spec'

test.describe('Home page (/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('returns HTTP 200', async ({ request }) => {
    const res = await request.get('/')
    expect(res.status()).toBe(200)
  })

  test('renders the page without an error boundary', async ({ page }) => {
    await checkNoError(page)
  })

  test('has a non-empty <title>', async ({ page }) => {
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
    expect(title).toMatch(/Eparchy|Segeneyti|Catholic/i)
  })

  test('has nav and footer (layout)', async ({ page }) => {
    await checkLayout(page)
  })

  test('contains a hero section with a heading', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('contains an <main> landmark region', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('latest news section links lead to /news detail pages', async ({ page }) => {
    const newsLinks = page.getByRole('link', { name: /read more/i })
    const count = await newsLinks.count()
    if (count > 0) {
      const href = await newsLinks.first().getAttribute('href')
      expect(href).toMatch(/^\/news\//)
    }
  })

  test('has a canonical link or og:url meta in the <head>', async ({ page }) => {
    const ogUrl = page.locator('meta[property="og:url"]')
    await expect(ogUrl).toHaveCount(1)
  })
})
