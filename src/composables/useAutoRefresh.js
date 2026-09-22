// frontend/src/composables/useAutoRefresh.js
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAsyncState } from './composableHelpers'

const MAX_CONSECUTIVE_ERRORS = 5
const BASE_BACKOFF_MS = 5000

export function useAutoRefresh(fetchFn, intervalMs = 30000, immediate = true) {
  const lastUpdated = ref(null)
  const { status, setLoading, setSuccess, setError } = useAsyncState()
  const isRefreshing = computed(() => status.value === 'loading')
  let intervalId = null
  let consecutiveErrors = 0
  let currentInterval = intervalMs

  async function refresh() {
    if (status.value === 'loading') return
    setLoading()
    try {
      const result = await fetchFn()

      if (result === null) {
        throw new Error('fetchFn returned null (useCrudActions.wrap failure)')
      }
      lastUpdated.value = new Date()
      setSuccess()
      // Reset backoff on success
      consecutiveErrors = 0
      if (currentInterval !== intervalMs) {
        currentInterval = intervalMs
        restartInterval()
      }
    } catch (e) {
      console.error('Auto-refresh failed:', e)
      setError(e)
      consecutiveErrors++
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        // Stop retrying after max consecutive errors
        stop()
        console.warn(`Auto-refresh stopped after ${MAX_CONSECUTIVE_ERRORS} consecutive errors.`)
        return
      }
      // Increase interval with exponential backoff
      currentInterval = Math.min(intervalMs * Math.pow(2, consecutiveErrors), 300000) // cap at 5 min
      restartInterval()
    }
  }

  function restartInterval() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    intervalId = setInterval(refresh, currentInterval)
  }

  function start() {
    if (intervalId) return
    consecutiveErrors = 0
    currentInterval = intervalMs
    if (immediate) refresh()
    intervalId = setInterval(refresh, currentInterval)
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stop()
    } else {
      start()
    }
  }

  onMounted(() => {
    start()
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return { lastUpdated, isRefreshing, refresh, stop, start }
}