import { test, expect } from '@playwright/test'

test.describe('TeleFisio core flow', () => {
  test('login page is reachable', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('signup exposes patient, physio and caregiver roles', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.getByText(/paciente/i).first()).toBeVisible()
    await expect(page.getByText(/fisioterapeuta/i).first()).toBeVisible()
    await expect(page.getByText(/cuidador|familiar/i).first()).toBeVisible()
  })

  test('home page loads brand', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/TeleFisio/i).first()).toBeVisible()
  })
})
