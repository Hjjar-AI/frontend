// frontend/src/composables/useDebounceFn.js
import { onBeforeUnmount } from 'vue'

export function useDebounceFn(fn, delay = 300) {
  let timer = null

  function debounced(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  onBeforeUnmount(() => {
    cancel()
  })

  return { debounced, cancel }
}