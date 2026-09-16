import { test, expect } from '@playwright/test'

test.describe('TeleFisio core flow', () => {
  test('login page is reachable', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('signup is physiotherapist-only', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.getByText(/conta profissional|fisioterapeuta/i).first()).toBeVisible()
    await expect(page.getByText(/sou paciente/i)).toHaveCount(0)
    await expect(page.getByText(/sou familiar|cuidador/i)).toHaveCount(0)
  })

  test('home page loads brand', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/TeleFisio/i).first()).toBeVisible()
  })
})
