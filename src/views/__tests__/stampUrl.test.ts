import { describe, it, expect } from 'vitest'
import { DateTime } from 'luxon'

// Regression tests: known timestamps must display the correct local time in a given zone.
// These values were verified against the old React/moment-timezone app.

const cases: { ts: number; zone: string; expectedDate: string; expectedHour: number; expectedMinute: number }[] = [
  // 2024-05-31 12:00:00 UTC
  { ts: 1717156800, zone: 'UTC', expectedDate: '2024-05-31', expectedHour: 12, expectedMinute: 0 },
  // same moment in New York (UTC-4 in summer)
  { ts: 1717156800, zone: 'America/New_York', expectedDate: '2024-05-31', expectedHour: 8, expectedMinute: 0 },
  // same moment in Amsterdam (UTC+2 in summer)
  { ts: 1717156800, zone: 'Europe/Amsterdam', expectedDate: '2024-05-31', expectedHour: 14, expectedMinute: 0 },
  // same moment in Tokyo (UTC+9, no DST)
  { ts: 1717156800, zone: 'Asia/Tokyo', expectedDate: '2024-05-31', expectedHour: 21, expectedMinute: 0 },
  // late afternoon UTC — previous day in New York would be evening
  { ts: 1717200000, zone: 'America/New_York', expectedDate: '2024-05-31', expectedHour: 20, expectedMinute: 0 },
]

describe('timestamp → DateTime conversion', () => {
  for (const { ts, zone, expectedDate, expectedHour, expectedMinute } of cases) {
    it(`ts=${ts} in ${zone}`, () => {
      const dt = DateTime.fromSeconds(ts).setZone(zone)
      expect(dt.toFormat('yyyy-MM-dd')).toBe(expectedDate)
      expect(dt.hour).toBe(expectedHour)
      expect(dt.minute).toBe(expectedMinute)
    })
  }
})

describe('stamp URL unix integer round-trip', () => {
  it('DateTime.toUnixInteger() round-trips through fromSeconds()', () => {
    const ts = 1717156800
    const dt = DateTime.fromSeconds(ts).setZone('America/New_York')
    expect(dt.toUnixInteger()).toBe(ts)
  })

  it('keepLocalTime zone switch preserves wall-clock time but changes unix ts', () => {
    const dt = DateTime.fromSeconds(1717156800).setZone('UTC')
    const shifted = dt.setZone('America/New_York', { keepLocalTime: true })
    expect(shifted.hour).toBe(dt.hour)
    expect(shifted.minute).toBe(dt.minute)
    expect(shifted.toUnixInteger()).not.toBe(dt.toUnixInteger())
  })
})
