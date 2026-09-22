// frontend/src/composables/useNotify.js
import { useToastStore } from '@/stores/toastStore'

export function useNotify() {
  const toastStore = useToastStore()

  function notify(message, type = 'info', duration = 4000) {
    const effectiveDuration = type === 'error' ? 8000 : duration
    return toastStore.addToast(message, type, effectiveDuration)
  }

  return { notify }
}