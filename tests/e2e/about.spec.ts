import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError } from './navigation.spec'

test.describe('About page (/about)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about')
  })

  test('returns HTTP 200', async ({ request }) => {
    expect((await request.get('/about')).status()).toBe(200)
  })

  test('renders without errors', async ({ page }) => {
    await checkNoError(page)
  })

  test('has layout (nav + footer)', async ({ page }) => {
    await checkLayout(page)
  })

  test('has an h1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('has a <main> landmark', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('page title includes "About"', async ({ page }) => {
    await expect(page).toHaveTitle(/About/i)
  })

  test('has breadcrumb navigation', async ({ page }) => {
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
  })
})
