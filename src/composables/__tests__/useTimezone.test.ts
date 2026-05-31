import { describe, it, expect, beforeEach, vi } from 'vitest'
import { searchZones, regions, allZones } from '../useTimezone'

// ── useRecentZones ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
})

async function freshRecent() {
  const mod = await import('../useTimezone')
  return mod.useRecentZones()
}

describe('useRecentZones', () => {
  it('starts empty when localStorage is empty', async () => {
    const { recentZones } = await freshRecent()
    expect(recentZones.value).toEqual([])
  })

  it('addRecentZone adds a zone', async () => {
    const { recentZones, addRecentZone } = await freshRecent()
    addRecentZone('America/New_York')
    expect(recentZones.value).toEqual(['America/New_York'])
  })

  it('most recently added zone is first', async () => {
    const { recentZones, addRecentZone } = await freshRecent()
    addRecentZone('America/New_York')
    addRecentZone('Europe/Amsterdam')
    expect(recentZones.value[0]).toBe('Europe/Amsterdam')
    expect(recentZones.value[1]).toBe('America/New_York')
  })

  it('deduplicates: re-adding an existing zone moves it to front', async () => {
    const { recentZones, addRecentZone } = await freshRecent()
    addRecentZone('America/New_York')
    addRecentZone('Europe/Amsterdam')
    addRecentZone('America/New_York')
    expect(recentZones.value).toEqual(['America/New_York', 'Europe/Amsterdam'])
  })

  it('trims to 4 entries', async () => {
    const { recentZones, addRecentZone } = await freshRecent()
    addRecentZone('America/New_York')
    addRecentZone('Europe/Amsterdam')
    addRecentZone('Asia/Tokyo')
    addRecentZone('Australia/Sydney')
    addRecentZone('Africa/Cairo')
    expect(recentZones.value).toHaveLength(4)
    expect(recentZones.value[0]).toBe('Africa/Cairo')
    expect(recentZones.value).not.toContain('America/New_York')
  })

  it('persists to localStorage', async () => {
    const { addRecentZone } = await freshRecent()
    addRecentZone('Europe/Amsterdam')
    const stored = JSON.parse(localStorage.getItem('zonestamp:recentZones')!)
    expect(stored).toEqual(['Europe/Amsterdam'])
  })

  it('loads from localStorage on import', async () => {
    localStorage.setItem(
      'zonestamp:recentZones',
      JSON.stringify(['Europe/Amsterdam', 'Asia/Tokyo']),
    )
    const { recentZones } = await freshRecent()
    expect(recentZones.value).toEqual(['Europe/Amsterdam', 'Asia/Tokyo'])
  })

  it('ignores invalid zone names in localStorage', async () => {
    localStorage.setItem(
      'zonestamp:recentZones',
      JSON.stringify(['Not/AZone', 'Europe/Amsterdam']),
    )
    const { recentZones } = await freshRecent()
    expect(recentZones.value).toEqual(['Europe/Amsterdam'])
  })

  it('returns empty array for malformed localStorage value', async () => {
    localStorage.setItem('zonestamp:recentZones', 'not-json')
    const { recentZones } = await freshRecent()
    expect(recentZones.value).toEqual([])
  })
})

describe('regions', () => {
  it('has 10 regions', () => {
    expect(regions).toHaveLength(10)
  })

  it('contains expected regions', () => {
    expect(regions).toContain('Africa')
    expect(regions).toContain('America')
    expect(regions).toContain('Asia')
    expect(regions).toContain('Europe')
    expect(regions).toContain('Pacific')
  })

  it('is sorted by zone count descending — America first, Arctic last', () => {
    expect(regions[0]).toBe('America')
    expect(regions[regions.length - 1]).toBe('Arctic')
  })
})

describe('searchZones', () => {
  it('returns all zones for empty query', () => {
    expect(searchZones('')).toEqual(allZones)
  })

  it('matches zone by name fragment', () => {
    expect(searchZones('york')).toContain('America/New_York')
  })

  it('matches multi-word query mapping to underscore zone name', () => {
    expect(searchZones('new york')).toContain('America/New_York')
  })

  it('matches region name prefix', () => {
    const result = searchZones('europe')
    expect(result.length).toBeGreaterThan(10)
    // All Europe/ zones must be present; non-Europe zones using European time standards are also valid matches
    const europeanZones = allZones.filter((z) => z.startsWith('Europe/'))
    europeanZones.forEach((z) => expect(result).toContain(z))
  })

  it('is case-insensitive', () => {
    expect(searchZones('YORK')).toContain('America/New_York')
    expect(searchZones('York')).toContain('America/New_York')
  })

  it('matches via Intl display name — india → Asia/Calcutta', () => {
    expect(searchZones('india')).toContain('Asia/Calcutta')
  })

  it('matches via Intl display name — eastern → America/New_York', () => {
    expect(searchZones('eastern')).toContain('America/New_York')
  })

  it('matches via Intl display name — central european → Europe/Berlin', () => {
    expect(searchZones('central european')).toContain('Europe/Berlin')
  })

  it('returns empty array for no matches', () => {
    expect(searchZones('zzznomatch999')).toHaveLength(0)
  })

  it('does not return duplicate zones', () => {
    const result = searchZones('amsterdam')
    expect(new Set(result).size).toBe(result.length)
  })
})

describe('searchZones — ranking', () => {
  it('current zone is ranked first when it matches the query', () => {
    const results = searchZones('new', 'America/New_York')
    expect(results[0]).toBe('America/New_York')
  })

  it('city prefix match ranks above city substring match', () => {
    // 'amst' is a prefix of city 'amsterdam' (+3) but only a substring in other zone names (+2)
    const results = searchZones('amst')
    const amsterdam = results.indexOf('Europe/Amsterdam')
    expect(amsterdam).toBeGreaterThanOrEqual(0)
    // Every result ranked above Amsterdam must also be a prefix match (score >= 3)
    results.slice(0, amsterdam).forEach((z) => {
      const city = z.split('/').at(-1)!.toLowerCase().replace(/_/g, ' ')
      expect(city.startsWith('amst')).toBe(true)
    })
  })

  it('exact abbreviation match finds zone not otherwise reachable — hst → Pacific/Honolulu', () => {
    // 'hst' does not appear in city 'honolulu', path 'pacific/honolulu',
    // or display name 'Hawaii-Aleutian Time' — only in the short abbreviation
    const results = searchZones('hst')
    expect(results).toContain('Pacific/Honolulu')
  })

  it('exact abbreviation match is case-insensitive', () => {
    expect(searchZones('HST')).toContain('Pacific/Honolulu')
  })

  it('exact abbreviation match outranks display-name-only match', () => {
    // Pacific/Honolulu has abbreviation HST — score +3
    // Any zone that only matches via display name gets at most +1
    const results = searchZones('hst')
    const honoluluIdx = results.indexOf('Pacific/Honolulu')
    expect(honoluluIdx).toBeGreaterThanOrEqual(0)
    // All zones ranked above Honolulu must also have 'hst' as their abbreviation
    results.slice(0, honoluluIdx).forEach((z) => {
      const abbr = new Intl.DateTimeFormat('en', { timeZone: z, timeZoneName: 'short' })
        .formatToParts(new Date())
        .find((p) => p.type === 'timeZoneName')?.value?.toLowerCase() ?? ''
      expect(abbr).toBe('hst')
    })
  })
})
