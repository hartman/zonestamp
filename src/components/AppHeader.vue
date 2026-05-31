<template>
  <header class="app-header">
    <div class="inner">
      <RouterLink to="/" class="title">zoneStamp!</RouterLink>
      <button v-show="!isMenuOpen" ref="menuBtnRef" class="menu-btn" :aria-label="t('header.openSettings')" @click="toggleMenu">
        <svg width="20" height="20" aria-hidden="true"><use href="/icons.svg#hamburger-icon" /></svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMenu } from '../composables/useMenu'

const { t } = useI18n()
const { toggleMenu, menuTriggerRef, isMenuOpen } = useMenu()
const menuBtnRef = ref<HTMLElement>()
onMounted(() => { menuTriggerRef.value = menuBtnRef.value ?? null })
</script>

<style scoped>
.app-header {
  padding: 0.75rem 0;
  padding-top: max(0.75rem, env(safe-area-inset-top));
  border-bottom: 1px solid var(--white-alpha-20);
}

.inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 max(1rem, env(safe-area-inset-right));
  padding-left: max(1rem, env(safe-area-inset-left));
}

.title {
  font-family: var(--decorative-font-family);
  font-size: 1.5rem;
  color: var(--primary-link-color);
  text-decoration: none;
}

.menu-btn {
  background: transparent;
  border: none;
  color: var(--primary-white-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  line-height: 0;
}

.menu-btn:hover,
.menu-btn:focus-visible {
  background: var(--white-alpha-15);
  outline: none;
}
</style>
