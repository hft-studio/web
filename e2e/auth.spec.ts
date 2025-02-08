import { test, expect } from '@playwright/test'
import { loginRoute, mainRoute } from '@/config/routes'
const TEST_EMAIL = process.env.TEST_EMAIL!
const TEST_PASSWORD = process.env.TEST_PASSWORD!

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing dashboard while logged out', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto(mainRoute)
    
    // Should be redirected to login page
    await expect(page).toHaveURL(loginRoute)
  })

  test('successful login flow', async ({ page }) => {
    // Start at login page
    await page.goto(loginRoute)
    
    // Wait for the form to be visible
    await page.waitForSelector('form')
    
    // Fill the form using more specific selectors
    await page.fill('#email', TEST_EMAIL)
    await page.fill('#password', TEST_PASSWORD)
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ])

    await expect(page).toHaveURL(mainRoute)
  })

  test('should stay on dashboard when logged in', async ({ page }) => {
    // Login first
    await page.goto(loginRoute)
    await page.waitForSelector('form')
    
    await page.fill('#email', TEST_EMAIL)
    await page.fill('#password', TEST_PASSWORD)
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ])
    
    // Try accessing dashboard
    await page.goto(mainRoute)
    
    // Should stay on dashboard
    await expect(page).toHaveURL(mainRoute)
  })
}) 