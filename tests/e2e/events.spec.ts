import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError, checkSkipNav, checkI18n } from './navigation.spec'

test.describe('Events pages', () => {
  test.describe('/events list page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/events')
    })

    test('returns HTTP 200', async ({ request }) => {
      expect((await request.get('/events')).status()).toBe(200)
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

    test('has an h1 containing "Events"', async ({ page }) => {
      await expect(
        page.getByRole('heading', { level: 1, name: /Events/i }),
      ).toBeVisible()
    })

    test('shows upcoming events section or empty state', async ({ page }) => {
      const articles = page.getByRole('article')
      const empty = page.getByRole('heading', { name: /No (upcoming )?events/i })
      expect(
        (await articles.count()) > 0 || (await empty.isVisible().catch(() => false)),
      ).toBe(true)
    })
  })

  test.describe('/events/[slug] detail page', () => {
    test('navigates from list to an event detail page', async ({ page }) => {
      await page.goto('/events')
      const eventLinks = page.getByRole('link').filter({ hasText: /^(?!Nav|Home|about|news|events|parishes|media|contact)/i })
      const articleLinks = page.locator('article a').first()
      if ((await articleLinks.count()) === 0) {
        test.skip()
        return
      }
      const href = await articleLinks.getAttribute('href')
      if (!href?.startsWith('/events/')) {
        test.skip()
        return
      }
      await page.goto(href)
      await checkNoError(page)
    })

    test('returns 404 for an unknown event slug', async ({ page }) => {
      await page.goto('/events/this-event-does-not-exist-xyz')
      await expect(page.getByText('404')).toBeVisible()
    })
  })
})
