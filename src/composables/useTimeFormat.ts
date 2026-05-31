import { ref } from 'vue'
import type { DateTime } from 'luxon'
import { lsGet, lsSet } from './useStorage'

const LS_KEY = 'zonestamp:is24h'
const LOCALE_KEY = 'zonestamp:locale'

const is24h = ref(lsGet(LS_KEY) === 'true')
const locale = ref(lsGet(LOCALE_KEY) ?? '')

export function useTimeFormat() {
  function toggleFormat() {
    is24h.value = !is24h.value
    lsSet(LS_KEY, String(is24h.value))
  }

  function setLocale(value: string) {
    locale.value = value
    lsSet(LOCALE_KEY, value)
  }

  function formatTime(dt: DateTime): string {
    return dt.toLocaleString(
      is24h.value
        ? { hour: '2-digit', minute: '2-digit', hour12: false }
        : { hour: 'numeric', minute: '2-digit', hour12: true },
      { locale: locale.value || navigator.language },
    )
  }

  function formatDate(dt: DateTime): string {
    return dt.toLocaleString(
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      { locale: locale.value || navigator.language },
    )
  }

  return { is24h, toggleFormat, locale, setLocale, formatTime, formatDate }
}
