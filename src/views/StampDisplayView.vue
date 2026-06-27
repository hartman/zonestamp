<template>
  <AppLayout>
    <div
    class="display-view"
    :class="{ scrolled, 'at-top': atScrollTop, 'needs-reveal': needsReveal }"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >

      <div class="display-header">
        <h1 v-if="calendarName" class="display-title">{{ calendarName }}</h1>
        <p v-else class="display-subhead">{{ t('display.thats') }}</p>
      </div>

      <div class="display-times-group">
        <div class="display-times" @click="scrolled && (scrolled = false)">
          <div class="display-start-block">
            <div class="display-time-row">
              <span class="display-time">{{ formatTime(dt) }}</span>
              <template v-if="endDt && sameDay">
                <span class="display-time-sep">–</span>
                <span class="display-time">{{ formatTime(endDt) }}</span>
              </template>
              <button
                type="button"
                class="display-toggle"
                :aria-label="is24h ? t('display.switchTo12h') : t('display.switchTo24h')"
                @click="toggleFormat"
              >{{ is24h ? t('display.format12h') : t('display.format24h') }}</button>
            </div>
            <p class="display-date">{{ formatDate(dt) }}</p>
          </div>
          <div v-if="endDt && !sameDay" class="display-end-block">
            <span class="display-time-end-label">{{ t('display.ending') }}</span>
            <p class="display-date">{{ formatTime(endDt) }} · {{ formatDate(endDt) }}</p>
          </div>
        </div>

        <button type="button" class="display-tz-back" :aria-label="t('display.backToTimes')" @click="scrolled = false">
          <svg width="14" height="14" aria-hidden="true"><use href="/icons.svg#globe-icon" /></svg>
          <span>{{ zoneTriggerLabel(displayZone) }}</span>
        </button>
      </div>

      <div class="display-tz-row">
        <TimezoneSelect v-model="displayZone" />
      </div>

      <div v-if="needsReveal && !scrolled" class="display-hint-spacer" />
      <button
        v-if="needsReveal"
        class="display-scroll-hint"
        @click="scrolled = true"
      >{{ t('display.revealDetails') }}</button>

      <div v-if="hasEventMeta" class="display-meta">
        <div v-if="calDescription" class="display-meta-desc">
          <h2 v-if="calendarName" class="display-meta-name">{{ calendarName }}</h2>
          <p class="display-meta-text">{{ calDescription }}</p>
        </div>
        <a v-if="calLocation" :href="calLocationMapUrl" target="_blank" rel="noopener noreferrer" class="display-meta-btn">
          <span class="display-meta-btn-icon" aria-hidden="true">📍</span>
          <span>{{ calLocation }}</span>
        </a>
        <a v-if="calUrl" :href="calUrl" target="_blank" rel="noopener noreferrer" class="display-meta-btn">
          <span class="display-meta-btn-icon" aria-hidden="true">🔗</span>
          <span class="display-meta-btn-url">{{ calUrl }}</span>
        </a>
      </div>

      <div v-if="hasCalendarData" class="cal-wrapper">
        <button
          class="cal-btn"
          aria-haspopup="dialog"
          :aria-expanded="isMobile ? undefined : dropdownOpen"
          @click="openCalendar"
        >
          {{ t('display.addToCalendar') }}
        </button>

        <!-- Mobile: fullscreen dialog -->
        <dialog ref="calDialog" class="cal-dialog" @cancel.prevent="closeCalendar" @click="onDialogBackdropClick">
          <div class="cal-dialog-inner">
            <div class="cal-dialog-header">
              <span class="cal-dialog-title">{{ t('display.addToCalendar') }}</span>
              <button class="cal-dialog-close" :aria-label="t('display.close')" @click="closeCalendar">
                <svg width="20" height="20" aria-hidden="true"><use href="/icons.svg#close-icon" /></svg>
              </button>
            </div>
            <ul class="cal-options" role="list">
              <li><a class="cal-option" :href="googleUrl" target="_blank" rel="noopener noreferrer" @click="closeCalendar">{{ t('display.calendar.google') }}</a></li>
              <li><button class="cal-option" @click="downloadIcs">{{ t('display.calendar.apple') }}</button></li>
              <li><a class="cal-option" :href="outlookUrl" target="_blank" rel="noopener noreferrer" @click="closeCalendar">{{ t('display.calendar.outlook') }}</a></li>
              <li><a class="cal-option" :href="office365Url" target="_blank" rel="noopener noreferrer" @click="closeCalendar">{{ t('display.calendar.office365') }}</a></li>
              <li><a class="cal-option" :href="yahooUrl" target="_blank" rel="noopener noreferrer" @click="closeCalendar">{{ t('display.calendar.yahoo') }}</a></li>
            </ul>
          </div>
        </dialog>

        <!-- Desktop: inline dropdown -->
        <div v-if="dropdownOpen" class="cal-backdrop" @click="closeCalendar"></div>
        <div v-if="dropdownOpen" class="cal-dropdown" @click.stop>
          <ul class="cal-options" role="list">
            <li><a class="cal-option" :href="googleUrl" target="_blank" rel="noopener noreferrer" @click="closeCalendar">{{ t('display.calendar.google') }}</a></li>
            <li><button class="cal-option" @click="downloadIcs">{{ t('display.calendar.apple') }}</button></li>
            <li><a class="cal-option" :href="outlookUrl" target="_blank" rel="noopener noreferrer" @click="closeCalendar">{{ t('display.calendar.outlook') }}</a></li>
            <li><a class="cal-option" :href="office365Url" target="_blank" rel="noopener noreferrer" @click="closeCalendar">{{ t('display.calendar.office365') }}</a></li>
            <li><a class="cal-option" :href="yahooUrl" target="_blank" rel="noopener noreferrer" @click="closeCalendar">{{ t('display.calendar.yahoo') }}</a></li>
          </ul>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { DateTime } from 'luxon'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'
import TimezoneSelect from '../components/TimezoneSelect.vue'
import { appConfig } from '../config/app'
import { useTimezone, zoneTriggerLabel, resolveZone } from '../composables/useTimezone'
import { useTimeFormat } from '../composables/useTimeFormat'
import { useCalendarLinks } from '../composables/useCalendarLinks'
import { useMobileDetection } from '../composables/useMobileDetection'
import { decompressZdl } from '../utils/urlCompression'

const { t } = useI18n()

const props = defineProps<{ timestamp: string; endtimestamp?: string }>()
const route = useRoute()
const { detectedZone } = useTimezone()
const { is24h, toggleFormat, formatTime, formatDate } = useTimeFormat()

const displayZone = ref(detectedZone.value)

const ts = computed(() => parseInt(props.timestamp, 10))
const dt = computed(() => DateTime.fromSeconds(ts.value).setZone(resolveZone(displayZone.value)))

// ── Calendar data from query params ───────────────────────────────────────────
const eventParams = computed(() => {
  const zdl = route.query.zdl as string | undefined
  if (zdl) return decompressZdl(zdl)
  return {
    name: (route.query.name as string) ?? undefined,
    description: (route.query.description as string) ?? undefined,
    location: (route.query.location as string) ?? undefined,
    url: (route.query.url as string) ?? undefined,
  }
})

const calendarName = computed(() => eventParams.value.name ?? '')
const calDescription = computed(() => eventParams.value.description ?? '')
const calLocation = computed(() => eventParams.value.location ?? '')
const calUrl = computed(() => {
  const raw = eventParams.value.url ?? ''
  return raw.startsWith('https://') ? raw : ''
})
const calEndTs = computed<number | null>(() => {
  if (props.endtimestamp && /^\d{10}$/.test(props.endtimestamp)) {
    return parseInt(props.endtimestamp, 10)
  }
  const endParam = route.query.enddate as string | undefined
  if (endParam && /^\d{10}$/.test(endParam)) {
    return parseInt(endParam, 10)
  }
  return null
})

watchEffect(() => {
  document.title = calendarName.value
    ? t('display.pageTitle', { name: calendarName.value })
    : t('display.pageTitleTime', { time: formatTime(dt.value), date: formatDate(dt.value) })
})

const endDt = computed(() =>
  calEndTs.value !== null ? DateTime.fromSeconds(calEndTs.value).setZone(resolveZone(displayZone.value)) : null,
)
const sameDay = computed(() => endDt.value !== null && dt.value.toISODate() === endDt.value.toISODate())

const hasCalendarData = true
const hasEventMeta = computed(() =>
  !!(calDescription.value || calLocation.value || calUrl.value),
)
const needsReveal = computed(() => !!calDescription.value)
const calLocationMapUrl = computed(() => appConfig.mapSearchUrl(calLocation.value))

// ── Calendar links ─────────────────────────────────────────────────────────────
const { googleUrl, outlookUrl, office365Url, yahooUrl, icsContent, icsFilename } = useCalendarLinks({
  title: calendarName,
  startTs: ts,
  endTs: calEndTs,
  description: calDescription,
  location: calLocation,
  url: calUrl,
})

function downloadIcs() {
  const blob = new Blob([icsContent.value], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = icsFilename.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  closeCalendar()
}

// ── Calendar UI ────────────────────────────────────────────────────────────────
const { isMobile } = useMobileDetection()
const calDialog = ref<HTMLDialogElement | null>(null)
const dropdownOpen = ref(false)

function openCalendar() {
  if (isMobile.value) {
    calDialog.value?.showModal()
  } else {
    dropdownOpen.value = !dropdownOpen.value
  }
}

function closeCalendar() {
  calDialog.value?.close()
  dropdownOpen.value = false
}

function onDialogBackdropClick(e: MouseEvent) {
  if (e.target === calDialog.value) closeCalendar()
}

// ── Swipe-collapse state ───────────────────────────────────────────────────────
const scrolled = ref(false)
const atScrollTop = ref(true)
let scrollContainer: Element | null = null
let touchStartY = 0

function onScroll() {
  atScrollTop.value = (scrollContainer?.scrollTop ?? 0) === 0
}

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0].clientY
}

function applySwipeDelta(delta: number) {
  if (!needsReveal.value) return
  if (!scrolled.value && delta < -30) {
    scrolled.value = true
  } else if (scrolled.value && delta > 30 && (scrollContainer?.scrollTop ?? 0) === 0) {
    scrolled.value = false
  }
}

function onTouchEnd(e: TouchEvent) {
  applySwipeDelta(e.changedTouches[0].clientY - touchStartY)
}

onMounted(() => {
  scrollContainer = document.querySelector('.main-content')
  scrollContainer?.addEventListener('scroll', onScroll, { passive: true })
  if (import.meta.env.DEV) {
    // Test hook: allows E2E tests to trigger swipe logic without native touch events.
    // WebKit does not support new Touch() in evaluate(), so real touch simulation
    // is not possible cross-browser in Playwright.
    ;(window as any).__testSwipeDelta = (delta: number) => applySwipeDelta(delta)
  }
})

onUnmounted(() => {
  scrollContainer?.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.display-view {
  width: 100%;
  padding: 1.5rem 1rem 2rem;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.display-title {
  font-family: var(--primary-font-family);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-white-color);
  margin: 0;
  overflow-wrap: break-word;
}

.display-subhead {
  font-family: var(--primary-font-family);
  color: var(--muted-white-color);
  font-size: 1rem;
  margin: 0;
}

.display-time-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.display-time {
  font-family: var(--primary-font-family);
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--primary-white-color);
  line-height: 1;
  white-space: nowrap;
}

/* Range mode: scale down to fit both times on one line */
.display-time-row:has(.display-time-sep) {
  gap: 0.5rem;
}

.display-time-row:has(.display-time-sep) .display-time {
  font-size: clamp(1.25rem, 9.2vw, 3rem);
}

.display-time-row:has(.display-time-sep) .display-time-sep {
  font-size: clamp(1rem, 6vw, 2.25rem);
}


.display-times {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.display-start-block,
.display-end-block {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.display-time-end-label {
  font-family: var(--primary-font-family);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-white-color);
}

.display-time-sep {
  font-family: var(--primary-font-family);
  font-size: 2.5rem;
  font-weight: 300;
  color: var(--muted-white-color);
  line-height: 1;
  align-self: center;
}

.display-toggle {
  background: var(--white-alpha-15);
  border: 1px solid var(--muted-white-color);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--muted-white-color);
  font-family: var(--primary-font-family);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  align-self: center;
}

.display-toggle:hover,
.display-toggle:focus-visible {
  color: var(--primary-white-color);
  background: var(--white-alpha-25);
  outline: none;
}

.display-date {
  font-family: var(--primary-font-family);
  color: var(--primary-white-color);
  font-size: 1.1rem;
  margin: 0;
}

.display-times-group {
  display: flex;
  flex-direction: column;
}

.display-tz-row {
  margin-top: 0.25rem;
}

.display-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.display-meta-desc {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem;
  background: var(--white-alpha-15);
  border-radius: 6px;
}

.display-meta-name {
  font-family: var(--primary-font-family);
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-white-color);
  margin: 0;
  overflow-wrap: break-word;
}

.display-meta-text {
  font-family: var(--primary-font-family);
  font-size: 0.95rem;
  color: var(--muted-white-color);
  margin: 0;
}

.display-meta-btn {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  background: var(--white-alpha-12);
  border: 1px solid var(--white-alpha-30);
  border-radius: 6px;
  font-family: var(--primary-font-family);
  font-size: 0.95rem;
  color: var(--primary-white-color);
  text-decoration: none;
  box-sizing: border-box;
}

.display-meta-btn:hover,
.display-meta-btn:focus-visible {
  background: var(--white-alpha-20);
  outline: none;
}

.display-meta-btn-icon {
  flex-shrink: 0;
  line-height: 1.4;
}

.display-meta-btn-url {
  word-break: break-all;
}

.display-hint-spacer {
  display: none;
}

.display-tz-back {
  display: none;
}

.display-scroll-hint {
  display: block;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.65rem 1rem;
  background: var(--white-alpha-10);
  border: 1px solid var(--white-alpha-30);
  border-radius: 6px;
  font-family: var(--primary-font-family);
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-white-color);
  cursor: pointer;
  text-align: center;
}

.display-scroll-hint:hover,
.display-scroll-hint:focus-visible {
  background: var(--white-alpha-20);
  outline: none;
}

@media (min-width: 640px) {
  .display-scroll-hint {
    display: none;
  }
}

/* ── Calendar button & UI ───────────────────────────────────────────────────── */

.cal-wrapper {
  margin-top: 0.5rem;
  position: relative;
}

.cal-btn {
  display: block;
  width: 100%;
  background: var(--primary-button-background-color);
  color: var(--primary-button-text-color);
  border: none;
  border-radius: var(--primary-button-border-radius);
  padding: 0.65em 1.4em;
  font-family: var(--primary-font-family);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-sizing: border-box;
}

.cal-btn:hover,
.cal-btn:focus-visible {
  background: var(--focused-primary-button-background-color);
  color: var(--focused-primary-button-text-color);
  outline: none;
}

/* Mobile dialog */
.cal-dialog {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: var(--primary-teal-color);
  color: var(--primary-white-color);
}

.cal-dialog::backdrop {
  background: transparent;
}

.cal-dialog-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cal-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem 1rem;
  border-bottom: 1px solid var(--white-alpha-20);
}

.cal-dialog-title {
  font-family: var(--primary-font-family);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-white-color);
}

.cal-dialog-close {
  background: transparent;
  border: none;
  color: var(--muted-white-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.cal-dialog-close:hover,
.cal-dialog-close:focus-visible {
  color: var(--primary-white-color);
  background: var(--white-alpha-15);
  outline: none;
}

/* Transparent backdrop — captures outside clicks to close the dropdown */
.cal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9;
}

/* Desktop dropdown */
.cal-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  min-width: 200px;
  background: var(--picker-background-color);
  border-radius: 8px;
  box-shadow: rgba(0, 0, 0, 0.35) 0 4px 17px -2px, rgba(0, 0, 0, 0.2) 0 2px 4px -1px;
  overflow: hidden;
  z-index: 10;
}

/* Shared options list */
.cal-options {
  list-style: none;
  margin: 0;
  padding: 0;
}

.cal-option {
  display: block;
  width: 100%;
  padding: 1rem 1.25rem;
  font-family: var(--primary-font-family);
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--muted-white-color);
  text-decoration: none;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--white-alpha-15);
  cursor: pointer;
}

.cal-option:last-child {
  border-bottom: none;
}

.cal-option:hover,
.cal-option:focus-visible {
  background: var(--primary-teal-color);
  color: var(--primary-white-color);
  outline: none;
}

/* Tighten option padding in the desktop dropdown */
.cal-dropdown .cal-option {
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
}

/* ── Swipe-collapse animation (mobile only) ─────────────────────────────────── */

@media (max-width: 639px) {
  .display-view {
    touch-action: pan-x;
  }

  .scrolled.display-view {
    touch-action: auto;
  }

  .scrolled.at-top.display-view {
    touch-action: pan-x pan-down;
  }

  .display-header {
    overflow: hidden;
    max-height: 12rem;
    opacity: 1;
    transition: max-height 0.35s ease, opacity 0.25s ease, margin-bottom 0.35s ease;
  }

  .display-toggle {
    transition: visibility 0s, opacity 0.25s ease, max-width 0.3s ease, padding 0.3s ease;
    overflow: hidden;
    max-width: 4rem;
  }

  .display-tz-row {
    overflow: hidden;
    max-height: 4rem;
    opacity: 1;
    transition: max-height 0.35s ease, opacity 0.25s ease, margin-top 0.35s ease;
  }

  .display-time {
    transition: font-size 0.3s ease;
  }

  .display-date {
    transition: font-size 0.3s ease;
  }

  .display-view {
    min-height: 100%;
  }

  .display-hint-spacer {
    display: block;
    flex: 1 0 0;
    max-height: 20vh;
  }

  .display-scroll-hint {
    overflow: hidden;
    max-height: 4rem;
    transition: visibility 0s, opacity 0.25s ease, max-height 0.3s ease, padding 0.3s ease, margin-top 0.3s ease;
  }

  /* Initial state: hidden only when reveal is needed (description present).
     visibility is detectable by test tooling; delay keeps it hidden until after
     the fade-out completes when reverting. */
  .needs-reveal .display-meta,
  .needs-reveal .cal-wrapper {
    visibility: hidden;
    opacity: 0;
    transform: translateY(12px);
    pointer-events: none;
    transition: visibility 0s linear 0.35s, opacity 0.35s ease, transform 0.35s ease;
  }

  /* Scrolled state: collapse top, reveal bottom */
  .scrolled .display-header {
    max-height: 0;
    opacity: 0;
    margin-bottom: -0.75rem;
  }

  .scrolled .display-toggle {
    visibility: hidden;
    opacity: 0;
    max-width: 0;
    padding: 0;
    pointer-events: none;
    transition: visibility 0s linear 0.25s, opacity 0.25s ease, max-width 0.3s ease, padding 0.3s ease;
  }

  .scrolled .display-tz-row {
    max-height: 0;
    opacity: 0;
    margin-top: -0.75rem;
  }

  .display-tz-back {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    align-self: flex-start;
    background: transparent;
    border: none;
    color: var(--muted-white-color);
    font-family: var(--primary-font-family);
    font-size: 0.85rem;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    margin-top: 0;
    transition: max-height 0.35s ease, opacity 0.25s ease, margin-top 0.35s ease;
  }

  .display-tz-back:hover {
    color: var(--primary-white-color);
    background: var(--white-alpha-15);
  }

  .scrolled .display-tz-back {
    max-height: 2rem;
    opacity: 1;
  }

  .scrolled .display-times {
    cursor: pointer;
  }

  .scrolled .display-start-block {
    flex-direction: row;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0;
  }

  .scrolled .display-time-row {
    gap: 0;
    width: fit-content;
  }

  .scrolled .display-start-block .display-date::before {
    content: '\00a0·\00a0';
    color: var(--muted-white-color);
  }

  .scrolled .display-time,
  .scrolled .display-time-row:has(.display-time-sep) .display-time {
    font-size: 1.1rem;
  }

  .scrolled .display-time-sep,
  .scrolled .display-time-row:has(.display-time-sep) .display-time-sep {
    font-size: 1rem;
  }

  .scrolled .display-date {
    font-size: 1.1rem;
  }

  .scrolled .display-scroll-hint {
    visibility: hidden;
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
    transition: visibility 0s linear 0.25s, opacity 0.25s ease, max-height 0.3s ease, padding 0.3s ease, margin-top 0.3s ease;
  }

  .scrolled .display-meta {
    visibility: visible;
    opacity: 1;
    transform: none;
    pointer-events: auto;
    transition: visibility 0s, opacity 0.35s ease 0.15s, transform 0.35s ease 0.15s;
  }

  .scrolled .cal-wrapper {
    visibility: visible;
    opacity: 1;
    transform: none;
    pointer-events: auto;
    transition: visibility 0s, opacity 0.35s ease 0.2s, transform 0.35s ease 0.2s;
  }

}
</style>
