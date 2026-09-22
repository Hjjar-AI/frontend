// frontend/src/composables/useOnline.js
import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useOnline() {
  const isOnline = ref(navigator.onLine)
  const offline = computed(() => !isOnline.value)

  function handleOnline() {
    isOnline.value = true
  }

  function handleOffline() {
    isOnline.value = false
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return { isOnline, offline }
}