import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError, checkSkipNav, checkI18n } from './navigation.spec'

test.describe('Parishes pages', () => {
  test.describe('/parishes list page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/parishes')
    })

    test('returns HTTP 200', async ({ request }) => {
      expect((await request.get('/parishes')).status()).toBe(200)
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

    test('has an h1 containing "Parishes"', async ({ page }) => {
      await expect(
        page.getByRole('heading', { level: 1, name: /Parishes/i }),
      ).toBeVisible()
    })

    test('renders vicariate filter buttons', async ({ page }) => {
      const filterButtons = page.locator('[aria-pressed]')
      await expect(filterButtons.first()).toBeVisible()
    })

    test('applies a vicariate filter via URL query param', async ({ page }) => {
      await page.goto('/parishes?vicariate=segeneyti')
      await checkNoError(page)
    })

    test('shows parish cards or empty state', async ({ page }) => {
      const articles = page.getByRole('article')
      const empty = page.getByRole('heading', { name: /No parishes/i })
      expect(
        (await articles.count()) > 0 || (await empty.isVisible().catch(() => false)),
      ).toBe(true)
    })
  })

  test.describe('/parishes/[slug] detail page', () => {
    test('navigates from a parish card to its detail page', async ({ page }) => {
      await page.goto('/parishes')
      const cardLink = page.locator('article a').first()
      if ((await cardLink.count()) === 0) {
        test.skip()
        return
      }
      const href = await cardLink.getAttribute('href')
      if (!href?.startsWith('/parishes/')) {
        test.skip()
        return
      }
      await page.goto(href)
      await checkNoError(page)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('returns 404 for an unknown parish slug', async ({ page }) => {
      await page.goto('/parishes/this-parish-does-not-exist-xyz')
      await expect(page.getByText('404')).toBeVisible()
    })
  })
})
