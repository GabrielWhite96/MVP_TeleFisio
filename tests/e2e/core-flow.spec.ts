import { test, expect } from '@playwright/test'

test.describe('TeleFisio core flow', () => {
  test('login page is reachable', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })
})
