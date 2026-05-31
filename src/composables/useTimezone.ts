import { ref } from 'vue'
import { DateTime } from 'luxon'
import { lsGet, lsSet } from './useStorage'

export const allZones: string[] = Intl.supportedValuesOf('timeZone')

// Regions sorted by number of zones they contain, descending
const HIDDEN_REGIONS = new Set(['Etc', 'UTC'])

export const regions: string[] = [...new Set(allZones.map((z) => z.split('/')[0]))]
  .filter((r) => !HIDDEN_REGIONS.has(r))
  .sort((a, b) => {
    const aCount = allZones.filter((z) => z.startsWith(a + '/')).length
    const bCount = allZones.filter((z) => z.startsWith(b + '/')).length
    return bCount - aCount
  })

// Pre-compute Intl display name and short abbreviation per zone once
const _now = new Date()
const _displayNames = new Map<string, string>()
const _shortNames = new Map<string, string>()

for (const zone of allZones) {
  const getPart = (fmt: 'longGeneric' | 'short') =>
    new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: fmt })
      .formatToParts(_now)
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  _displayNames.set(zone, getPart('longGeneric').toLowerCase())
  _shortNames.set(zone, getPart('short')) // original case — used for display
}

export function zoneAbbr(zone: string): string {
  return _shortNames.get(zone) ?? ''
}

export function tzOffset(zone: string): string {
  const offset = DateTime.now().setZone(zone).offset
  const sign = offset >= 0 ? '+' : '-'
  const h = Math.floor(Math.abs(offset) / 60)
  const m = Math.abs(offset) % 60
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, '0')}`
}

export function zoneTriggerLabel(zone: string): string {
  if (!zone) return ''
  if (zone === 'UTC') return 'UTC'
  const parts = zone.split('/')
  const city = parts[parts.length - 1].replace(/_/g, ' ')
  const subregion = parts.length === 3 ? parts[1] : null
  const region = subregion ?? (parts.length === 2 ? parts[0] : null)
  const abbr = zoneAbbr(zone)
  const abbrSuffix = abbr && !/^GMT[+-]/i.test(abbr) ? ` (${abbr})` : ''
  const label = region ? `${city} (${region.replace(/_/g, ' ')})` : city
  return `${label} · ${tzOffset(zone)}${abbrSuffix}`
}

export function searchZones(query: string, currentZone?: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return allZones

  const scored: { zone: string; score: number }[] = []

  for (const zone of allZones) {
    let score = 0
    const parts = zone.split('/')
    const city = parts[parts.length - 1].toLowerCase().replace(/_/g, ' ')
    const zonePath = zone.toLowerCase().replace(/_/g, ' ')

    if (_shortNames.get(zone)?.toLowerCase() === q) score += 6
    if (city.startsWith(q)) score += 3
    else if (city.includes(q)) score += 2
    if (_displayNames.get(zone)!.includes(q)) score += 1
    if (zonePath.includes(q)) score += 1
    // Current zone bonus only applies when the zone already matches
    if (score > 0 && currentZone && zone === currentZone) score += 4

    if (score > 0) scored.push({ zone, score })
  }

  scored.sort((a, b) => b.score - a.score || a.zone.localeCompare(b.zone))
  return scored.map((s) => s.zone)
}

export function useTimezone() {
  const detectedZone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone)
  return { detectedZone, allZones, regions }
}

// ── Recent zones ───────────────────────────────────────────────────────────────

const LS_RECENT_KEY = 'zonestamp:recentZones'
const MAX_RECENT = 4

function loadRecentZones(): string[] {
  try {
    const raw = lsGet(LS_RECENT_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as unknown[])
      .filter((z): z is string => typeof z === 'string' && allZones.includes(z))
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

const _recentZones = ref<string[]>(loadRecentZones())

export function useRecentZones() {
  function addRecentZone(zone: string) {
    const without = _recentZones.value.filter((z) => z !== zone)
    _recentZones.value = [zone, ...without].slice(0, MAX_RECENT)
    lsSet(LS_RECENT_KEY, JSON.stringify(_recentZones.value))
  }
  return { recentZones: _recentZones, addRecentZone }
}
