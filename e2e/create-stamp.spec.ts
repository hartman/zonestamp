import { test, expect } from '@playwright/test'

test('create stamp page loads with pickers and generate button', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('The event will take place at')).toBeVisible()
  await expect(page.getByRole('button', { name: /Generate Stamp/i })).toBeVisible()
})

test('stamp URL is generated and displayed after clicking Generate', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Generate Stamp/i }).click()
  // The stamp callout should appear with a link containing a 10-digit timestamp
  const link = page.locator('.create-stamp-link')
  await expect(link).toBeVisible()
  const href = await link.getAttribute('href')
  expect(href).toMatch(/\/\d{10}$/)
})

test('copy button toggles to checkmark after click', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'clipboard-write permission not supported on WebKit')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.getByRole('button', { name: /Generate Stamp/i }).click()
  const copyBtn = page.getByRole('button', { name: /Copy link/i })
  await expect(copyBtn).toBeVisible()
  await copyBtn.click()
  await expect(page.getByRole('button', { name: /Copied!/i })).toBeVisible()
})

test('generated stamp link navigates to display view', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Generate Stamp/i }).click()
  const link = page.locator('.create-stamp-link')
  const href = await link.getAttribute('href')
  expect(href).toBeTruthy()
  await page.goto(href!)
  await expect(page.getByText("That's...")).toBeVisible()
})

test('location is included in generated stamp URLs when options are open', async ({ page }) => {
  await page.goto('/')
  await page.locator('.create-options-toggle').click()
  await page.getByPlaceholder('Location').fill('Online')
  await page.getByRole('button', { name: /Generate Stamp/i }).click()

  const link = page.locator('.create-stamp-link')
  const href = await link.getAttribute('href')
  expect(href).toContain('location=Online')
})

test('URL field shows validation error for non-https input', async ({ page }) => {
  await page.goto('/')
  await page.locator('.create-options-toggle').click()
  await page.getByPlaceholder('https://…').fill('http://example.com')
  await expect(page.locator('.create-options-error')).toBeVisible()
  await expect(page.locator('.create-options-error')).toHaveText('URL must start with https://')
})

test('invalid URL is excluded from generated stamp link', async ({ page }) => {
  await page.goto('/')
  await page.locator('.create-options-toggle').click()
  await page.getByPlaceholder('https://…').fill('http://example.com')
  await page.getByRole('button', { name: /Generate Stamp/i }).click()

  const href = await page.locator('.create-stamp-link').getAttribute('href')
  expect(href).not.toContain('url=')
})

test('valid https URL is included in generated stamp link', async ({ page }) => {
  await page.goto('/')
  await page.locator('.create-options-toggle').click()
  await page.getByPlaceholder('https://…').fill('https://example.com')
  await page.getByRole('button', { name: /Generate Stamp/i }).click()

  const href = await page.locator('.create-stamp-link').getAttribute('href')
  expect(href).toContain('url=https%3A%2F%2Fexample.com')
})
