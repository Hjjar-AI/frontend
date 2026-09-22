// frontend/src/composables/useSubmitGuard.js
import { useAsyncState } from './composableHelpers'

export function useSubmitGuard() {
  const { isLoading, setLoading, setSuccess, setError } = useAsyncState()

  const isSubmitting = isLoading

  async function guard(fn) {
    if (isSubmitting.value) return
    setLoading()
    try {
      const res = await fn()
      setSuccess()
      return res
    } catch (e) {
      setError(e)
      throw e
    }
  }

  return { isSubmitting, guard }
}