// frontend/src/composables/useClickOutside.js
import { onMounted, onUnmounted, toValue } from 'vue'

export function useClickOutside(elementRef, callback) {
  function handler(e) {
    const el = toValue(elementRef)
    if (el && !el.contains(e.target)) {
      callback(e)
    }
  }

  onMounted(() => {
    document.addEventListener('click', handler)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handler)
  })
}