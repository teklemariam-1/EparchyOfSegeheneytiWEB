import { test, expect } from '@playwright/test'
import { checkLayout, checkNoError } from './navigation.spec'

test.describe("Ge'ez Calendar page (/geez-calendar)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/geez-calendar')
  })

  test('returns HTTP 200', async ({ request }) => {
    expect((await request.get('/geez-calendar')).status()).toBe(200)
  })

  test('renders without errors', async ({ page }) => {
    await checkNoError(page)
  })

  test('has layout (nav + footer)', async ({ page }) => {
    await checkLayout(page)
  })

  test("has an h1 related to the Ge'ez Calendar", async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /Calendar|Ge.ez|ግዕዝ/i }),
    ).toBeVisible()
  })

  test('displays month names or calendar entries', async ({ page }) => {
    // Ge'ez month names or table/grid should be present
    const mainContent = page.getByRole('main')
    await expect(mainContent).toBeVisible()
    // Should contain meaningful content and not just be empty
    const text = await mainContent.innerText()
    expect(text.length).toBeGreaterThan(10)
  })
})
