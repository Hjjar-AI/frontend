// frontend/src/composables/useFocusReturn.js

import { ref, onBeforeUnmount } from 'vue'

export function useFocusReturn() {
  const previousActiveElement = ref(null)

  function storeFocus() {
    previousActiveElement.value = document.activeElement
  }

  function restoreFocus() {

    const el = previousActiveElement.value
    previousActiveElement.value = null

    if (!el || typeof el.focus !== 'function') return

    // Defer by one task so we run after the currently-firing click
    // event has finished its default behavior (which would otherwise
    // steal focus back to the just-clicked element).
    setTimeout(() => {
      // Guard against the element being detached during the delay
      // (e.g. the dropdown's parent was unmounted by a route change).
      if (document.contains(el)) {
        el.focus()
      }
    }, 10)
  }

  onBeforeUnmount(() => {
    // Nothing to do — restoreFocus is always called explicitly by the
    // consumer. Kept as a placeholder in case future cleanup is needed.
  })

  return { storeFocus, restoreFocus }
}