<template>
  <div v-if="isMenuOpen" class="backdrop" @click="closeMenu" />
  <aside
    class="app-menu"
    :class="{ open: isMenuOpen }"
    :aria-hidden="!isMenuOpen ? 'true' : undefined"
    :inert="!isMenuOpen"
  >
    <div class="menu-header">
      <span class="menu-title">{{ t('menu.title') }}</span>
      <button ref="closeBtnRef" class="close-btn" :aria-label="t('menu.close')" @click="closeMenu">
        <svg width="20" height="20" aria-hidden="true"><use href="/icons.svg#close-icon" /></svg>
      </button>
    </div>

    <div class="menu-section">
      <div class="section-label">{{ t('menu.clockFormat.label') }}</div>
      <div class="toggle-row">
        <span class="toggle-label" :class="{ active: !is24h }">{{ t('menu.clockFormat.hour12') }}</span>
        <button
          role="switch"
          :aria-checked="is24h"
          :aria-label="t('menu.clockFormat.toggle')"
          class="toggle-switch"
          :class="{ on: is24h }"
          @click="toggleFormat"
        >
          <span class="thumb" />
        </button>
        <span class="toggle-label" :class="{ active: is24h }">{{ t('menu.clockFormat.hour24') }}</span>
      </div>
    </div>

    <div class="menu-section">
      <label class="section-label" for="locale-select">{{ t('menu.dateFormat') }}</label>
      <select id="locale-select" :value="locale" @change="onLocaleChange">
        <option value="">{{ t('menu.browserDefault') }}</option>
        <option v-for="opt in LOCALE_LIST" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <div v-if="isDev" class="menu-section test-section">
      <div class="section-label">Test links</div>
      <RouterLink
        v-for="link in TEST_LINKS"
        :key="link.to"
        :to="link.to"
        class="test-link"
        @click="closeMenu"
      >{{ link.label }}</RouterLink>
    </div>

    <div class="menu-section about-section">
      <div class="section-label">About</div>
      <a :href="appConfig.repoUrl" target="_blank" rel="noopener" class="about-link">{{ t('menu.about.makeYourOwn') }}</a>
      <br />
      <a :href="appConfig.issueUrl" target="_blank" rel="noopener" class="about-link">{{ t('menu.about.reportIssue') }}</a>
      <p class="about-text">
        <a :href="appConfig.licenseUrl" target="_blank" rel="noopener" class="about-link">{{ t('menu.about.license') }}</a>
        · © 2018–{{ currentYear }}
        <br/>
        <a href="https://github.com/hartman" target="_blank" rel="noopener" class="about-link">Derk-Jan Hartman</a>, <a href="https://raquelmsmith.com/?utm_source=zonestamp&utm_medium=menu" target="_blank" rel="noopener" class="about-link">Raquel M. Smith</a> and contributors
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, nextTick, ref, watch, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { appConfig } from '../config/app'
import { useMenu } from '../composables/useMenu'
import { useTimeFormat } from '../composables/useTimeFormat'

const { t } = useI18n()

const isDev = import.meta.env.DEV
const closeBtnRef = ref<HTMLElement | null>(null)

const TEST_LINKS: { label: string; to: string }[] = [
  { label: 'Simple (no end time)', to: '/1780141020' },
  { label: 'With name + meta (multi-day)', to: '/1780141020/1780227420?name=Wikimania+2026+Opening&description=Opening+ceremony+for+Wikimania&location=Cape+Town%2C+South+Africa&url=https%3A%2F%2Fwikimania.wikimedia.org' },
  { label: 'End time: same day', to: '/1780141020/1780148220' },
  { label: 'End time: cross midnight (UTC)', to: '/1780182000/1780189200' },
  { label: 'Full options + end time', to: '/1780141020/1780148220?name=Wikimania+2026+Opening+Ceremony&description=Opening+ceremony+for+Wikimania+2026&location=Cape+Town%2C+South+Africa&url=https%3A%2F%2Fwikimania.wikimedia.org' },
  { label: 'Long title (overflow test)', to: '/1780141020?name=The+Annual+Wikimedia+Foundation+Community+Roundtable+Discussion+on+Equity+and+Inclusion+in+2026' },
  { label: 'Long description (scroll test)', to: '/1780141020/1780148220?name=Community+Meetup&description=Join+us+for+an+extended+evening+of+talks%2C+demos%2C+and+open+discussion+on+the+future+of+open+knowledge.+This+event+features+keynotes+from+contributors+across+the+globe%2C+a+panel+on+multilingual+content%2C+workshops+on+new+editing+tools%2C+and+plenty+of+time+to+connect+with+fellow+Wikimedians+over+food+and+drinks.+All+are+welcome+regardless+of+experience+level.+The+afternoon+sessions+will+cover+structured+data+on+Commons%2C+advances+in+machine+translation%2C+and+the+latest+developments+in+the+Wikimedia+technical+ecosystem.+Experienced+editors+will+lead+drop-in+clinics+on+citation+hygiene%2C+image+licensing%2C+and+conflict-of-interest+policies.+In+the+evening+we+gather+for+a+community+dinner+with+lightning+talks+from+local+chapters+and+user+groups.+Space+is+limited%2C+so+register+early.+Childcare+and+accessibility+accommodations+available+on+request.+Remote+participation+via+livestream+for+those+who+cannot+attend+in+person.+The+full+programme+and+speaker+bios+are+available+on+the+event+wiki+page.+Questions%3F+Reach+out+to+the+organising+team+via+the+talk+page+or+the+Wikimedia+NL+mailing+list.&location=Amsterdam%2C+Netherlands&url=https%3A%2F%2Fwikimedia.nl' },
]

const { isMenuOpen, closeMenu, menuTriggerRef } = useMenu()
const currentYear = computed(() => new Date().getFullYear())
const { is24h, toggleFormat, locale, setLocale } = useTimeFormat()

const LOCALE_LIST = [
  'en-US', 'en-GB', 'de-DE', 'fr-FR', 'nl-NL',
  'es-ES', 'pt-BR', 'it-IT', 'ja-JP', 'zh-CN',
  'zh-TW', 'ko-KR', 'ru-RU', 'ar-SA', 'hi-IN',
  'pl-PL', 'sv-SE', 'tr-TR',
].map(code => ({
  value: code,
  label: new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code,
}))

function onLocaleChange(e: Event) {
  setLocale((e.target as HTMLSelectElement).value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isMenuOpen.value) closeMenu()
}

watch(isMenuOpen, (open) => {
  if (window.innerWidth < 640) {
    document.body.style.overflow = open ? 'hidden' : ''
  }
  if (open) {
    nextTick(() => closeBtnRef.value?.focus())
  } else {
    menuTriggerRef.value?.focus()
  }
})

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.backdrop {
  position: fixed;
  top: env(safe-area-inset-top);
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

@media (min-width: 640px) {
  .backdrop {
    display: none;
  }
}

.app-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  background: var(--primary-teal-color);
  z-index: 100;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

@media (min-width: 640px) {
  .app-menu {
    width: 280px;
    border-left: 1px solid var(--white-alpha-20);
  }
}

.app-menu.open {
  transform: translateX(0);
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  padding-top: max(0.75rem, env(safe-area-inset-top));
  border-bottom: 1px solid var(--white-alpha-20);
  box-sizing: border-box;
  min-height: 3.4375rem;
}

.menu-title {
  font-family: var(--primary-font-family);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-white-color);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--muted-white-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.close-btn:hover,
.close-btn:focus-visible {
  color: var(--primary-white-color);
  background: var(--white-alpha-15);
  outline: none;
}

.menu-section {
  padding: 1rem;
  border-bottom: 1px solid var(--white-alpha-10);
}

.section-label {
  display: block;
  font-family: var(--primary-font-family);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--white-alpha-60);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-label {
  font-family: var(--primary-font-family);
  font-size: 0.9rem;
  color: var(--white-alpha-60);
  transition: color 0.2s;
}

.toggle-label.active {
  color: var(--primary-white-color);
  font-weight: 600;
}

.toggle-switch {
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

.toggle-switch.on {
  background: var(--muted-white-color);
}

.toggle-switch:focus-visible {
  outline: 2px solid var(--primary-white-color);
  outline-offset: 2px;
}

.thumb {
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

.toggle-switch.on .thumb {
  transform: translateX(20px);
}

select {
  width: 100%;
  background: var(--white-alpha-12);
  color: var(--primary-white-color);
  border: 1px solid var(--white-alpha-40);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-family: var(--primary-font-family);
  font-size: 0.95rem;
  cursor: pointer;
}

select option {
  background: var(--primary-teal-color);
  color: var(--primary-white-color);
}

.test-section {
  background: var(--white-alpha-10);
  border-radius: 4px;
  margin: 0.5rem;
  padding: 0.75rem 1rem;
}

.test-link {
  display: block;
  color: var(--primary-link-color);
  text-decoration: none;
  font-family: var(--primary-font-family);
  font-size: 0.85rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--white-alpha-10);
}

.test-link:last-child {
  border-bottom: none;
}

.test-link:hover,
.test-link:focus-visible {
  text-decoration: underline;
  outline: none;
}

.about-section {
  margin-top: auto;
  border-bottom: none;
}

.about-link {
  color: var(--primary-link-color);
  text-decoration: underline;
  font-family: var(--primary-font-family);
  font-size: 0.9rem;
}

.about-text {
  margin: 0.5rem 0 0;
  font-family: var(--primary-font-family);
  font-size: 0.8rem;
  color: var(--white-alpha-60);
  line-height: 1.6;
}

.about-text .about-link {
  font-size: 0.8rem;
}
</style>
