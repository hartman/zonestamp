import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed } from 'vue'
import { DateTime } from 'luxon'

// Reset module and localStorage between tests so the module-level `is24h` ref starts fresh
beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
})

async function fresh() {
  const mod = await import('../useTimeFormat')
  return mod.useTimeFormat()
}

const noon = DateTime.fromObject({ year: 2024, month: 6, day: 15, hour: 12, minute: 0 }, { zone: 'UTC' })
const midnight = DateTime.fromObject({ year: 2024, month: 6, day: 15, hour: 0, minute: 0 }, { zone: 'UTC' })
const quarter = DateTime.fromObject({ year: 2024, month: 6, day: 15, hour: 14, minute: 30 }, { zone: 'UTC' })

describe('toggleFormat', () => {
  it('starts as 12h', async () => {
    const { is24h } = await fresh()
    expect(is24h.value).toBe(false)
  })

  it('toggles to 24h', async () => {
    const { is24h, toggleFormat } = await fresh()
    toggleFormat()
    expect(is24h.value).toBe(true)
  })

  it('toggles back to 12h', async () => {
    const { is24h, toggleFormat } = await fresh()
    toggleFormat()
    toggleFormat()
    expect(is24h.value).toBe(false)
  })
})

describe('formatTime — 12h', () => {
  it('noon shows 12:00 PM', async () => {
    const { formatTime } = await fresh()
    expect(formatTime(noon)).toMatch(/12:00/)
    expect(formatTime(noon)).toMatch(/PM|pm/i)
  })

  it('midnight shows 12:00 AM', async () => {
    const { formatTime } = await fresh()
    expect(formatTime(midnight)).toMatch(/12:00/)
    expect(formatTime(midnight)).toMatch(/AM|am/i)
  })

  it('quarter past two shows 2:30 PM', async () => {
    const { formatTime } = await fresh()
    expect(formatTime(quarter)).toMatch(/2:30/)
    expect(formatTime(quarter)).toMatch(/PM|pm/i)
  })
})

describe('formatTime — 24h', () => {
  it('noon shows 12:00', async () => {
    const { formatTime, toggleFormat } = await fresh()
    toggleFormat()
    expect(formatTime(noon)).toMatch(/12:00/)
    expect(formatTime(noon)).not.toMatch(/AM|PM/i)
  })

  it('midnight shows 00:00 or 24:00', async () => {
    const { formatTime, toggleFormat } = await fresh()
    toggleFormat()
    // Intl implementations vary: some render midnight as 00:00, others as 24:00
    expect(formatTime(midnight)).toMatch(/00:00|24:00/)
  })

  it('quarter past two shows 14:30', async () => {
    const { formatTime, toggleFormat } = await fresh()
    toggleFormat()
    expect(formatTime(quarter)).toMatch(/14:30/)
  })
})

describe('localStorage persistence', () => {
  it('starts as 12h when localStorage is empty', async () => {
    const { is24h } = await fresh()
    expect(is24h.value).toBe(false)
  })

  it('starts as 24h when localStorage has is24h=true', async () => {
    localStorage.setItem('zonestamp:is24h', 'true')
    const { is24h } = await fresh()
    expect(is24h.value).toBe(true)
  })

  it('writes true to localStorage when toggled to 24h', async () => {
    const { toggleFormat } = await fresh()
    toggleFormat()
    expect(localStorage.getItem('zonestamp:is24h')).toBe('true')
  })

  it('writes false to localStorage when toggled back to 12h', async () => {
    const { toggleFormat } = await fresh()
    toggleFormat()
    toggleFormat()
    expect(localStorage.getItem('zonestamp:is24h')).toBe('false')
  })
})

describe('formatDate', () => {
  it('includes the day of week', async () => {
    const { formatDate } = await fresh()
    // June 15, 2024 is a Saturday
    expect(formatDate(noon)).toMatch(/Saturday/i)
  })

  it('includes the year', async () => {
    const { formatDate } = await fresh()
    expect(formatDate(noon)).toMatch(/2024/)
  })

  it('includes the month name', async () => {
    const { formatDate } = await fresh()
    expect(formatDate(noon)).toMatch(/June/i)
  })
})

describe('reactivity — computed wrapping formatTime/formatDate', () => {
  // Regression: CreateStampView used to inline format options, ignoring the composable's
  // reactive state. These tests verify that a computed() using formatTime/formatDate
  // reflects format changes without needing to re-call the composable.
  it('displayTime computed updates when format is toggled to 24h', async () => {
    const { formatTime, toggleFormat } = await fresh()
    const displayTime = computed(() => formatTime(noon))
    expect(displayTime.value).toMatch(/PM|pm/i)
    toggleFormat()
    expect(displayTime.value).not.toMatch(/AM|PM/i)
  })

  it('displayTime computed updates when format is toggled back to 12h', async () => {
    const { formatTime, toggleFormat } = await fresh()
    const displayTime = computed(() => formatTime(noon))
    toggleFormat()
    toggleFormat()
    expect(displayTime.value).toMatch(/PM|pm/i)
  })

  it('displayDate computed updates when locale changes', async () => {
    const { formatDate, setLocale } = await fresh()
    const displayDate = computed(() => formatDate(noon))
    setLocale('en-US')
    expect(displayDate.value).toMatch(/June/i)
    setLocale('de-DE')
    expect(displayDate.value).toMatch(/Juni/i)
  })
})

describe('locale', () => {
  it('starts with empty locale (browser default)', async () => {
    const { locale } = await fresh()
    expect(locale.value).toBe('')
  })

  it('setLocale persists to localStorage', async () => {
    const { setLocale } = await fresh()
    setLocale('de-DE')
    expect(localStorage.getItem('zonestamp:locale')).toBe('de-DE')
  })

  it('starts with persisted locale from localStorage', async () => {
    localStorage.setItem('zonestamp:locale', 'fr-FR')
    const { locale } = await fresh()
    expect(locale.value).toBe('fr-FR')
  })

  it('setLocale updates locale ref', async () => {
    const { locale, setLocale } = await fresh()
    setLocale('ja-JP')
    expect(locale.value).toBe('ja-JP')
  })

  it('formatDate changes with locale', async () => {
    const { formatDate, setLocale } = await fresh()
    setLocale('en-US')
    expect(formatDate(noon)).toMatch(/June/)
  })
})
