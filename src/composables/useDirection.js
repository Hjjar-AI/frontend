// frontend/src/composables/useDirection.js
//
// Reactive text-direction reader for Vue components.
//
// Returns:
//   • `direction` — 'rtl' | 'ltr'
//   • `isRTL`     — boolean convenience
//   • `isLTR`     — boolean convenience
//
// HOW THE DIRECTION CHANGES AT RUNTIME
// ------------------------------------
// The app's locale switch path is:
//
//     setLocale()           (i18n/index.js)
//       → applyLocaleToDOM() (i18n/helpers/direction.js)
//           → <html dir="…"> mutation
//
// That is a direct DOM write. Browsers do NOT fire a
// `languagechange` event on `window` for direct DOM writes — they
// only fire it for user-agent-driven locale changes. To bridge the
// gap, `applyLocaleToDOM` also dispatches a custom event on
// `window` called `app:locale-changed`. This composable listens for
// both:
//
//   • `languagechange` — correct for browser-driven locale changes
//     (e.g. a future user preference in browser chrome).
//   • `app:locale-changed` — correct for in-app language switches.
//
// Without the custom event, a component that reads `dir` at mount
// time and never re-reads would show stale direction after a mid-
// session language switch.
//
// WHY NOT READ `document.dir` DIRECTLY IN TEMPLATES
// -------------------------------------------------
// Template bindings that call `document.documentElement.dir` are not
// reactive — Vue does not track DOM reads. The composable's ref is
// the reactive bridge.

import { ref, computed, onMounted, onUnmounted } from 'vue'

const APP_LOCALE_EVENT = 'app:locale-changed'

function readDirection() {
  if (typeof document === 'undefined') return 'ltr'
  return document.documentElement.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr'
}

export function useDirection() {
  // Initial read happens during setup, so the first render already
  // has the correct direction. `applyLocaleToDOM` runs before
  // `app.mount('#app')` in main.js, so this is always populated.
  const direction = ref(readDirection())

  function sync() {
    direction.value = readDirection()
  }

  onMounted(() => {
    // Re-sync on mount in case `dir` changed between setup and mount.
    // The window is tiny (one synchronous render pass) but non-zero,
    // and this is a cheap safety net.
    sync()
    if (typeof window === 'undefined') return
    window.addEventListener('languagechange', sync)
    window.addEventListener(APP_LOCALE_EVENT, sync)
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('languagechange', sync)
    window.removeEventListener(APP_LOCALE_EVENT, sync)
  })

  return {
    direction,
    isRTL: computed(() => direction.value === 'rtl'),
    isLTR: computed(() => direction.value === 'ltr'),
  }
}