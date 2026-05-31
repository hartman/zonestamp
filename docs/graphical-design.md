# Zonestamp — Graphical Design

## Design principles

1. **Mobile-first**: Design and test at 390px width first. Desktop is additive.
2. **Preserve identity**: The teal/white palette and Lobster + Quicksand fonts are the brand. Existing users should recognize it instantly.
3. **Above the fold on mobile**: All critical content and primary actions must be visible without scrolling on typical phone sizes (360–430px wide).
4. **Visual hierarchy**: The time display on StampDisplay is the most important element — it must dominate. On CreateStamp, the date/time pickers are the primary action area.

## Color palette

All colors are defined as CSS custom properties in `src/assets/tokens.css` and must always be referenced by token — never hardcoded.

| Token | Value | Usage |
|---|---|---|
| `--primary-teal-color` | `#0c7fa2` | Page background, primary brand color |
| `--primary-white-color` | `#fff` | Text, icon fills |
| `--muted-white-color` | `rgba(255, 255, 255, 0.85)` | Secondary text, borders, primary button background |
| `--white-alpha-10` … `--white-alpha-80` | `rgba(255,255,255, 0.10…0.80)` | Layered overlays, input backgrounds, hover states |
| `--shadow-color` | — | Box shadows |

## Typography

| Token | Value | Usage |
|---|---|---|
| `--decorative-font-family` | `'Lobster', cursive` | App header ("zoneStamp!"), primary CTA button label |
| `--primary-font-family` | `'Quicksand', sans-serif` | All body text; bold weight for time display and event title |

Fonts are loaded from Google Fonts (dev/prod) or `tools-static.wmflabs.org/fontcdn` (Toolforge build): `Lobster` + `Quicksand:wght@400;700`.

## Layout

**Content max-width**: `600px`, centered, `1rem` side padding.

**App chrome**:
- Header: "zoneStamp!" in Lobster at `1.5rem`, white, links to `/`. `border-bottom: 1px solid var(--white-alpha-20)`.
- Footer: attribution text, small font, pushed to bottom of viewport with flexbox. `border-top: 1px solid var(--white-alpha-20)`.

## CreateStamp layout (mobile, 390px)

```
┌─────────────────────────────────┐
│  zoneStamp!                     │  ← Header (Lobster, compact)
├─────────────────────────────────┤
│                                 │
│  The event will take place on   │
│                                 │
│  [  May 30, 2026  ] at [ 3:00 ] │  ← Date + time pickers side by side
│                                 │
│  [  Europe/Amsterdam     ▼   ]  │  ← Timezone combobox (full width)
│                                 │
│  [+]  Show event options        │  ← Options toggle (expands panel below)
│                                 │
│  [     Generate Stamp!      ]   │  ← Primary CTA (Lobster, full width)
│                                 │
│  ┌─────────────────────────┐   │  ← Stamp callout (after generate)
│  │ https://zonestamp.../.. │ ⎘ │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## StampDisplay layout (mobile, 390px)

```
┌─────────────────────────────────┐
│  zoneStamp!                [☰] │  ← Header + menu button
├─────────────────────────────────┤
│                                 │
│  That's...          (or <h1>)  │  ← Subhead, or event name as h1
│                                 │
│         3:00 PM          [24h]  │  ← Large time display + format toggle
│                                 │
│  Thursday, May 30, 2026         │  ← Date line
│                                 │
│  [  Europe/Amsterdam     ▼   ]  │  ← Timezone combobox
│                                 │
│  ↓ scroll: UTC time, Add to Calendar
└─────────────────────────────────┘
```

On mobile, a swipe-up gesture collapses the time display to a compact sticky header. Swipe-down restores.

## Component visual specs

### Buttons
- **Primary** (Generate Stamp): `background: var(--muted-white-color)`, `color: var(--primary-teal-color)`, `border-radius: 6px`, `font-family: var(--decorative-font-family)`, full width on mobile
- **Secondary** (12/24h toggle): `background: var(--white-alpha-15)`, `color: var(--muted-white-color)`, `border: 1px solid var(--muted-white-color)`, `border-radius: 4px`
- **Copy button**: `background: var(--muted-white-color)`, `color: var(--primary-teal-color)`, `border: none`, `border-radius: 4px` — SVG clipboard icon (20×20px), no text label
- **Focus/hover**: swap to `var(--primary-white-color)` background; all interactive elements have `:focus-visible` styles

### Date/time pickers

Desktop: `@vuepic/vue-datepicker` v13, themed via `--dp-*` CSS variables in a non-scoped `<style>` block (picker menus are teleported to `<body>`). Dark teal theme — pickers match the app's visual language.

Mobile: native `<input type="date">` and `<input type="time">` elements, styled to match the desktop trigger appearance.

Both: bordered pill style — `background: var(--white-alpha-12)`, `border: 1px solid var(--muted-white-color)`, `border-radius: 6px`.

### Timezone combobox

Full width on mobile. `background: var(--white-alpha-12)`, `color: white`, `border: 1px solid var(--muted-white-color)`, `border-radius: 6px`. Trigger shows selected zone with a chevron icon.

Label format: `Europe/Amsterdam · UTC+2` (city name + UTC offset). On the secondary level and in search results: `City (Region) · UTC+offset (ABBR)`.

Desktop: Reka UI `PopoverAnchor` dropdown. Mobile: native `<dialog>` fullscreen modal.

### Stamp callout (CreateStamp)

Speech-bubble arrow pointing up at the Generate button. URL text is a clickable link, truncated with `text-overflow: ellipsis`. Copy button (SVG clipboard, white background) to the right.

### Time display (StampDisplay)

Quicksand 700 (bold), very large — `clamp`-based font size scaling with viewport width. White. Dominates the above-fold area. When an end-time range is shown, both times fit on one line via `white-space: nowrap` + `vw`-based clamp.

### Add-to-calendar

Custom calendar button: fullscreen `<dialog>` on mobile, dropdown on desktop. Styled white background / teal text to match the design system. Shows when any event data (name, description, location, url, or end timestamp) is present.

## Reference screenshots

`docs/screenshots/approved-design-mobile.png` — approved design mockup showing both views (390px). This is the design baseline.

`docs/screenshots/current-*.png` — current implementation captures. Use these as the benchmark when evaluating visual changes:

| File | What it shows |
|---|---|
| `current-create-simple-{mobile,desktop}.png` | CreateStamp, base form |
| `current-create-complex-{mobile,desktop}.png` | CreateStamp, options panel open |
| `current-display-simple-{mobile,desktop}.png` | StampDisplay, timestamp only |
| `current-display-complex-desktop.png` | StampDisplay, full event data (name, description, location, url, end time) |
| `current-display-complex-mobile-initial.png` | StampDisplay complex, mobile — time display view |
| `current-display-complex-mobile-collapsed.png` | StampDisplay complex, mobile — swiped up: meta + calendar visible |
| `current-tz-selector-{mobile,desktop}.png` | Timezone selector open |
| `current-settings-menu-{mobile,desktop}.png` | Settings/menu panel open |
| `current-calendar-dropdown-desktop.png` | Add to Calendar dropdown open |
