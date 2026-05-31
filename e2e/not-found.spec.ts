import { test, expect } from '@playwright/test'

test('non-numeric path shows not found', async ({ page }) => {
  await page.goto('/notavalidpath')
  await expect(page.getByText(/not found|404/i)).toBeVisible()
})

test('5-digit numeric path shows not found (too short for timestamp)', async ({ page }) => {
  await page.goto('/12345')
  await expect(page.getByText(/not found|404/i)).toBeVisible()
})

test('11-digit numeric path shows not found (too long for timestamp)', async ({ page }) => {
  await page.goto('/12345678901')
  await expect(page.getByText(/not found|404/i)).toBeVisible()
})

test('root path shows create stamp view, not not-found', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('The event will take place at')).toBeVisible()
})

test('10-digit path shows display view, not not-found', async ({ page }) => {
  await page.goto('/1717156800')
  await expect(page.getByText("That's...")).toBeVisible()
})
