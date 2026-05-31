<template>
  <div class="app" :class="{ 'menu-open': isMenuOpen }">
    <AppHeader />
    <main class="main-content">
      <div class="inner">
        <slot />
      </div>
    </main>
    <AppFooter />
    <AppMenu />
  </div>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import AppMenu from './AppMenu.vue'
import { useMenu } from '../composables/useMenu'

const { isMenuOpen } = useMenu()
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  height: 100dvh;
  flex-direction: column;
  overflow: hidden;
  transition: margin-right 0.3s ease;
}

@media (min-width: 640px) {
  .app.menu-open {
    margin-right: 280px;
  }
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.inner {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

@media (min-width: 640px) {
  .inner {
    justify-content: center;
  }
}
</style>
