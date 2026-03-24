import { test, expect } from '@playwright/test'

test.describe('404 Not Found page', () => {
  test('visiting a non-existent route shows the custom 404 page', async ({ page }) => {
    const res = await page.goto('/this-does-not-exist-xyz-404')
    // Next.js returns 404 status for not-found pages
    expect(res?.status()).toBe(404)
  })

  test('displays the "404" label', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz-404')
    await expect(page.getByText('404')).toBeVisible()
  })

  test('displays a return-home link', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz-404')
    await expect(page.getByRole('link', { name: /Return Home/i })).toBeVisible()
  })

  test('"Return Home" link points to "/"', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz-404')
    const homeLink = page.getByRole('link', { name: /Return Home/i })
    await expect(homeLink).toHaveAttribute('href', '/')
  })

  test('displays a "Contact Us" link', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz-404')
    await expect(page.getByRole('link', { name: /Contact Us/i })).toBeVisible()
  })

  test('quick navigation links (News, Events, etc.) are present', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz-404')
    await expect(page.getByRole('link', { name: /^News$/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /^Events$/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /^Parishes$/i })).toBeVisible()
  })
})
