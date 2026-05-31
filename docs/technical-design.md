# Zonestamp — Technical Design

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Vue 3 + Composition API | SFCs with `<script setup>` |
| Build tool | Vite + TypeScript | `vue-tsc` for type checking |
| Routing | Vue Router 4 | `createWebHistory('/')` — requires server-side rewrite to `index.html` |
| Date/time | Luxon `DateTime` | Locale formatting via native `Intl` — no locale bundle loading |
| Date picker | `@vuepic/vue-datepicker` v13 | Named export `{ VueDatePicker }`, themed via `--dp-*` CSS variables |
| Timezone data | `Intl.supportedValuesOf('timeZone')` | Browser-native, no third-party data bundle |
| Timezone combobox | Custom component on Reka UI | `TimezoneSelect.vue` — native `<dialog>` on mobile, `PopoverAnchor` dropdown on desktop |
| Calendar links | `calendar-link` npm package | Wrapped in `useCalendarLinks.ts` composable |
| i18n | `vue-i18n` v9 | Translation files in `src/i18n/` |
| CSS | Tailwind CSS v4 + CSS custom properties | CSS-first config; brand tokens and third-party widget theming via custom properties |

## URL Contract (do not break)

| URL pattern | Behavior |
|---|---|
| `/` | CreateStamp view |
| `/{10-digit-unix-timestamp}` | StampDisplay view |
| `/{ts}/{endts}` | StampDisplay with end time (both 10-digit unix timestamps) |
| `/{timestamp}?name=...` | StampDisplay: event name (shown as `<h1>`, passed to calendar) |
| `/{timestamp}?description=...` | StampDisplay: event description |
| `/{timestamp}?url=...` | StampDisplay: event URL |
| `/{timestamp}?location=...` | StampDisplay: event location |
| `/{timestamp}?enddate={timestamp}` | StampDisplay: end time (legacy query param — new app uses path segment) |
| `/anything-else` | NotFound view |
| `/{fewer-than-10-digits}` | NotFound (4, 5, 9 digit numbers are not valid stamps) |

Vue Router route for StampDisplay: `/:timestamp(\\d{10})/:endtimestamp(\\d{10})?` — both segments match exactly 10 digits; end segment is optional.

## Component tree

```
main.ts
└── App.vue (router-view wrapper)
    └── AppLayout.vue (header + footer + <slot>)
        ├── AppHeader.vue
        │   └── AppMenu.vue (slide-in settings panel)
        ├── [router-view]
        │   ├── CreateStampView.vue
        │   │   ├── VueDatePicker (date-only)
        │   │   ├── VueDatePicker (time-only)
        │   │   └── TimezoneSelect.vue
        │   ├── StampDisplayView.vue
        │   │   ├── TimezoneSelect.vue
        │   │   └── CalendarButton (custom: fullscreen dialog on mobile, dropdown on desktop)
        │   └── NotFoundView.vue
        └── AppFooter.vue
```

## Composables

### `useStorage.ts`
- `lsGet(key): string | null` — localStorage read with try/catch
- `lsSet(key, value): void` — localStorage write with try/catch
- Safe when localStorage is disabled or quota is exceeded

### `useTimezone.ts`
- `allZones: string[]` — `Intl.supportedValuesOf('timeZone')`
- `regions: string[]` — unique top-level prefixes, sorted by zone count descending
- `detectedZone: Ref<string>` — from `Intl.DateTimeFormat().resolvedOptions().timeZone`
- `zoneAbbr(zone): string` — pre-computed short timezone abbreviation (e.g. "CEST", "EDT"); falls back to "GMT±N" in environments with limited ICU data
- `searchZones(query, currentZone?): string[]` — ranked results (see search ranking below)
- `useRecentZones()` — returns `{ recentZones: Ref<string[]>, addRecentZone(zone) }`. Persists last 4 used zones to `zonestamp:recentZones`; deduplicates; validates on load against `allZones`

### `useTimeFormat.ts`
- `is24h: Ref<boolean>` — persisted to `zonestamp:is24h` in localStorage
- `toggleFormat(): void`
- `formatTime(dt: DateTime): string` — locale-aware 12h or 24h time string
- `formatDate(dt: DateTime): string` — locale-aware full date string
- Locale from `navigator.language`

### `useCalendarLinks.ts`
Wraps `calendar-link`. Accepts `{ title, startTs, endTs, description, location, url }` refs; returns `googleUrl`, `outlookUrl`, `office365Url`, `yahooUrl`, `icsUrl`, `icsFilename` computeds.

### `useMenu.ts`
Module-level singleton `isMenuOpen` ref. `toggleMenu()` / `closeMenu()`. Focus management: moves focus to close button on open, returns to trigger on close.

### `useMobileDetection.ts`
`window.matchMedia('(max-width: 639px) and (min-resolution: 2dppx)')` — pixel density check excludes desktop browsers at narrow viewport width while catching real mobile devices at 2×/3× DPR.

## Search ranking

`searchZones(query, currentZone?)` scores each zone and returns results sorted by score descending, then alphabetically:

| Criterion | Score |
|---|---|
| Exact short abbreviation match (e.g. "HST") | +3 |
| City name prefix match | +3 |
| City name substring match | +2 |
| Intl long display name contains query | +1 |
| Zone path (lowercased, underscores→spaces) contains query | +1 |
| Is the current zone (only when already matching) | +4 |

Short abbreviations are pre-computed at module load via `Intl.DateTimeFormat` with `timeZoneName: 'short'`. In environments with limited ICU (e.g. headless Chromium), non-North-American zones may return "GMT±N" — the scoring comparison is case-insensitive and exact.

## Data flow: Stamp URL → display

```
Route param :timestamp (string)
  → parseInt(timestamp, 10) (number)
  → DateTime.fromSeconds(n) (Luxon UTC DateTime)
  → .setZone(displayZone) (zone-aware DateTime)
  → formatTime(dt) + formatDate(dt) (locale strings for display)
```

## Data flow: CreateStamp → URL

```
User selects date (VueDatePicker) → updates dt.value date components
User selects time (VueDatePicker) → updates dt.value time components
User selects timezone → dt.value = dt.value.setZone(newZone, { keepLocalTime: true })
User clicks "Generate Stamp" → window.location.origin + '/' + dt.value.toUnixInteger()
```

`keepLocalTime: true` preserves the wall-clock time the user entered when they change timezone.

## Non-scoped styles

Two components require non-scoped `<style>` blocks because their popover/picker content is teleported outside the component DOM subtree:

- `CreateStampView.vue` — `--dp-*` CSS variables for VueDatePicker theming
- `TimezoneSelect.vue` — `.tz-content` styles for the desktop Reka UI popover

Scoped CSS does not reach teleported elements.

## Deployment: Toolforge

- Production URL: `https://zonestamp.toolforge.org` (`zonestamp.com` redirects here)
- Deployment repo: `/Users/hartman/Development/zonestamp-toolforge` (Ansible-based)
- The Toolforge webservice must rewrite all paths to `index.html` for Vue Router history mode
- Toolforge build: `npm run build -- --mode toolforge` (uses `tools-static.wmflabs.org/fontcdn` instead of Google Fonts via `.env.toolforge`)

### Environment variables

| Variable | Default (`.env`) | Toolforge (`.env.toolforge`) | Purpose |
|---|---|---|---|
| `VITE_FONT_CDN_HOST` | `fonts.googleapis.com` | `tools-static.wmflabs.org/fontcdn` | Font CDN host for Lobster + Quicksand |
| `VITE_CANONICAL_URL` | `http://localhost:5173` | `https://zonestamp.toolforge.org` | Base URL for `<link rel="canonical">` and `og:url` |

**Status**: deployment configuration not yet wired to the new build output. Requires inspecting the Toolforge deployment repo, updating the dist path, and verifying the SPA rewrite rule.
