import { test, expect, type Page } from '@playwright/test'

// 2024-05-31 12:00:00 UTC
const TS = '1717156800'

// On mobile the meta block is hidden until the user taps the scroll hint.
// waitFor with a short timeout handles both cases: visible (mobile) → click; not found (desktop) → skip.
async function revealMeta(page: Page) {
  const hint = page.locator('.display-scroll-hint')
  try {
    await hint.waitFor({ state: 'visible', timeout: 2000 })
    await hint.click()
  } catch {
    // Desktop: scroll hint is CSS-hidden, meta is already accessible
  }
}

test('display view shows time and date for known timestamp', async ({ page }) => {
  await page.goto(`/${TS}`)
  await expect(page.getByText("That's...")).toBeVisible()
  // Large time display must be present (exact value depends on system timezone)
  await expect(page.locator('.display-time')).toBeVisible()
  await expect(page.locator('.display-date')).toBeVisible()
})

test('12/24h toggle switches time format', async ({ page }) => {
  await page.goto(`/${TS}`)
  const toggleBtn = page.getByRole('button', { name: /Switch to 24-hour format|Switch to 12-hour format/ })
  await expect(toggleBtn).toBeVisible()

  const timeBefore = await page.locator('.display-time').textContent()
  await toggleBtn.click()
  const timeAfter = await page.locator('.display-time').textContent()
  expect(timeBefore).not.toBe(timeAfter)
})

test('add-to-calendar button is present even without event data', async ({ page }) => {
  await page.goto(`/${TS}`)
  await expect(page.locator('.cal-btn')).toBeVisible()
})

test('scroll hint is visible on mobile when description is present', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'scroll hint is mobile-only')
  await page.goto(`/${TS}?name=My+Event&description=Details+here`)
  await expect(page.locator('.display-scroll-hint')).toBeVisible()
})

test('scroll hint is hidden on mobile when there is no description', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'scroll hint is mobile-only')
  await page.goto(`/${TS}?name=My+Event&location=Amsterdam&url=https://example.com`)
  await expect(page.locator('.display-scroll-hint')).not.toBeVisible()
})

test('location is shown as a map search link', async ({ page }) => {
  await page.goto(`/${TS}?location=Amsterdam`)
  await revealMeta(page)
  const locationLink = page.locator('.display-meta-btn').filter({ hasText: 'Amsterdam' })
  await expect(locationLink).toBeVisible()
  await expect(locationLink).toHaveAttribute('href', /duckduckgo\.com\/\?q=Amsterdam&iaxm=maps/)
})

test('https URL is rendered as a link in the meta block', async ({ page }) => {
  await page.goto(`/${TS}?url=https://example.com`)
  await revealMeta(page)
  const urlLink = page.locator('.display-meta-btn[href]').filter({ hasText: 'example.com' })
  await expect(urlLink).toBeVisible()
  await expect(urlLink).toHaveAttribute('href', 'https://example.com')
})

test('non-https URL is not rendered as a link in the meta block', async ({ page }) => {
  await page.goto(`/${TS}?url=http://example.com`)
  await revealMeta(page)
  await expect(page.locator('.display-meta-btn[href*="example.com"]')).not.toBeVisible()
})

test('multiline event name in display header is not clipped', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'max-height clipping only applies on mobile')
  const longName = 'The Annual International Conference on Timezone Engineering and Global Coordination'
  await page.goto(`/${TS}?name=${encodeURIComponent(longName)}`)
  await page.waitForSelector('.display-header')
  const clipped = await page.evaluate(() => {
    const header = document.querySelector('.display-header') as HTMLElement
    return header.scrollHeight > header.clientHeight
  })
  expect(clipped).toBe(false)
})
