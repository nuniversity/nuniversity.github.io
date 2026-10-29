import { test, expect } from '../support/fixtures'

test.use({ viewport: { width: 390, height: 844 } })

test.describe('mobile navigation', () => {
  test('opens the mobile menu and navigates to courses', async ({ page }) => {
    await page.goto('/en/')

    const menuButton = page.getByRole('button', { name: 'Open menu' })
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    const mobileNav = page.locator('#mobile-navigation')
    await expect(mobileNav).toBeVisible()
    await mobileNav.getByRole('link', { name: 'Courses', exact: true }).click()

    await expect(page).toHaveURL(/\/en\/courses\/$/)
    await expect(page.locator('#mobile-navigation')).toHaveCount(0)
  })
})
