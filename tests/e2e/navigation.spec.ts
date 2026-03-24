import { test, expect } from '@playwright/test'

/**
 * Shared helpers used across all page spec files.
 *
 * - checkLayout  : verifies nav + footer are present
 * - checkNoError : ensures no server-error boundary is shown
 */
export async function checkLayout(page: import('@playwright/test').Page) {
  await expect(page.getByRole('navigation').first()).toBeVisible()
  await expect(page.getByRole('contentinfo')).toBeVisible() // <footer>
}

export async function checkNoError(page: import('@playwright/test').Page) {
  // The root error.tsx renders "Something went wrong"
  await expect(page.getByText('Something went wrong')).not.toBeVisible()
}

test.describe('Global — site-wide navigation', () => {
  test('desktop nav renders the Eparchy brand/logo link', async ({ page }) => {
    await page.goto('/')
    // Logo / brand link in the header
    await expect(page.getByRole('banner')).toBeVisible()
  })

  test('site footer is present on the home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })

  test('clicking the News link navigates to /news', async ({ page }) => {
    await page.goto('/')
    // Find the first "News" link in the nav
    await page.getByRole('navigation').first().getByRole('link', { name: /^News$/i }).first().click()
    await expect(page).toHaveURL(/\/news/)
  })

  test('clicking the Events link navigates to /events', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('navigation')
      .first()
      .getByRole('link', { name: /^Events$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/events/)
  })

  test('visiting a non-existent route returns the 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz')
    await expect(page.getByText('404')).toBeVisible()
  })

  test('/sitemap.xml responds with 200', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('xml')
  })

  test('/robots.txt responds with 200', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
  })

  test('/manifest.webmanifest responds with 200', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest')
    expect(res.status()).toBe(200)
  })
})
