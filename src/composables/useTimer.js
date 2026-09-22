// frontend/src/composables/useTimer.js
import { ref, computed, onUnmounted } from 'vue'
import { formatTime } from '@/utils/timer'

export function useTimer(options = {}) {
  const {
    initialSeconds = 0,
    countdown = false,
    autoStart = false,
    onTick = null,
    onComplete = null,
  } = options

  const seconds = ref(initialSeconds)
  const isRunning = ref(false)
  const startTimestamp = ref(null)
  const accumulated = ref(0)
  let intervalId = null

  const display = computed(() => formatTime(seconds.value))

  function tick() {
    const now = Date.now()
    const elapsed = Math.floor((now - startTimestamp.value) / 1000) + accumulated.value

    if (countdown) {
      seconds.value = Math.max(0, initialSeconds - elapsed)
      if (seconds.value <= 0) {
        stop()
        if (onComplete) onComplete()
        return
      }
    } else {
      seconds.value = elapsed
    }

    if (onTick) onTick(seconds.value)
  }

  function start(startTime = null) {
    if (isRunning.value) return

    const now = Date.now()
    if (startTime !== null && startTime > now) {
      startTime = now
    }

    isRunning.value = true
    startTimestamp.value = startTime || now
    accumulated.value = 0
    intervalId = setInterval(tick, 250)
  }

  function pause() {
    if (!isRunning.value) return

    isRunning.value = false

    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }

    // Only accumulate if we have a valid start timestamp
    if (startTimestamp.value !== null) {
      accumulated.value += Math.floor((Date.now() - startTimestamp.value) / 1000)
      startTimestamp.value = null
    }
  }

  function resume() {
    if (isRunning.value) return

    startTimestamp.value = Date.now()
    isRunning.value = true
    intervalId = setInterval(tick, 250)
  }

  function stop() {
    isRunning.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function reset(newSeconds = null) {
    stop()
    if (newSeconds !== null) seconds.value = newSeconds
    else seconds.value = initialSeconds
    accumulated.value = 0
    startTimestamp.value = null
  }

  if (autoStart) start()

  onUnmounted(() => stop())

  return { seconds, display, isRunning, start, pause, resume, stop, reset }
}