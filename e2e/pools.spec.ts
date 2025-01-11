import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL!
const TEST_PASSWORD = process.env.TEST_PASSWORD!

test.describe('Pools Table', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForSelector('form')
    await page.fill('#email', TEST_EMAIL)
    await page.fill('#password', TEST_PASSWORD)
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ])
  })

  test('should display whitelisted pools', async ({ page }) => {
    // Go to pools page
    await page.goto('/pools')

    // Wait for table to load
    await page.waitForSelector('table')

    // Check for specific pool
    const poolText = await page.getByText('vAMM-USDC/cbBTC').isVisible()
    expect(poolText).toBeTruthy()
  })

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()
    
    // Try to access pools page directly
    await page.goto('/pools')
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login')
  })
}) 