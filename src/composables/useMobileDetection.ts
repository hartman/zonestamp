import { ref, onMounted, onUnmounted } from 'vue'

// DPR check excludes desktop browsers at narrow viewport widths (e.g. devtools)
// while still matching real mobile devices at 2×/3× screen density.
const MQ = '(max-width: 639px) and (min-resolution: 2dppx)'

export function useMobileDetection() {
  const isMobile = ref(false)
  let mql: MediaQueryList | null = null

  function onMqlChange(e: MediaQueryListEvent) { isMobile.value = e.matches }

  onMounted(() => {
    mql = window.matchMedia(MQ)
    isMobile.value = mql.matches
    mql.addEventListener('change', onMqlChange)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', onMqlChange)
  })

  return { isMobile }
}
