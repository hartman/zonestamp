import { test, expect } from '@playwright/test'

const TS = '1717156800'

test('menu button is visible in header', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible()
})

test('menu opens on button click', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.locator('.app-menu.open')).toBeVisible()
})

test('menu closes on close button click', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.locator('.app-menu.open')).toBeVisible()
  await page.getByRole('button', { name: 'Close settings' }).click()
  await expect(page.locator('.app-menu.open')).not.toBeVisible()
})

test('menu closes on Escape key', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.locator('.app-menu.open')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.app-menu.open')).not.toBeVisible()
})

test('12h/24h toggle in menu changes format on stamp display', async ({ page }) => {
  await page.goto(`/${TS}`)
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.locator('.app-menu.open')).toBeVisible()

  const timeBefore = await page.locator('.display-time').textContent()
  await page.getByRole('switch').click()
  const timeAfter = await page.locator('.display-time').textContent()
  expect(timeBefore).not.toBe(timeAfter)
})
