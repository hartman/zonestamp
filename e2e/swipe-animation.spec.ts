import { test, expect, type Page } from '@playwright/test'

// 2024-05-31 12:00:00 UTC — stable, non-DST-ambiguous timestamp
const TS = '1717156800'
// URL with enough calendar data to render meta block + calendar button
const WITH_DATA = `/${TS}?name=Test+Event&description=Join+us+for+a+test+event&location=Amsterdam`

/**
 * Trigger the swipe state machine via a DEV-only test hook on window.
 * WebKit does not allow new Touch() in page.evaluate, so real touch event
 * simulation is not possible cross-browser. The hook calls applySwipeDelta()
 * directly, exercising the same logic as a real touch gesture.
 */
async function swipe(page: Page, direction: 'up' | 'down', distance = 80) {
  await page.locator('.display-view').waitFor({ state: 'visible' })
  const delta = direction === 'up' ? -distance : distance
  await page.evaluate((d) => (window as any).__testSwipeDelta(d), delta)
}

// ── Mobile swipe animation ────────────────────────────────────────────────────

test.describe('mobile swipe animation', () => {
  test.beforeEach(async ({ isMobile }) => {
    test.skip(!isMobile, 'Mobile-only')
  })

  test('initial state: header and controls visible, meta and calendar hidden', async ({ page }) => {
    await page.goto(WITH_DATA)
    await expect(page.locator('.display-header')).toBeVisible()
    await expect(page.locator('.display-toggle')).toBeVisible()
    await expect(page.locator('.display-tz-row')).toBeVisible()
    await expect(page.locator('.display-meta')).toBeHidden()
    await expect(page.locator('.cal-wrapper')).toBeHidden()
  })

  test('reveal hint is visible when calendar data present', async ({ page }) => {
    await page.goto(WITH_DATA)
    await expect(page.locator('.display-scroll-hint')).toBeVisible()
    await expect(page.locator('.display-scroll-hint')).toContainText('Reveal details')
  })

  test('clicking reveal hint transitions to scrolled state', async ({ page }) => {
    await page.goto(WITH_DATA)
    await page.locator('.display-scroll-hint').click()
    await expect(page.locator('.display-header')).toBeHidden()
    await expect(page.locator('.display-meta')).toBeVisible()
    await expect(page.locator('.cal-wrapper')).toBeVisible()
  })

  test('reveal hint absent when no calendar data', async ({ page }) => {
    await page.goto(`/${TS}`)
    await expect(page.locator('.display-scroll-hint')).not.toBeAttached()
  })

  test('swipe up reveals meta and calendar, hides header and controls', async ({ page }) => {
    await page.goto(WITH_DATA)
    await swipe(page, 'up', 80)
    await expect(page.locator('.display-header')).toBeHidden()
    await expect(page.locator('.display-toggle')).toBeHidden()
    await expect(page.locator('.display-tz-row')).toBeHidden()
    await expect(page.locator('.display-meta')).toBeVisible()
    await expect(page.locator('.cal-wrapper')).toBeVisible()
    await expect(page.locator('.display-scroll-hint')).toBeHidden()
  })

  test('swipe down from scrolled state returns to initial state', async ({ page }) => {
    await page.goto(WITH_DATA)
    await swipe(page, 'up', 80)
    // Wait for transition to fully complete before reversing
    await expect(page.locator('.display-meta')).toBeVisible()
    await swipe(page, 'down', 80)
    await expect(page.locator('.display-header')).toBeVisible()
    await expect(page.locator('.display-toggle')).toBeVisible()
    await expect(page.locator('.display-tz-row')).toBeVisible()
    await expect(page.locator('.display-meta')).toBeHidden()
    await expect(page.locator('.cal-wrapper')).toBeHidden()
  })

  test('short swipe under 30px does not trigger transition', async ({ page }) => {
    await page.goto(WITH_DATA)
    await swipe(page, 'up', 20)
    // State must not change
    await expect(page.locator('.display-header')).toBeVisible()
    await expect(page.locator('.display-meta')).toBeHidden()
  })

  test('swipe up with only end-time data (no description) reveals calendar', async ({ page }) => {
    const endTs = String(Number(TS) + 3600)
    await page.goto(`/${TS}/${endTs}`)
    await swipe(page, 'up', 80)
    await expect(page.locator('.cal-wrapper')).toBeVisible()
  })

  test('swipe does nothing when no description (needsReveal is false)', async ({ page }) => {
    await page.goto(`/${TS}`)
    await swipe(page, 'up', 80)
    // needsReveal is false without a description — swipe state machine is a no-op
    await expect(page.locator('.display-header')).toBeVisible()
    await expect(page.locator('.cal-wrapper')).toBeVisible()
  })
})

// ── Desktop display view ──────────────────────────────────────────────────────

test.describe('desktop display view', () => {
  test.beforeEach(async ({ isMobile }) => {
    test.skip(isMobile, 'Desktop-only')
  })

  test('meta and calendar always visible without any interaction', async ({ page }) => {
    await page.goto(WITH_DATA)
    await expect(page.locator('.display-meta')).toBeVisible()
    await expect(page.locator('.cal-wrapper')).toBeVisible()
  })

  test('header, toggle, and timezone row always visible', async ({ page }) => {
    await page.goto(WITH_DATA)
    await expect(page.locator('.display-header')).toBeVisible()
    await expect(page.locator('.display-toggle')).toBeVisible()
    await expect(page.locator('.display-tz-row')).toBeVisible()
  })

  test('calendar dropdown opens on button click', async ({ page }) => {
    await page.goto(WITH_DATA)
    await page.locator('.cal-btn').click()
    await expect(page.locator('.cal-dropdown')).toBeVisible()
  })

  test('calendar dropdown closes when clicking outside', async ({ page }) => {
    await page.goto(WITH_DATA)
    await page.locator('.cal-btn').click()
    await expect(page.locator('.cal-dropdown')).toBeVisible()
    await page.mouse.click(10, 10)
    await expect(page.locator('.cal-dropdown')).toBeHidden()
  })

  test('swipe hint not shown on desktop', async ({ page }) => {
    await page.goto(WITH_DATA)
    await expect(page.locator('.display-scroll-hint')).toBeHidden()
  })
})
