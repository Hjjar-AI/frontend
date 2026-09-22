// frontend/src/composables/composableHelpers.js
import { reactive, ref, computed } from 'vue'

// Create a module-level singleton reactive object with a stable reference.
export function createSingletonReactive(initialState = {}) {
  const state = reactive(initialState)
  return state
}

export function useAsyncState() {
  const status = ref('idle')
  const error = ref(null)

  const isLoading = computed(() => status.value === 'loading')
  const isError = computed(() => status.value === 'error')

  function setLoading() {
    status.value = 'loading'
    error.value = null
  }
  function setSuccess() {
    status.value = 'success'
  }
  function setError(err) {
    status.value = 'error'
    error.value = err?.message || String(err)
  }
  function reset() {
    status.value = 'idle'
    error.value = null
  }

  return {
    status,
    error,
    isLoading,
    isError,
    setLoading,
    setSuccess,
    setError,
    reset,
  }
}