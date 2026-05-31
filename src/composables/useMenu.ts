import { ref } from 'vue'

const isMenuOpen = ref(false)
const menuTriggerRef = ref<HTMLElement | null>(null)

export function useMenu() {
  function closeMenu() { isMenuOpen.value = false }
  function toggleMenu() { isMenuOpen.value = !isMenuOpen.value }

  return { isMenuOpen, closeMenu, toggleMenu, menuTriggerRef }
}
