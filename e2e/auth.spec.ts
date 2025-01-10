import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing dashboard while logged out', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/dashboard')
    
    // Should be redirected to login page
    await expect(page).toHaveURL('/login')
  })

  test('successful login flow', async ({ page }) => {
    // Start at login page
    await page.goto('/login')
    
    // Wait for the form to be visible
    await page.waitForSelector('form')
    
    // Fill the form using more specific selectors
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ])

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should stay on dashboard when logged in', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForSelector('form')
    
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ])
    
    // Try accessing dashboard
    await page.goto('/dashboard')
    
    // Should stay on dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('successful signup flow', async ({ page }) => {
    // Start at signup page
    await page.goto('/sign-up')
    
    // Wait for the form to be visible
    await page.waitForSelector('form')
    
    // Generate a unique email to avoid conflicts
    const uniqueEmail = `test${Date.now()}@example.com`
    
    // Fill the form
    await page.fill('#email', uniqueEmail)
    await page.fill('#password', 'password123')
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ])

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify we're on dashboard
    await expect(page.getByText('Dashboard')).toBeVisible()
  })
}) 