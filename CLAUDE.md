# Zonestamp NG

Vue 3 + Vite + TypeScript rewrite of https://zonestamp.toolforge.org

## Repos

- **This project**: `~/Development/zonestamp-ng` — GitHub: `git@github.com:hartman/zonestamp.git`, branch `zonestamp-ng`
- **Original React app**: `~/Development/zonestamp` (read-only reference, do not modify)

## Project documentation

Read these before making architectural or design decisions:

- **Technical design**: `docs/technical-design.md` — stack, component tree, composables API, data flow, search ranking
- **Graphical design**: `docs/graphical-design.md` — color palette, typography, layout, component specs

## URL Contract (do not break)

- `/` — CreateStamp view
- `/{10-digit-unix-timestamp}` — StampDisplay view (no end time)
- `/{ts}/{endts}` — StampDisplay view with end time (both 10-digit unix timestamps)
- Query params on StampDisplay: `?name=`, `?description=`, `?url=`
- Legacy query params (read only, no input in CreateStamp): `?enddate=`

The new app generates `/{ts}/{endts}` for end times but reads `?enddate=` for backward compat. The route regex `\d{10}` ensures shorter paths fall through to NotFound.

## Design system

All brand colors in `src/assets/tokens.css`. **Never hardcode color values in components — always use CSS variable references.** Primary teal: `#0c7fa2`. Fonts: Lobster (decorative), Quicksand (body).

VueDatePicker `--dp-*` CSS variables and `.tz-content` popover styles are in **non-scoped** `<style>` blocks — these elements are teleported outside the component DOM and scoped CSS won't reach them.

## TimezoneSelect implementation notes

- `.tz-panels-outer` uses `overflow: clip` (not `hidden`) — `overflow: hidden` creates a scroll container that `scrollIntoView` silently shifts sideways
- Mobile dialog: `<dialog>` with `showModal()`/`close()`; `@cancel.prevent` intercepts Escape to step back through levels before closing
- Breakpoint detection: `window.matchMedia('(max-width: 639px) and (min-resolution: 2dppx)')` — pixel density check excludes desktop browsers at narrow viewport (e.g. devtools) while catching real mobile at 2×/3× DPR

## Key behavior notes

**CreateStampView**: Options (name, description, url, end time) are only included in the generated URL when the options panel is open — closing the panel silently drops them.

**StampDisplayView**: Calendar button is always shown (a bare timestamp is a valid calendar item — defaults to title `"Event"`, duration 1 hour). The swipe-to-reveal behaviour (`needsReveal`) only activates when `?description=` is present.

## Dev commands

```sh
npm run dev                         # Vite dev server at localhost:5173
npm run build                       # production build → dist/
npm run build -- --mode toolforge   # Toolforge build (alternate font CDN)
npm run test                        # Vitest unit tests
npx playwright test                 # E2E tests (auto-starts dev server)
npx playwright test e2e/foo.spec.ts # single spec
```

## Testing

**After any significant change, run both the unit tests and the E2E tests before considering the work done.** If a test fails, determine whether the implementation is wrong or the test expectation is stale (renamed i18n string, refactored selector, replaced component). Fix whichever is wrong — never leave tests failing.

- Unit tests: `src/composables/__tests__/` and `src/views/__tests__/` — run with `npm run test`
- E2E: `e2e/` — Playwright auto-starts dev server; MCP Playwright tools available for exploratory visual testing
- Dev test links are in `AppMenu.vue` (DEV-only, tree-shaken from production builds)

## Deployment

Toolforge at `https://zonestamp.toolforge.org`. `zonestamp.com` redirects there. The webservice must rewrite all paths to `index.html` for Vue Router history mode. Deployment config not yet wired to the new build output — see `docs/technical-design.md` § Deployment.
