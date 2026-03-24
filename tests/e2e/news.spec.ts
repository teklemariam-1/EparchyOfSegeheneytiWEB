import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError, checkSkipNav, checkI18n } from './navigation.spec'

test.describe('News pages', () => {
  test.describe('/news list page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/news')
    })

    test('returns HTTP 200', async ({ request }) => {
      expect((await request.get('/news')).status()).toBe(200)
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

    test('has an h1 containing "News"', async ({ page }) => {
      await expect(
        page.getByRole('heading', { level: 1, name: /News/i }),
      ).toBeVisible()
    })

    test('renders a category filter bar', async ({ page }) => {
      // FilterBar renders buttons with aria-pressed
      const filterButtons = page.locator('[aria-pressed]')
      await expect(filterButtons.first()).toBeVisible()
    })

    test('applies a category filter via URL query param', async ({ page }) => {
      await page.goto('/news?category=eparchy')
      await expect(page).toHaveURL(/category=eparchy/)
      await checkNoError(page)
    })

    test('shows article cards or an EmptyState, never a crash', async ({ page }) => {
      const articles = page.getByRole('article')
      const emptyTitle = page.getByRole('heading', { name: /No news/i })
      const hasArticles = (await articles.count()) > 0
      const hasEmpty = await emptyTitle.isVisible().catch(() => false)
      expect(hasArticles || hasEmpty).toBe(true)
    })
  })

  test.describe('/news/[slug] detail page', () => {
    test('navigates from list to a detail page', async ({ page }) => {
      await page.goto('/news')
      const readMoreLinks = page.getByRole('link', { name: /read more/i })
      if ((await readMoreLinks.count()) === 0) {
        test.skip()
        return
      }
      await readMoreLinks.first().click()
      await expect(page).toHaveURL(/\/news\/.+/)
      await checkNoError(page)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('shows the 404 page for an unknown slug', async ({ page }) => {
      await page.goto('/news/this-slug-does-not-exist-xyz')
      await expect(page.getByText('404')).toBeVisible()
    })
  })
})
