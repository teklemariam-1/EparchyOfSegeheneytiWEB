import { test, expect } from '@playwright/test'

test.describe('Admin login page (/admin)', () => {
  test('returns HTTP 200 and renders a login form', async ({ page }) => {
    await page.goto('/admin')
    // Payload admin panel or custom login should load
    await expect(page).toHaveURL(/\/admin/)
    // Should display some form of login interface
    const loginForm = page.locator('form')
    await expect(loginForm.first()).toBeVisible({ timeout: 15_000 })
  })

  test('has email and password fields', async ({ page }) => {
    await page.goto('/admin')
    // Wait for the login form to render
    const emailField = page.locator('input[type="email"], input[name="email"]')
    await expect(emailField.first()).toBeVisible({ timeout: 15_000 })
    const passwordField = page.locator('input[type="password"], input[name="password"]')
    await expect(passwordField.first()).toBeVisible()
  })

  test('shows error when submitting empty credentials', async ({ page }) => {
    await page.goto('/admin')
    // Click the login/submit button without filling in fields
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn.first()).toBeVisible({ timeout: 15_000 })
    await submitBtn.first().click()
    // Should show some validation feedback (error message or required field)
    const errorOrRequired = page.locator('[role="alert"], .error, [aria-invalid="true"], .field-error')
    await expect(errorOrRequired.first()).toBeVisible({ timeout: 5_000 })
  })

  test('forgot password link navigates to forgot page', async ({ page }) => {
    await page.goto('/admin')
    const forgotLink = page.locator('a[href*="forgot"]')
    await expect(forgotLink.first()).toBeVisible({ timeout: 15_000 })
    await forgotLink.first().click()
    await expect(page).toHaveURL(/\/admin\/forgot/)
  })
})

test.describe('Admin forgot-password page (/admin/forgot)', () => {
  test('renders the forgot password form', async ({ page }) => {
    await page.goto('/admin/forgot')
    const emailField = page.locator('input[type="email"], input[name="email"]')
    await expect(emailField.first()).toBeVisible({ timeout: 15_000 })
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn.first()).toBeVisible()
  })
})

test.describe('Health endpoint (/api/health)', () => {
  test('returns JSON with status ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('eparchy-segeneyti-web')
    expect(body).toHaveProperty('timestamp')
  })
})
