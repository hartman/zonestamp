import { test, expect, type Page } from '@playwright/test'

// Timestamps with known UTC values — verified with Node:
// new Date(ts * 1000).toISOString()

// 2024-05-31T12:00:00Z
const TS_SUMMER = '1717156800'
// 2024-01-15T12:00:00Z (NYC is EST = UTC-5 in January)
const TS_WINTER = '1705320000'
// 2026-05-30T22:00:00Z — start for cross-midnight event
const TS_CROSS_START = '1780178400'
// 2026-05-31T02:00:00Z — end 4h later, different day in UTC but same day in UTC+13
const TS_CROSS_END = '1780192800'
// 2026-03-08T06:59:59Z = 01:59:59 EST (1s before NYC spring-forward at 07:00 UTC)
const TS_BEFORE_SPRING = '1772953199'
// 2026-03-08T07:00:01Z = 03:00:01 EDT (1s after — 02:xx is the skipped hour)
const TS_AFTER_SPRING = '1772953201'
// 2026-11-01T05:59:59Z = 01:59:59 EDT (1s before NYC fall-back at 06:00 UTC)
const TS_BEFORE_FALL = '1793512799'
// 2026-11-01T06:00:01Z = 01:00:01 EST (1s after — clocks rolled back to 01:00)
const TS_AFTER_FALL = '1793512801'

// Switch the display to 24h format for deterministic time strings.
// The toggle shows "24h" when currently in 12h mode.
async function enable24h(page: Page) {
  const toggle = page.locator('.display-toggle')
  await toggle.waitFor({ state: 'visible' })
  if ((await toggle.textContent())?.trim() === '24h') {
    await toggle.click()
  }
}

// Open the timezone picker and select a zone by searching (desktop only).
async function selectTimezone(page: Page, query: string, itemText: string) {
  await page.locator('.display-tz-row .tz-trigger').click()
  const input = page.locator('.tz-search-input')
  await input.waitFor({ state: 'visible' })
  await input.fill(query)
  await page.locator('.tz-item[role="option"]').filter({ hasText: itemText }).first().click()
}

// On mobile the calendar section is behind a scroll hint. Click it if needed.
async function revealCalendar(page: Page) {
  const hint = page.locator('.display-scroll-hint')
  try {
    await hint.waitFor({ state: 'visible', timeout: 1500 })
    await hint.click()
  } catch {
    // Desktop: scroll hint hidden by CSS, cal-wrapper already visible
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Timezone display accuracy
//    All tests run with timezoneId: 'UTC' so detectedZone = UTC and the
//    initial displayZone is deterministic.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Timezone display accuracy', () => {
  test.use({ timezoneId: 'UTC' })

  test('initial display shows UTC time in 24h format', async ({ page }) => {
    await page.goto(`/${TS_SUMMER}`)
    await enable24h(page)
    // 2024-05-31T12:00:00Z displayed in UTC → 12:00
    await expect(page.locator('.display-time').first()).toContainText('12:00')
  })

  test('display date shows the correct weekday and date', async ({ page }) => {
    await page.goto(`/${TS_SUMMER}`)
    // 2024-05-31 is a Friday
    await expect(page.locator('.display-date').first()).toContainText('Friday')
    await expect(page.locator('.display-date').first()).toContainText('May')
    await expect(page.locator('.display-date').first()).toContainText('2024')
  })

  test('switching to Asia/Tokyo (UTC+9) shifts time by +9h', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    await page.goto(`/${TS_SUMMER}`)
    await enable24h(page)
    await selectTimezone(page, 'Tokyo', 'Tokyo')
    // 12:00 UTC + 9h = 21:00 JST
    await expect(page.locator('.display-time').first()).toContainText('21:00')
  })

  test('switching to America/New_York (EDT, UTC-4 in summer) shows 08:00', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    await page.goto(`/${TS_SUMMER}`)
    await enable24h(page)
    await selectTimezone(page, 'New York', 'New York')
    // 12:00 UTC - 4h EDT = 08:00
    await expect(page.locator('.display-time').first()).toContainText('08:00')
  })

  test('switching to America/New_York (EST, UTC-5 in winter) shows 07:00', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    await page.goto(`/${TS_WINTER}`)
    await enable24h(page)
    // 2024-01-15 12:00 UTC — January, EST applies (UTC-5)
    await selectTimezone(page, 'New York', 'New York')
    // 12:00 UTC - 5h EST = 07:00
    await expect(page.locator('.display-time').first()).toContainText('07:00')
  })

  test('switching back to UTC restores original time', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    await page.goto(`/${TS_SUMMER}`)
    await enable24h(page)
    await selectTimezone(page, 'New York', 'New York')
    await expect(page.locator('.display-time').first()).toContainText('08:00')
    // UTC is always the first item in the picker — select without searching
    await page.locator('.display-tz-row .tz-trigger').click()
    await page.locator('.tz-item[role="option"]').filter({ hasText: 'UTC · UTC+0' }).click()
    await expect(page.locator('.display-time').first()).toContainText('12:00')
  })

  test('Tokyo (no DST) shows same offset year-round: UTC+9', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    // Summer check: 12:00 UTC → 21:00 JST
    await page.goto(`/${TS_SUMMER}`)
    await enable24h(page)
    await selectTimezone(page, 'Tokyo', 'Tokyo')
    await expect(page.locator('.display-time').first()).toContainText('21:00')
    // Winter check (new navigation): 12:00 UTC → 21:00 JST (same, no DST)
    await page.goto(`/${TS_WINTER}`)
    await enable24h(page)
    await selectTimezone(page, 'Tokyo', 'Tokyo')
    await expect(page.locator('.display-time').first()).toContainText('21:00')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. DST transitions — America/New_York
//    Spring-forward: 2026-03-08 02:00 AM EST → 03:00 AM EDT (UTC 07:00)
//    Fall-back:      2026-11-01 02:00 AM EDT → 01:00 AM EST (UTC 06:00)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('DST transitions — America/New_York', () => {
  test.use({ timezoneId: 'UTC' })

  test('spring-forward: 01:59 EST just before clocks advance', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    await page.goto(`/${TS_BEFORE_SPRING}`)
    await enable24h(page)
    // 2026-03-08T06:59:59Z = 01:59:59 AM EST (UTC-5)
    await selectTimezone(page, 'New York', 'New York')
    await expect(page.locator('.display-time').first()).toContainText('01:59')
    await expect(page.locator('.display-date').first()).toContainText('March')
  })

  test('spring-forward: 03:00 EDT immediately after (02:xx is the skipped hour)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    await page.goto(`/${TS_AFTER_SPRING}`)
    await enable24h(page)
    // 2026-03-08T07:00:01Z = 03:00:01 AM EDT (UTC-4) — no 02:xx exists this day
    await selectTimezone(page, 'New York', 'New York')
    await expect(page.locator('.display-time').first()).toContainText('03:00')
    await expect(page.locator('.display-time').first()).not.toContainText('02:')
  })

  test('adjacent spring-forward timestamps are 2 hours apart in NYC display', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    // 1 second apart in UTC but the displayed times jump 2 hours (01:59 → 03:00)
    // This confirms that Luxon correctly handles the DST transition gap
    await page.goto(`/${TS_BEFORE_SPRING}`)
    await enable24h(page)
    await selectTimezone(page, 'New York', 'New York')
    const timeBefore = await page.locator('.display-time').first().textContent()

    await page.goto(`/${TS_AFTER_SPRING}`)
    await enable24h(page)
    await selectTimezone(page, 'New York', 'New York')
    const timeAfter = await page.locator('.display-time').first().textContent()

    expect(timeBefore?.trim()).toBe('01:59')
    expect(timeAfter?.trim()).toBe('03:00')
  })

  test('fall-back: 01:59 EDT just before clocks roll back', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    await page.goto(`/${TS_BEFORE_FALL}`)
    await enable24h(page)
    // 2026-11-01T05:59:59Z = 01:59:59 AM EDT (UTC-4)
    await selectTimezone(page, 'New York', 'New York')
    await expect(page.locator('.display-time').first()).toContainText('01:59')
    await expect(page.locator('.display-date').first()).toContainText('November')
  })

  test('fall-back: 01:00 EST just after clocks rolled back', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    await page.goto(`/${TS_AFTER_FALL}`)
    await enable24h(page)
    // 2026-11-01T06:00:01Z = 01:00:01 AM EST (UTC-5) — clocks went back to 01:00
    await selectTimezone(page, 'New York', 'New York')
    await expect(page.locator('.display-time').first()).toContainText('01:00')
  })

  test('fall-back: timestamps 2s apart show same wall-clock time (01:xx twice)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    // TS_BEFORE_FALL = 01:59:59 EDT, TS_AFTER_FALL = 01:00:01 EST
    // Both are "01:xx" because the clock rolled back — the 01:xx hour occurs twice
    await page.goto(`/${TS_BEFORE_FALL}`)
    await enable24h(page)
    await selectTimezone(page, 'New York', 'New York')
    await expect(page.locator('.display-time').first()).toContainText('01:')

    await page.goto(`/${TS_AFTER_FALL}`)
    await enable24h(page)
    await selectTimezone(page, 'New York', 'New York')
    await expect(page.locator('.display-time').first()).toContainText('01:')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Same-day vs cross-day end time display
//    sameDay is computed in the selected display timezone.
//    The display layout differs:
//      same day  → start–end on one line (`.display-time-sep` visible)
//      cross-day → ENDING: block (`.display-end-block` visible)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Same-day vs cross-day end time display', () => {
  test.use({ timezoneId: 'UTC' })

  test('same-day end time: shows range separator, no ENDING block', async ({ page }) => {
    // Both timestamps on 2026-05-30 UTC (2h apart, same day)
    const sameEnd = String(Number(TS_CROSS_START) - 4 * 3600) // 18:00 UTC, May 30
    await page.goto(`/${TS_CROSS_START}/${sameEnd}`)
    // Note: sameEnd < TS_CROSS_START here, but the URL accepts any two 10-digit timestamps.
    // Use a proper same-day pair instead:
    // 1780141020 = 2026-05-30T11:37Z, end = 2026-05-30T13:37Z
    await page.goto('/1780141020/1780148220')
    await expect(page.locator('.display-time-sep')).toBeVisible()
    await expect(page.locator('.display-end-block')).not.toBeVisible()
  })

  test('cross-midnight in UTC: shows ENDING block, no range separator', async ({ page }) => {
    // TS_CROSS_START = 2026-05-30T22:00Z, TS_CROSS_END = 2026-05-31T02:00Z
    // In UTC: different days → ENDING: block
    await page.goto(`/${TS_CROSS_START}/${TS_CROSS_END}`)
    await expect(page.locator('.display-end-block')).toBeVisible()
    await expect(page.locator('.display-time-end-label')).toContainText('Ending:')
    await expect(page.locator('.display-time-sep')).not.toBeVisible()
  })

  test('cross-midnight UTC event becomes same-day when switching to UTC+13 (Apia)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    // TS_CROSS_START = 2026-05-30T22:00Z → Pacific/Apia (UTC+13 in May): 2026-05-31T11:00
    // TS_CROSS_END   = 2026-05-31T02:00Z → Pacific/Apia (UTC+13 in May): 2026-05-31T15:00
    // Both on May 31 in Apia → same day
    await page.goto(`/${TS_CROSS_START}/${TS_CROSS_END}`)
    // Default UTC: cross-day
    await expect(page.locator('.display-end-block')).toBeVisible()
    // Switch to Pacific/Apia
    await selectTimezone(page, 'Apia', 'Apia')
    // Now both timestamps fall on May 31 in UTC+13 → same-day range
    await expect(page.locator('.display-time-sep')).toBeVisible()
    await expect(page.locator('.display-end-block')).not.toBeVisible()
  })

  test('cross-midnight UTC event stays same-day in UTC-4 (NYC, same May 30)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    // TS_CROSS_START = 2026-05-30T22:00Z → NYC (EDT, UTC-4): 2026-05-30T18:00
    // TS_CROSS_END   = 2026-05-31T02:00Z → NYC (EDT, UTC-4): 2026-05-30T22:00
    // Both on May 30 in NYC → same day
    await page.goto(`/${TS_CROSS_START}/${TS_CROSS_END}`)
    await selectTimezone(page, 'New York', 'New York')
    await expect(page.locator('.display-time-sep')).toBeVisible()
    await expect(page.locator('.display-end-block')).not.toBeVisible()
  })

  test('same-day UTC event becomes cross-day in UTC+1 (London BST in May)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'TimezoneSelect search requires desktop popover')
    // Start: 2026-05-31T00:01Z → London BST (UTC+1): 2026-05-31T01:01 (May 31)
    // End:   2026-05-31T23:30Z → London BST (UTC+1): 2026-06-01T00:30 (June 1 — next day!)
    // Both same day in UTC, but end crosses midnight in UTC+1
    const start = '1780185660' // 2026-05-31T00:01:00Z
    const end = '1780270200'   // 2026-05-31T23:30:00Z
    await page.goto(`/${start}/${end}`)
    // Default UTC: same day → range
    await expect(page.locator('.display-time-sep')).toBeVisible()
    // Switch to Europe/London (BST = UTC+1 in May)
    await selectTimezone(page, 'London', 'London')
    // End time crosses to June 1 → ENDING block
    await expect(page.locator('.display-end-block')).toBeVisible()
    await expect(page.locator('.display-time-sep')).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Calendar link URL correctness
//    Calendar links must always use UTC times regardless of selected display
//    timezone. This is the core invariant of the calendar integration.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Calendar link URL correctness', () => {
  test.use({ timezoneId: 'UTC' })

  test('calendar button present even without event data', async ({ page }) => {
    await page.goto(`/${TS_SUMMER}`)
    await expect(page.locator('.cal-btn')).toBeVisible()
  })

  test('calendar button present when name param is provided', async ({ page }) => {
    await page.goto(`/${TS_SUMMER}?name=Test+Event`)
    await revealCalendar(page)
    await expect(page.locator('.cal-btn')).toBeVisible()
  })

  test('calendar button present for end-timestamp-only (no name)', async ({ page }) => {
    const end = String(Number(TS_SUMMER) + 3600)
    await page.goto(`/${TS_SUMMER}/${end}`)
    await revealCalendar(page)
    await expect(page.locator('.cal-btn')).toBeVisible()
  })

  test('calendar button present for description-only (no name)', async ({ page }) => {
    await page.goto(`/${TS_SUMMER}?description=Details+here`)
    await revealCalendar(page)
    await expect(page.locator('.cal-btn')).toBeVisible()
  })

  test('Google Calendar URL contains correct UTC start time', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'dropdown unavailable on mobile')
    await page.goto(`/${TS_SUMMER}?name=UTC+Test`)
    // 2024-05-31T12:00:00Z → Google format: 20240531T120000Z
    await page.locator('.cal-btn').click()
    const href = await page.locator('.cal-dropdown a').filter({ hasText: 'Google Calendar' }).getAttribute('href')
    expect(href).toContain('20240531T120000Z')
  })

  test('Google URL with end timestamp contains correct UTC end time', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'dropdown unavailable on mobile')
    const end = String(Number(TS_SUMMER) + 3600)
    await page.goto(`/${TS_SUMMER}/${end}?name=Timed+Event`)
    // Start: 2024-05-31T12:00Z, End: 2024-05-31T13:00Z
    await page.locator('.cal-btn').click()
    const href = await page.locator('.cal-dropdown a').filter({ hasText: 'Google Calendar' }).getAttribute('href')
    expect(href).toContain('20240531T120000Z')
    expect(href).toContain('20240531T130000Z')
  })

  test('Outlook.com URL uses UTC ISO format with Z suffix', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'dropdown unavailable on mobile')
    await page.goto(`/${TS_SUMMER}?name=UTC+Test`)
    await page.locator('.cal-btn').click()
    const href = await page.locator('.cal-dropdown a').filter({ hasText: 'Outlook.com' }).getAttribute('href')
    // Must contain Z-suffixed UTC datetime, not local browser time
    expect(href).toContain('startdt=2024-05-31T12%3A00%3A00Z')
  })

  test('Office 365 URL uses UTC ISO format with Z suffix', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'dropdown unavailable on mobile')
    await page.goto(`/${TS_SUMMER}?name=UTC+Test`)
    await page.locator('.cal-btn').click()
    const href = await page.locator('.cal-dropdown a').filter({ hasText: 'Office 365' }).getAttribute('href')
    expect(href).toContain('startdt=2024-05-31T12%3A00%3A00Z')
  })

  test('calendar URLs are unaffected by the selected display timezone', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'dropdown unavailable on mobile')
    await page.goto(`/${TS_SUMMER}?name=TZ+Test`)
    await enable24h(page)
    // Switch to Tokyo — display shows 21:00 but calendar links must still use UTC 12:00
    await selectTimezone(page, 'Tokyo', 'Tokyo')
    await expect(page.locator('.display-time').first()).toContainText('21:00')
    await page.locator('.cal-btn').click()
    const href = await page.locator('.cal-dropdown a').filter({ hasText: 'Google Calendar' }).getAttribute('href')
    // UTC timestamp, not Tokyo local time
    expect(href).toContain('20240531T120000Z')
    expect(href).not.toContain('20240531T210000') // Tokyo 21:00 must NOT appear
  })

  test('Yahoo Calendar URL also uses UTC start time', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'dropdown unavailable on mobile')
    await page.goto(`/${TS_SUMMER}?name=Yahoo+Test`)
    await page.locator('.cal-btn').click()
    const href = await page.locator('.cal-dropdown a').filter({ hasText: 'Yahoo' }).getAttribute('href')
    expect(href).toContain('20240531T120000Z')
  })

  test('cross-day calendar event: end date in Google URL is the next UTC day', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'dropdown unavailable on mobile')
    // TS_CROSS_START = 2026-05-30T22:00Z, TS_CROSS_END = 2026-05-31T02:00Z
    await page.goto(`/${TS_CROSS_START}/${TS_CROSS_END}?name=Late+Night+Event`)
    await page.locator('.cal-btn').click()
    const href = await page.locator('.cal-dropdown a').filter({ hasText: 'Google Calendar' }).getAttribute('href')
    // Start: May 30 22:00 UTC; End: May 31 02:00 UTC
    expect(href).toContain('20260530T220000Z')
    expect(href).toContain('20260531T020000Z')
  })

  test('DST spring-forward: calendar uses UTC time, not the wall-clock gap hour', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'dropdown unavailable on mobile')
    // TS_AFTER_SPRING = 2026-03-08T07:00:01Z = 03:00:01 EDT
    // The calendar entry must use the UTC timestamp, not any local 02:xx time
    await page.goto(`/${TS_AFTER_SPRING}?name=Post+DST+Event`)
    await page.locator('.cal-btn').click()
    const href = await page.locator('.cal-dropdown a').filter({ hasText: 'Google Calendar' }).getAttribute('href')
    expect(href).toContain('20260308T070001Z')
    // 02:xx is the skipped (non-existent) hour — must never appear in UTC
    expect(href).not.toContain('T020')
  })
})
