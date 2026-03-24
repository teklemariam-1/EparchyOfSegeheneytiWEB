import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError, checkSkipNav, checkI18n } from './navigation.spec'

test.describe("Bishop's Messages pages", () => {
  test.describe('/bishop-messages list page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/bishop-messages')
    })

    test('returns HTTP 200', async ({ request }) => {
      expect((await request.get('/bishop-messages')).status()).toBe(200)
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

    test("has an h1 related to bishop's messages", async ({ page }) => {
      await expect(
        page.getByRole('heading', { level: 1, name: /Bishop|Message/i }),
      ).toBeVisible()
    })

    test("shows message cards or an empty state", async ({ page }) => {
      const articles = page.getByRole('article')
      const empty = page.getByRole('heading', { name: /No messages/i })
      expect(
        (await articles.count()) > 0 || (await empty.isVisible().catch(() => false)),
      ).toBe(true)
    })
  })

  test.describe('/bishop-messages/[slug] detail page', () => {
    test('navigates from list to a message detail page', async ({ page }) => {
      await page.goto('/bishop-messages')
      const cardLink = page.locator('article a').first()
      if ((await cardLink.count()) === 0) {
        test.skip()
        return
      }
      const href = await cardLink.getAttribute('href')
      if (!href?.startsWith('/bishop-messages/')) {
        test.skip()
        return
      }
      await page.goto(href)
      await checkNoError(page)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('returns 404 for an unknown message slug', async ({ page }) => {
      await page.goto('/bishop-messages/this-message-does-not-exist-xyz')
      await expect(page.getByText('404')).toBeVisible()
    })
  })
})
