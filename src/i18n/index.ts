import { createI18n } from 'vue-i18n'
import en from './en'
import nl from './nl'

const messages = { en, nl }
type SupportedLocale = keyof typeof messages

function detectLocale(): SupportedLocale {
  for (const tag of navigator.languages) {
    const lang = tag.split('-')[0] as SupportedLocale
    if (lang in messages) return lang
  }
  return 'en'
}

const locale = detectLocale()
document.documentElement.lang = locale

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages,
})
