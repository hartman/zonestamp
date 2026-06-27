<template>
  <AppLayout>
    <div class="create-view" :class="{ 'stamp-visible': stampVisible }">

      <p class="create-intro">{{ t('create.intro') }}</p>

      <div class="create-pickers-row">
        <template v-if="isMobile">
          <input
            type="time"
            class="picker-trigger"
            :aria-label="t('create.eventTime')"
            :value="nativeTimeValue"
            @change="onNativeTimeChange($event)"
          />
          <span class="create-at">{{ t('create.on') }}</span>
          <input
            type="date"
            class="picker-trigger"
            :aria-label="t('create.eventDate')"
            :value="nativeDateValue"
            @change="onNativeDateChange($event)"
          />
        </template>
        <template v-else>
          <VueDatePicker
            v-model="timeModel"
            time-picker
            auto-apply
            :clearable="false"
            :teleport="true"
            :dark="true"
            :seconds-increment="0"
            :minutes-increment="1"
          >
            <template #trigger>
              <button type="button" class="picker-trigger" aria-haspopup="dialog">{{ displayTime }}</button>
            </template>
          </VueDatePicker>

          <span class="create-at">{{ t('create.on') }}</span>

          <VueDatePicker
            v-model="dateModel"
            :enable-time-picker="false"
            auto-apply
            :clearable="false"
            :teleport="true"
            :dark="true"
            :week-start="1"
          >
            <template #trigger>
              <button type="button" class="picker-trigger" aria-haspopup="dialog">{{ displayDate }}</button>
            </template>
          </VueDatePicker>
        </template>
      </div>

      <div class="create-tz-row">
        <TimezoneSelect v-model="zone" />
      </div>

      <form v-if="optionsExpanded" id="create-options-panel" class="create-options-panel" @submit.prevent>
        <input
          v-model="eventName"
          type="text"
          :placeholder="t('create.eventName')"
          class="create-options-input"
          maxlength="150"
        />
        <textarea
          v-model="eventDescription"
          :placeholder="t('create.description')"
          class="create-options-input create-options-textarea"
          rows="3"
          maxlength="1000"
        />
        <input
          v-model="eventLocation"
          type="text"
          :placeholder="t('create.location')"
          class="create-options-input"
          maxlength="150"
        />
        <input
          v-model="eventUrl"
          type="url"
          :placeholder="t('create.urlPlaceholder')"
          class="create-options-input"
          :class="{ 'create-options-input--invalid': eventUrlInvalid }"
        />
        <p v-if="eventUrlInvalid" class="create-options-error">{{ t('create.urlInvalid') }}</p>
        <div class="create-options-endtime-row">
          <span id="endtime-label" class="create-options-endtime-label">{{ t('create.addEndTime') }}</span>
          <button
            type="button"
            role="switch"
            :aria-checked="includeEndTime"
            aria-labelledby="endtime-label"
            class="create-options-endtime-switch"
            :class="{ on: includeEndTime }"
            @click="includeEndTime = !includeEndTime"
          >
            <span class="create-options-endtime-thumb" />
          </button>
        </div>
        <div v-if="includeEndTime" class="create-pickers-row">
          <template v-if="isMobile">
            <input
              type="time"
              class="picker-trigger"
              :aria-label="t('create.endTime')"
              :value="nativeEndTimeValue"
              @change="onNativeTimeChange($event, true)"
            />
            <span class="create-at">{{ t('create.on') }}</span>
            <input
              type="date"
              class="picker-trigger"
              :aria-label="t('create.endDate')"
              :value="nativeEndDateValue"
              @change="onNativeDateChange($event, true)"
            />
          </template>
          <template v-else>
            <VueDatePicker
              v-model="endTimeModel"
              time-picker
              auto-apply
              :clearable="false"
              :teleport="true"
              :dark="true"
              :seconds-increment="0"
              :minutes-increment="1"
            >
              <template #trigger>
                <button type="button" class="picker-trigger" aria-haspopup="dialog">{{ displayEndTime }}</button>
              </template>
            </VueDatePicker>
            <span class="create-at">{{ t('create.on') }}</span>
            <VueDatePicker
              v-model="endDateModel"
              :enable-time-picker="false"
              auto-apply
              :clearable="false"
              :teleport="true"
              :dark="true"
              :week-start="1"
            >
              <template #trigger>
                <button type="button" class="picker-trigger" aria-haspopup="dialog">{{ displayEndDate }}</button>
              </template>
            </VueDatePicker>
          </template>
        </div>
      </form>

      <div class="create-actions-row">
        <button
          type="button"
          class="create-options-toggle"
          :aria-label="optionsExpanded ? t('create.hideOptions') : t('create.showOptions')"
          :aria-expanded="optionsExpanded"
          aria-controls="create-options-panel"
          @click="optionsExpanded = !optionsExpanded"
        >
          <span class="create-options-toggle-icon" aria-hidden="true">{{ optionsExpanded ? '−' : '+' }}</span>
        </button>

        <button type="button" class="create-generate-btn" @click="generateStamp">
          {{ t('create.generate') }}
        </button>
      </div>

      <div v-if="stampVisible" ref="stampAreaRef" class="create-stamp-area">
        <div class="create-stamp-callout">
          <a :href="stampUrl" class="create-stamp-link">{{ stampUrl }}</a>
          <button
            v-if="canShare"
            type="button"
            class="create-copy-btn"
            :aria-label="t('create.shareLink')"
            @click="shareUrl"
          >
            <svg width="20" height="20" aria-hidden="true"><use href="/icons.svg#share-icon" /></svg>
          </button>
          <button
            v-else
            type="button"
            class="create-copy-btn"
            :aria-label="copied ? t('create.copied') : t('create.copyLink')"
            :class="{ copied }"
            @click="copyUrl"
          >
            <svg v-if="!copied" width="20" height="20" aria-hidden="true"><use href="/icons.svg#copy-icon" /></svg>
            <svg v-else width="20" height="20" aria-hidden="true"><use href="/icons.svg#check-icon" /></svg>
          </button>
        </div>
        <div class="create-stamp-qr">
          <canvas ref="qrCanvasRef" class="create-stamp-qr-canvas" />
          <button
            type="button"
            class="create-qr-btn"
            :aria-label="canShareFiles ? t('create.shareQrCode') : t('create.downloadQrCode')"
            @click="shareOrDownloadQr"
          >
            <svg width="18" height="18" aria-hidden="true">
              <use :href="canShareFiles ? '/icons.svg#share-icon' : '/icons.svg#download-icon'" />
            </svg>
            <span>{{ canShareFiles ? t('create.shareQrCode') : t('create.downloadQrCode') }}</span>
          </button>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue'
import QRCode from 'qrcode'
import { DateTime } from 'luxon'
import { useI18n } from 'vue-i18n'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import AppLayout from '../components/AppLayout.vue'
import TimezoneSelect from '../components/TimezoneSelect.vue'
import { useTimezone, resolveZone } from '../composables/useTimezone'
import { useMobileDetection } from '../composables/useMobileDetection'
import { useTimeFormat } from '../composables/useTimeFormat'
import { buildQueryString } from '../utils/urlCompression'

const { t } = useI18n()

const { detectedZone } = useTimezone()
const { formatTime, formatDate } = useTimeFormat()
const zone = ref(detectedZone.value)
const dt = ref(DateTime.now().startOf('minute').setZone(resolveZone(zone.value)))
const stampVisible = ref(false)
const stampAreaRef = ref<HTMLElement | null>(null)
const copied = ref(false)

const optionsExpanded = ref(false)
const eventName = ref('')
const eventDescription = ref('')
const eventLocation = ref('')
const eventUrl = ref('')
const eventUrlInvalid = computed(() => {
  const v = eventUrl.value.trim()
  return v.length > 0 && !v.startsWith('https://')
})
const includeEndTime = ref(false)
const endDt = ref(dt.value.plus({ hours: 1 }))

// ── Mobile detection ───────────────────────────────────────────────────────────
const { isMobile } = useMobileDetection()
onMounted(() => {
  document.title = t('create.pageTitle')
  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    const testFile = new File([''], 'test.png', { type: 'image/png' })
    canShareFiles.value = navigator.canShare({ files: [testFile] })
  }
})

watch(zone, (newZone) => {
  dt.value = dt.value.setZone(resolveZone(newZone), { keepLocalTime: true })
  endDt.value = endDt.value.setZone(resolveZone(newZone), { keepLocalTime: true })
})

watch(includeEndTime, (enabled) => {
  if (enabled) endDt.value = dt.value.plus({ hours: 1 })
})

// ── VueDatePicker models ───────────────────────────────────────────────────────

// Date-only picker — uses local-time Date constructor so displayed value matches
// the timezone-aware components from Luxon
const dateModel = computed({
  get: () => new Date(dt.value.year, dt.value.month - 1, dt.value.day),
  set: (val: Date | null) => {
    if (!val) return
    dt.value = dt.value.set({
      year: val.getFullYear(),
      month: val.getMonth() + 1,
      day: val.getDate(),
    })
  },
})

// Time-only picker
const timeModel = computed({
  get: () => ({ hours: dt.value.hour, minutes: dt.value.minute, seconds: 0, milliseconds: 0 }),
  set: (val: { hours: number; minutes: number } | null) => {
    if (!val) return
    dt.value = dt.value.set({ hour: val.hours, minute: val.minutes })
  },
})

// ── End date/time VueDatePicker models ────────────────────────────────────────
const endDateModel = computed({
  get: () => new Date(endDt.value.year, endDt.value.month - 1, endDt.value.day),
  set: (val: Date | null) => {
    if (!val) return
    endDt.value = endDt.value.set({
      year: val.getFullYear(),
      month: val.getMonth() + 1,
      day: val.getDate(),
    })
  },
})

const endTimeModel = computed({
  get: () => ({ hours: endDt.value.hour, minutes: endDt.value.minute, seconds: 0, milliseconds: 0 }),
  set: (val: { hours: number; minutes: number } | null) => {
    if (!val) return
    endDt.value = endDt.value.set({ hour: val.hours, minute: val.minutes })
  },
})

// ── Native input models (mobile) ──────────────────────────────────────────────
const nativeDateValue = computed(() => dt.value.toFormat('yyyy-MM-dd'))
const nativeTimeValue = computed(() => dt.value.toFormat('HH:mm'))
const nativeEndDateValue = computed(() => endDt.value.toFormat('yyyy-MM-dd'))
const nativeEndTimeValue = computed(() => endDt.value.toFormat('HH:mm'))

function onNativeDateChange(e: Event, isEnd = false) {
  const val = (e.target as HTMLInputElement).value
  if (!val) return
  const [year, month, day] = val.split('-').map(Number)
  if (isEnd) {
    endDt.value = endDt.value.set({ year, month, day })
  } else {
    dt.value = dt.value.set({ year, month, day })
  }
}

function onNativeTimeChange(e: Event, isEnd = false) {
  const val = (e.target as HTMLInputElement).value
  if (!val) return
  const [hour, minute] = val.split(':').map(Number)
  if (isEnd) {
    endDt.value = endDt.value.set({ hour, minute })
  } else {
    dt.value = dt.value.set({ hour, minute })
  }
}

// ── Display ────────────────────────────────────────────────────────────────────
const displayDate = computed(() => formatDate(dt.value))
const displayTime = computed(() => formatTime(dt.value))
const displayEndDate = computed(() => formatDate(endDt.value))
const displayEndTime = computed(() => formatTime(endDt.value))

const qrCanvasRef = ref<HTMLCanvasElement | null>(null)
const canShareFiles = ref(false)

const stampUrl = computed(() => {
  const basePath = `${window.location.origin}/${dt.value.toUnixInteger()}`
  const path = (optionsExpanded.value && includeEndTime.value)
    ? `${basePath}/${endDt.value.toUnixInteger()}`
    : basePath

  if (!optionsExpanded.value) return path

  const trimmedUrl = eventUrl.value.trim()
  const qs = buildQueryString({
    url: trimmedUrl.startsWith('https://') ? trimmedUrl : undefined,
    name: eventName.value.trim() || undefined,
    description: eventDescription.value.trim() || undefined,
    location: eventLocation.value.trim() || undefined,
  })

  return qs ? `${path}${qs}` : path
})
const canShare = typeof navigator.share === 'function'

watchEffect(async () => {
  if (!stampVisible.value || !qrCanvasRef.value) return
  await QRCode.toCanvas(qrCanvasRef.value, stampUrl.value, {
    width: 256,
    margin: 2,
    color: { dark: '#0c7fa2', light: '#ffffff' },
  })
}, { flush: 'post' })

// ── Actions ────────────────────────────────────────────────────────────────────
async function generateStamp() {
  stampVisible.value = true
  await nextTick()
  stampAreaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function copyUrl() {
  await navigator.clipboard.writeText(stampUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function shareUrl() {
  await navigator.share({ url: stampUrl.value })
}

async function shareOrDownloadQr() {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, stampUrl.value, {
    width: 512,
    margin: 2,
    color: { dark: '#0c7fa2', light: '#ffffff' },
  })
  canvas.toBlob(async (blob) => {
    if (!blob) return
    const file = new File([blob], 'stamp-qr.png', { type: 'image/png' })
    if (canShareFiles.value && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], url: stampUrl.value })
    } else {
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'stamp-qr.png'
      a.click()
      URL.revokeObjectURL(blobUrl)
    }
  }, 'image/png')
}
</script>

<style scoped>
.create-view {
  width: 100%;
  padding: 1.5rem 1rem 2rem;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.create-view.stamp-visible {
  padding-bottom: 50vh;
}

.create-intro {
  font-family: var(--primary-font-family);
  color: var(--primary-white-color);
  font-size: 1rem;
  margin: 0;
}

/* ── Date + time pickers row ── */
.create-pickers-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.create-pickers-row > :first-child {
  flex: 1;
  min-width: 0;
}

.create-pickers-row > :last-child {
  flex: 2;
  min-width: 0;
}

.create-at {
  font-family: var(--primary-font-family);
  color: var(--muted-white-color);
  font-size: 0.95rem;
  flex-shrink: 0;
}

.picker-trigger {
  width: 100%;
  background: var(--white-alpha-12);
  border: 1px solid var(--muted-white-color);
  border-radius: 6px;
  padding: 9px 12px;
  color: var(--primary-white-color);
  font-family: var(--primary-font-family);
  font-size: 0.95rem;
  cursor: pointer;
  white-space: nowrap;
  text-align: left;
}

.picker-trigger:hover,
.picker-trigger:focus-visible {
  background: var(--white-alpha-20);
  outline: none;
}

input.picker-trigger {
  -webkit-appearance: none;
  appearance: none;
  color-scheme: dark;
}

/* ── Timezone row ── */
.create-tz-row {
  /* full width — TimezoneSelect is already width: 100% */
}

/* ── Actions row (toggle + generate) ── */
.create-actions-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

/* ── Options toggle ── */
.create-options-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  background: transparent;
  border: 1px solid var(--white-alpha-25);
  border-radius: 6px;
  color: var(--muted-white-color);
  font-family: var(--primary-font-family);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.create-options-toggle:hover,
.create-options-toggle:focus-visible {
  background: var(--white-alpha-12);
  color: var(--primary-white-color);
  outline: none;
}

.create-options-toggle-icon {
  font-size: 1.8rem;
  line-height: 1;
}

/* ── Options panel ── */
.create-options-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.create-options-input {
  width: 100%;
  background: var(--white-alpha-12);
  border: 1px solid var(--muted-white-color);
  border-radius: 6px;
  padding: 9px 12px;
  color: var(--primary-white-color);
  font-family: var(--primary-font-family);
  font-size: 1rem; /* iOS auto-zooms inputs with font-size < 16px */
  box-sizing: border-box;
}

.create-options-input::placeholder {
  color: var(--white-alpha-40);
}

.create-options-input:focus-visible {
  background: var(--white-alpha-20);
  outline: none;
}

.create-options-input--invalid {
  border-color: var(--error-color);
}

.create-options-error {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--error-color);
}

.create-options-textarea {
  resize: vertical;
  min-height: 4rem;
}

.create-options-endtime-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.create-options-endtime-label {
  font-family: var(--primary-font-family);
  font-size: 0.9rem;
  color: var(--muted-white-color);
}

.create-options-endtime-switch {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--white-alpha-20);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
  flex-shrink: 0;
}

.create-options-endtime-switch.on {
  background: var(--muted-white-color);
}

.create-options-endtime-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-white-color);
  transition: transform 0.2s;
  display: block;
}

.create-options-endtime-switch.on .create-options-endtime-thumb {
  transform: translateX(20px);
}

/* ── Generate button ── */
.create-generate-btn {
  flex: 1;
  width: 100%;
  padding: 12px;
  background: var(--muted-white-color);
  border: none;
  border-radius: 6px;
  color: var(--primary-teal-color);
  font-family: var(--decorative-font-family);
  font-size: 1.3rem;
  cursor: pointer;
  transition: background 0.15s;
}

.create-generate-btn:hover,
.create-generate-btn:focus-visible {
  background: var(--primary-white-color);
  outline: none;
}

/* ── Stamp area ── */
.create-stamp-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  padding-top: 9px;
}

/* Speech-bubble triangle — outer (border) */
.create-stamp-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 1.5rem;
  width: 0;
  height: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-bottom: 9px solid var(--white-alpha-25);
}

/* Speech-bubble triangle — inner (fill) */
.create-stamp-area::after {
  content: '';
  position: absolute;
  top: 1px;
  left: calc(1.5rem + 1px);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid var(--white-alpha-12);
}

.create-stamp-callout {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--white-alpha-12);
  border: 1px solid var(--white-alpha-25);
  border-radius: 6px;
  padding: 8px 8px 8px 14px;
}

.create-stamp-link {
  flex: 1;
  color: var(--primary-white-color);
  font-family: var(--primary-font-family);
  font-size: 1rem;
  text-decoration: underline;
  word-break: break-all;
}

.create-copy-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--muted-white-color);
  border: none;
  border-radius: 4px;
  padding: 6px;
  color: var(--primary-teal-color);
  cursor: pointer;
  transition: background 0.15s;
}

.create-copy-btn:hover,
.create-copy-btn:focus-visible {
  background: var(--primary-white-color);
  outline: none;
}

.create-copy-btn.copied {
  background: var(--primary-white-color);
}

/* ── QR code panel ── */
.create-stamp-qr {
  align-self: stretch;
  background: var(--primary-white-color);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.create-stamp-qr-canvas {
  width: 180px;
  height: 180px;
  image-rendering: pixelated;
}

.create-qr-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--primary-teal-color);
  color: var(--primary-white-color);
  border: 1px solid rgba(12, 127, 162, 0.3);
  border-radius: 4px;
  padding: 6px 14px;
  font-family: var(--primary-font-family);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.create-qr-btn:hover,
.create-qr-btn:focus-visible {
  background: var(--picker-background-color);
  outline: none;
}
</style>

<!-- VueDatePicker is teleported to <body>; override its CSS vars for dark/teal theme -->
<style>
:root {
  --dp-font-family: var(--primary-font-family);
  --dp-border-radius: 8px;
}

/* dark mode class added by VueDatePicker when :dark="true" */
.dp--theme-dark {
  --dp-background-color: var(--picker-background-color);
  --dp-text-color: var(--primary-white-color);
  --dp-hover-color: var(--white-alpha-15);
  --dp-hover-text-color: var(--primary-white-color);
  --dp-hover-icon-color: var(--primary-white-color);
  --dp-primary-color: var(--muted-white-color);
  --dp-primary-disabled-color: var(--white-alpha-40);
  --dp-primary-text-color: var(--primary-teal-color);
  --dp-secondary-color: var(--white-alpha-20);
  --dp-border-color: var(--white-alpha-30);
  --dp-menu-border-color: var(--white-alpha-30);
  --dp-border-color-hover: var(--white-alpha-60);
  --dp-border-color-focus: var(--white-alpha-60);
  --dp-disabled-color: var(--white-alpha-20);
  --dp-disabled-color-text: var(--white-alpha-40);
  --dp-scroll-bar-background: var(--white-alpha-10);
  --dp-scroll-bar-color: var(--white-alpha-30);
  --dp-success-color: #a8edbc;
  --dp-icon-color: var(--white-alpha-80);
  --dp-danger-color: #ff6b6b;
  --dp-highlight-color: var(--white-alpha-10);
  --dp-range-between-dates-background-color: var(--white-alpha-10);
  --dp-range-between-dates-text-color: var(--primary-white-color);
  --dp-range-between-border-color: var(--white-alpha-30);
}

/* The date-only calendar shows a "switch to time picker" button — hide it */
.dp__button.dp__today-button,
button[aria-label="Open time picker"] {
  display: none !important;
}
</style>
