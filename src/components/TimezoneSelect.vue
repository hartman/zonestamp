<template>
  <div ref="wrapperRef" class="tz-root">

    <!-- ── Mobile: native <dialog> ────────────────────────────────────────── -->
    <template v-if="isMobile">
      <button
        type="button"
        class="tz-trigger"
        :aria-label="t('tz.ariaLabel', { zone: displayLabel(modelValue) })"
        aria-haspopup="dialog"
        :aria-expanded="pickerOpen"
        @click="openPicker"
      >
        <span class="tz-trigger-label">{{ displayLabel(modelValue) }}</span>
        <svg class="tz-chevron" width="16" height="16" aria-hidden="true"><use href="/icons.svg#chevron-down-icon" /></svg>
      </button>

      <Teleport to="body">
        <dialog ref="dialogRef" class="tz-dialog" @cancel.prevent="onDialogCancel">
          <div class="tz-dialog-header">
            <span class="tz-dialog-title">{{ t('tz.selectTimezone') }}</span>
            <button type="button" class="tz-icon-btn" :aria-label="t('tz.close')" @click="closePicker">
              <svg width="20" height="20" aria-hidden="true"><use href="/icons.svg#close-icon" /></svg>
            </button>
          </div>
          <div class="tz-search-row">
            <svg class="tz-search-icon" width="14" height="14" aria-hidden="true"><use href="/icons.svg#search-icon" /></svg>
            <input
              ref="searchInputRef"
              v-model="searchTerm"
              class="tz-search-input"
              type="text"
              role="combobox"
              aria-autocomplete="list"
              :aria-controls="listId"
              :aria-label="t('tz.search')"
              :placeholder="t('tz.searchPlaceholder')"
              autocomplete="off"
              @keydown="onKeydown"
            />
            <button v-if="searchTerm" type="button" class="tz-icon-btn" :aria-label="t('tz.clearSearch')" @click="clearSearch">
              <svg width="14" height="14" aria-hidden="true"><use href="/icons.svg#close-icon" /></svg>
            </button>
          </div>
          <div :id="listId" class="tz-list-area">
            <template v-if="searchTerm">
              <div v-if="filteredZones.length === 0" class="tz-empty">{{ t('tz.noResults') }}</div>
              <div v-else class="tz-scroll" role="listbox" :aria-label="t('tz.results', { count: filteredZones.length })">
                <button
                  v-for="(zone, i) in filteredZones" :key="zone"
                  type="button" class="tz-item"
                  :class="{ 'is-highlighted': highlightedIndex === i, 'is-selected': zone === modelValue }"
                  role="option" :aria-selected="zone === modelValue" :data-index="i"
                  @click="select(zone)" @mouseenter="highlightedIndex = i"
                >{{ displayLabel(zone) }}</button>
              </div>
            </template>
            <template v-else>
              <div class="tz-panels-outer" :class="{ 'at-level2': currentRegion !== null }">
                <div class="tz-panel-track">
                  <div class="tz-panel" role="listbox" :aria-label="t('tz.regions')">
                    <div class="tz-scroll">
                      <button
                        type="button" class="tz-item"
                        :class="{ 'is-highlighted': highlightedIndex === topLevelIndex('UTC'), 'is-selected': modelValue === 'UTC' }"
                        role="option" :aria-selected="modelValue === 'UTC'" :data-index="topLevelIndex('UTC')"
                        @click="select('UTC')" @mouseenter="highlightedIndex = topLevelIndex('UTC')"
                      >{{ t('tz.utcLabel') }}</button>
                      <button
                        v-if="localZone !== 'UTC'"
                        type="button" class="tz-item"
                        :class="{ 'is-highlighted': highlightedIndex === topLevelIndex(localZone), 'is-selected': modelValue === localZone }"
                        role="option" :aria-selected="modelValue === localZone" :data-index="topLevelIndex(localZone)"
                        @click="select(localZone)" @mouseenter="highlightedIndex = topLevelIndex(localZone)"
                      >{{ displayLabel(localZone) }}</button>
                      <template v-if="recentFiltered.length > 0">
                        <div class="tz-divider" role="separator" aria-hidden="true" />
                        <button
                          v-for="zone in recentFiltered" :key="zone"
                          type="button" class="tz-item"
                          :class="{ 'is-highlighted': highlightedIndex === topLevelIndex(zone), 'is-selected': zone === modelValue }"
                          role="option" :aria-selected="zone === modelValue" :data-index="topLevelIndex(zone)"
                          @click="select(zone)" @mouseenter="highlightedIndex = topLevelIndex(zone)"
                        >{{ displayLabel(zone) }}</button>
                      </template>
                      <div class="tz-divider" role="separator" aria-hidden="true" />
                      <button
                        v-for="region in regions" :key="region"
                        type="button" class="tz-item tz-region-item"
                        :class="{ 'is-highlighted': highlightedIndex === topLevelIndex(region) }"
                        role="option" aria-haspopup="listbox" :aria-label="t('tz.regionZones', { region })" :data-index="topLevelIndex(region)"
                        @click="drillInto(region)" @mouseenter="highlightedIndex = topLevelIndex(region)"
                      >
                        <span>{{ region }}</span>
                        <svg width="14" height="14" aria-hidden="true"><use href="/icons.svg#chevron-right-icon" /></svg>
                      </button>
                    </div>
                  </div>
                  <div class="tz-panel" role="listbox" :aria-label="currentRegion ? t('tz.regionZones', { region: currentRegion }) : undefined">
                    <button type="button" class="tz-back-btn" :aria-label="t('tz.backToRegions')" @click="goBack">
                      <svg width="14" height="14" aria-hidden="true"><use href="/icons.svg#chevron-left-icon" /></svg>
                      {{ currentRegion }}
                    </button>
                    <div ref="regionScrollRef" class="tz-scroll">
                      <button
                        v-for="(zone, i) in currentRegionZones" :key="zone"
                        type="button" class="tz-item"
                        :class="{ 'is-highlighted': highlightedIndex === i, 'is-selected': zone === modelValue }"
                        role="option" :aria-selected="zone === modelValue" :data-index="i"
                        @click="select(zone)" @mouseenter="highlightedIndex = i"
                      >{{ displayLabel(zone, false) }}</button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </dialog>
      </Teleport>
    </template>

    <!-- ── Desktop: Reka UI Popover ────────────────────────────────────────── -->
    <template v-else>
      <PopoverRoot :open="pickerOpen" @update:open="(v) => { if (!v) closePicker() }">
        <PopoverAnchor as-child>
          <button
            type="button"
            class="tz-trigger"
            :aria-label="t('tz.ariaLabel', { zone: displayLabel(modelValue) })"
            aria-haspopup="listbox"
            :aria-expanded="pickerOpen"
            @click="openPicker"
          >
            <span class="tz-trigger-label">{{ displayLabel(modelValue) }}</span>
            <svg class="tz-chevron" width="16" height="16" aria-hidden="true"><use href="/icons.svg#chevron-down-icon" /></svg>
          </button>
        </PopoverAnchor>
        <PopoverPortal>
          <PopoverContent
            class="tz-content"
            side="bottom"
            align="start"
            :side-offset="4"
            :avoid-collisions="true"
            :style="contentStyle"
            @open-auto-focus.prevent="focusSearch"
          >
            <div class="tz-search-row">
              <svg class="tz-search-icon" width="14" height="14" aria-hidden="true"><use href="/icons.svg#search-icon" /></svg>
              <input
                ref="searchInputRef"
                v-model="searchTerm"
                class="tz-search-input"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                :aria-controls="listId"
                :aria-label="t('tz.search')"
                :placeholder="t('tz.searchPlaceholder')"
                autocomplete="off"
                @keydown="onKeydown"
              />
              <button v-if="searchTerm" type="button" class="tz-icon-btn" :aria-label="t('tz.clearSearch')" @click="clearSearch">
                <svg width="14" height="14" aria-hidden="true"><use href="/icons.svg#close-icon" /></svg>
              </button>
            </div>
            <div :id="listId" class="tz-list-area">
              <template v-if="searchTerm">
                <div v-if="filteredZones.length === 0" class="tz-empty">{{ t('tz.noResults') }}</div>
                <div v-else class="tz-scroll" role="listbox" :aria-label="`${filteredZones.length} results`">
                  <button
                    v-for="(zone, i) in filteredZones" :key="zone"
                    type="button" class="tz-item"
                    :class="{ 'is-highlighted': highlightedIndex === i, 'is-selected': zone === modelValue }"
                    role="option" :aria-selected="zone === modelValue" :data-index="i"
                    @click="select(zone)" @mouseenter="highlightedIndex = i"
                  >{{ displayLabel(zone) }}</button>
                </div>
              </template>
              <template v-else>
                <div class="tz-panels-outer" :class="{ 'at-level2': currentRegion !== null }">
                  <div class="tz-panel-track">
                    <div class="tz-panel" role="listbox" :aria-label="t('tz.regions')">
                      <div class="tz-scroll">
                        <button
                          type="button" class="tz-item"
                          :class="{ 'is-highlighted': highlightedIndex === topLevelIndex('UTC'), 'is-selected': modelValue === 'UTC' }"
                          role="option" :aria-selected="modelValue === 'UTC'" :data-index="topLevelIndex('UTC')"
                          @click="select('UTC')" @mouseenter="highlightedIndex = topLevelIndex('UTC')"
                        >{{ t('tz.utcLabel') }}</button>
                        <button
                          v-if="localZone !== 'UTC'"
                          type="button" class="tz-item"
                          :class="{ 'is-highlighted': highlightedIndex === topLevelIndex(localZone), 'is-selected': modelValue === localZone }"
                          role="option" :aria-selected="modelValue === localZone" :data-index="topLevelIndex(localZone)"
                          @click="select(localZone)" @mouseenter="highlightedIndex = topLevelIndex(localZone)"
                        >{{ displayLabel(localZone) }}</button>
                        <template v-if="recentFiltered.length > 0">
                          <div class="tz-divider" role="separator" aria-hidden="true" />
                          <button
                            v-for="zone in recentFiltered" :key="zone"
                            type="button" class="tz-item"
                            :class="{ 'is-highlighted': highlightedIndex === topLevelIndex(zone), 'is-selected': zone === modelValue }"
                            role="option" :aria-selected="zone === modelValue" :data-index="topLevelIndex(zone)"
                            @click="select(zone)" @mouseenter="highlightedIndex = topLevelIndex(zone)"
                          >{{ displayLabel(zone) }}</button>
                        </template>
                        <div class="tz-divider" role="separator" aria-hidden="true" />
                        <button
                          v-for="region in regions" :key="region"
                          type="button" class="tz-item tz-region-item"
                          :class="{ 'is-highlighted': highlightedIndex === topLevelIndex(region) }"
                          role="option" aria-haspopup="listbox" :aria-label="t('tz.regionZones', { region })" :data-index="topLevelIndex(region)"
                          @click="drillInto(region)" @mouseenter="highlightedIndex = topLevelIndex(region)"
                        >
                          <span>{{ region }}</span>
                          <svg width="14" height="14" aria-hidden="true"><use href="/icons.svg#chevron-right-icon" /></svg>
                        </button>
                      </div>
                    </div>
                    <div class="tz-panel" role="listbox" :aria-label="currentRegion ? t('tz.regionZones', { region: currentRegion }) : undefined">
                      <button type="button" class="tz-back-btn" :aria-label="t('tz.backToRegions')" @click="goBack">
                        <svg width="14" height="14" aria-hidden="true"><use href="/icons.svg#chevron-left-icon" /></svg>
                        {{ currentRegion }}
                      </button>
                      <div ref="regionScrollRef" class="tz-scroll">
                        <button
                          v-for="(zone, i) in currentRegionZones" :key="zone"
                          type="button" class="tz-item"
                          :class="{ 'is-highlighted': highlightedIndex === i, 'is-selected': zone === modelValue }"
                          role="option" :aria-selected="zone === modelValue" :data-index="i"
                          @click="select(zone)" @mouseenter="highlightedIndex = i"
                        >{{ displayLabel(zone, false) }}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { DateTime } from 'luxon'
import { useI18n } from 'vue-i18n'
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot } from 'reka-ui'
import { allZones, regions, searchZones, useRecentZones, zoneAbbr } from '../composables/useTimezone'
import { useMobileDetection } from '../composables/useMobileDetection'

const { t } = useI18n()

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// ── Refs ───────────────────────────────────────────────────────────────────────
const wrapperRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
const regionScrollRef = ref<HTMLElement>()
const dialogRef = ref<HTMLDialogElement>()

// ── State ──────────────────────────────────────────────────────────────────────
const { isMobile } = useMobileDetection()
const pickerOpen = ref(false)
const searchTerm = ref('')
const currentRegion = ref<string | null>(null)
const highlightedIndex = ref(-1)
const listId = 'tz-list'

// ── Width matching (desktop only) ──────────────────────────────────────────────
const contentStyle = computed(() => ({
  width: wrapperRef.value ? `${wrapperRef.value.offsetWidth}px` : '280px',
}))

// ── Data ───────────────────────────────────────────────────────────────────────
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const { recentZones, addRecentZone } = useRecentZones()

const recentFiltered = computed(() =>
  recentZones.value.filter((z) => z !== 'UTC' && z !== localZone),
)

const topLevelItems = computed<string[]>(() => {
  const items: string[] = ['UTC']
  if (localZone !== 'UTC') items.push(localZone)
  items.push(...recentFiltered.value)
  items.push(...regions)
  return items
})

const filteredZones = computed(() => searchZones(searchTerm.value, props.modelValue))

const currentRegionZones = computed(() =>
  currentRegion.value ? allZones.filter((z) => z.startsWith(currentRegion.value + '/')) : [],
)

const currentItems = computed<string[]>(() => {
  if (searchTerm.value) return filteredZones.value
  if (currentRegion.value) return currentRegionZones.value
  return topLevelItems.value
})

function topLevelIndex(item: string): number {
  return topLevelItems.value.indexOf(item)
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function tzOffset(zone: string): string {
  const offset = DateTime.now().setZone(zone).offset
  const sign = offset >= 0 ? '+' : '-'
  const h = Math.floor(Math.abs(offset) / 60)
  const m = Math.abs(offset) % 60
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, '0')}`
}

function displayLabel(zone: string, showTopRegion = true): string {
  if (!zone) return ''
  if (zone === 'UTC') return t('tz.utcLabel')
  const parts = zone.split('/')
  const city = parts[parts.length - 1].replace(/_/g, ' ')
  const subregion = parts.length === 3 ? parts[1] : null
  const region = subregion ?? (showTopRegion && parts.length === 2 ? parts[0] : null)
  const abbr = zoneAbbr(zone)
  // Omit abbreviation if it's just a GMT offset (redundant with the UTC offset already shown)
  const abbrSuffix = abbr && !/^GMT[+-]/i.test(abbr) ? ` (${abbr})` : ''
  const label = region ? `${city} (${region.replace(/_/g, ' ')})` : city
  return `${label} · ${tzOffset(zone)}${abbrSuffix}`
}

function focusSearch() {
  nextTick(() => searchInputRef.value?.focus())
}

function clearSearch() {
  searchTerm.value = ''
  highlightedIndex.value = -1
  searchInputRef.value?.focus()
}

function drillInto(region: string) {
  currentRegion.value = region
  highlightedIndex.value = -1
  nextTick(() => {
    const idx = currentRegionZones.value.findIndex((z) => z === props.modelValue)
    if (idx !== -1) {
      highlightedIndex.value = idx
      nextTick(() => scrollHighlightedIntoView())
    }
  })
}

function goBack() {
  currentRegion.value = null
  highlightedIndex.value = -1
}

function openPicker() {
  pickerOpen.value = true
  if (isMobile.value) {
    nextTick(() => {
      dialogRef.value?.showModal()
      focusSearch()
    })
  }
}

function closePicker() {
  if (isMobile.value) dialogRef.value?.close()
  pickerOpen.value = false
  searchTerm.value = ''
  currentRegion.value = null
  highlightedIndex.value = -1
}

function select(zone: string) {
  addRecentZone(zone)
  emit('update:modelValue', zone)
  closePicker()
}

function onDialogCancel() {
  // Escape in dialog: layered navigation before closing
  if (searchTerm.value) {
    clearSearch()
  } else if (currentRegion.value) {
    goBack()
  } else {
    closePicker()
  }
}

function scrollHighlightedIntoView() {
  const scrollRoot = currentRegion.value
    ? regionScrollRef.value
    : (searchInputRef.value?.closest('.tz-content, .tz-dialog') as HTMLElement | null)
  if (!scrollRoot) return
  const el = scrollRoot.querySelector(`[data-index="${highlightedIndex.value}"]`) as HTMLElement | null
  el?.scrollIntoView({ block: 'nearest' })
}

// ── Keyboard navigation ────────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  const items = currentItems.value
  const max = items.length - 1

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, max)
      nextTick(scrollHighlightedIntoView)
      break

    case 'ArrowUp':
      e.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      nextTick(scrollHighlightedIntoView)
      break

    case 'Enter': {
      e.preventDefault()
      const item = items[highlightedIndex.value]
      if (!item) break
      if (!searchTerm.value && !currentRegion.value && regions.includes(item)) {
        drillInto(item)
      } else {
        select(item)
      }
      break
    }

    case 'Escape':
      e.preventDefault()
      e.stopPropagation() // prevent Reka UI (desktop) from also handling Escape
      if (searchTerm.value) {
        clearSearch()
      } else if (currentRegion.value) {
        goBack()
      } else {
        closePicker()
      }
      break

    case 'Backspace':
      if (!searchTerm.value && currentRegion.value) {
        goBack()
      }
      break
  }
}
</script>

<style scoped>
.tz-root {
  width: 100%;
}

/* ── Trigger button (shared) ── */
.tz-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: var(--white-alpha-12);
  border: 1px solid var(--muted-white-color);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--primary-white-color);
  font-family: var(--primary-font-family);
  font-size: 0.95rem;
  cursor: pointer;
  text-align: left;
  gap: 8px;
}

.tz-trigger:hover,
.tz-trigger:focus-visible {
  background: var(--white-alpha-20);
  outline: none;
}

.tz-trigger-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tz-chevron {
  flex-shrink: 0;
  color: var(--muted-white-color);
  transition: transform 0.2s;
}

.tz-trigger[aria-expanded='true'] .tz-chevron {
  transform: rotate(180deg);
}

/* ── Icon button (close / clear) ── */
.tz-icon-btn {
  background: transparent;
  border: none;
  padding: 2px;
  color: var(--muted-white-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.tz-icon-btn:hover,
.tz-icon-btn:focus-visible {
  color: var(--primary-white-color);
  outline: none;
}

/* ── Mobile dialog ── */
dialog.tz-dialog {
  border: none;
  padding: 0;
  margin: 0;
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100dvh;
  background: var(--primary-teal-color);
  color: var(--primary-white-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  inset: 0;
}

dialog.tz-dialog:not([open]) {
  display: none;
}

.tz-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: max(14px, calc(env(safe-area-inset-top) + 8px)) max(16px, env(safe-area-inset-right)) 14px max(16px, env(safe-area-inset-left));
  border-bottom: 1px solid var(--white-alpha-15);
  flex-shrink: 0;
}

.tz-dialog-header .tz-icon-btn {
  padding: 4px;
  border-radius: 4px;
}

.tz-dialog-header .tz-icon-btn:hover {
  color: var(--primary-white-color);
  background: var(--white-alpha-15);
}

.tz-dialog-title {
  font-family: var(--primary-font-family);
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-white-color);
}

/* ── Search row (shared) ── */
.tz-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--white-alpha-15);
  flex-shrink: 0;
}

.tz-search-icon {
  flex-shrink: 0;
  color: var(--muted-white-color);
}

.tz-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--primary-white-color);
  font-family: var(--primary-font-family);
  font-size: 1rem;
  padding: 2px 0;
}

.tz-search-input::placeholder {
  color: var(--muted-white-color);
}

/* ── List area ── */
.tz-list-area {
  overflow: hidden;
  /* mobile: fill remaining dialog height */
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tz-empty {
  padding: 12px 14px;
  font-family: var(--primary-font-family);
  font-size: 0.9rem;
  color: var(--muted-white-color);
}

/* mobile: scroll fills remaining height */
.tz-scroll {
  overflow-y: auto;
  flex: 1;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ── Items ── */
.tz-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 14px;
  background: transparent;
  border: none;
  color: var(--primary-white-color);
  font-family: var(--primary-font-family);
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tz-item.is-highlighted {
  background: var(--white-alpha-15);
}

.tz-item.is-selected {
  background: var(--white-alpha-20);
  font-weight: 700;
}

.tz-region-item {
  overflow: visible;
}

.tz-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--white-alpha-15);
}

/* ── Back button ── */
.tz-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 9px 14px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--white-alpha-15);
  color: var(--muted-white-color);
  font-family: var(--primary-font-family);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  flex-shrink: 0;
}

.tz-back-btn:hover,
.tz-back-btn:focus-visible {
  color: var(--primary-white-color);
  outline: none;
}

/* ── Two-panel slide ── */
.tz-panels-outer {
  overflow: clip; /* clip, not hidden — hidden creates a scroll container that
                     scrollIntoView can scroll sideways, breaking the slide */
  flex: 1; /* fill remaining dialog height on mobile */
  min-height: 0; /* allow shrinking below content height in flex column */
  display: flex;
  flex-direction: column;
}

.tz-panel-track {
  display: flex; /* row: panels side by side */
  width: 200%;
  flex: 1;
  min-height: 0;
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.tz-panels-outer.at-level2 .tz-panel-track {
  transform: translateX(-50%);
}

.tz-panel {
  flex: 0 0 50%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Desktop: panels are content-sized, not full-height */
.tz-content .tz-panels-outer {
  flex: none;
  min-height: unset;
}

.tz-content .tz-panel-track {
  flex: none;
}

.tz-content .tz-scroll {
  max-height: 280px;
  flex: none;
}
</style>

<!-- PopoverContent is teleported to <body>, outside this component's DOM tree,
     so scoped CSS attributes are never added to it. Styles must be unscoped. -->
<style>
.tz-content {
  background: var(--primary-teal-color);
  border: 1px solid var(--muted-white-color);
  border-radius: 6px;
  box-shadow: 0 8px 24px var(--shadow-color);
  z-index: 50;
  overflow: hidden;
  min-width: 240px;
}
</style>
