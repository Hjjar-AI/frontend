// frontend/src/composables/useTestNavigation.js
import { onMounted, onUnmounted, ref, unref } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { FALLBACK_MAX_CHOICES } from '@/utils/constants'

export function useTestNavigation(options = {}) {
  const {
    onNext = null,
    onPrevious = null,
    onAnswer = null,
    onFinish = null,
    enabled,
  } = options

  function isEnabled() {
    if (enabled === undefined) return true
    if (typeof enabled === 'function') return Boolean(enabled())
    return Boolean(unref(enabled))
  }

  const configStore = useConfigStore()

  const swipeContainer = ref(null)
  const touchStartX = ref(0)

  function isRTL() {
    return document.documentElement.dir === 'rtl'
  }

  function isInputElement(e) {
    const tag = e.target.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable
  }

  function handleKeydown(e) {
    if (!isEnabled()) return
    if (isInputElement(e)) return

    const key = e.key

    const maxChoice = configStore.maxChoices || FALLBACK_MAX_CHOICES
    const n = parseInt(key, 10)
    if (Number.isInteger(n) && n >= 1 && n <= maxChoice) {
      e.preventDefault()
      onAnswer?.(n)
    } else if (key === 'ArrowRight') {
      // In RTL, "forward" is leftward (matching reading direction),
      // so the RIGHT arrow moves backward and the LEFT arrow moves
      // forward. This is the natural RTL convention and matches the
      // ShortcutHint panel that users actually see.
      e.preventDefault()
      isRTL() ? onPrevious?.() : onNext?.()
    } else if (key === 'ArrowLeft') {
      e.preventDefault()
      isRTL() ? onNext?.() : onPrevious?.()
    } else if (key === 'Escape' && onFinish) {
      onFinish()
    }
  }

  function handleTouchStart(e) {
    if (!isEnabled()) return
    touchStartX.value = e.changedTouches[0].screenX
  }

  function handleTouchEnd(e) {
    if (!isEnabled()) return
    const diff = e.changedTouches[0].screenX - touchStartX.value
    if (Math.abs(diff) < 50) return

    if (diff > 0) {
      onPrevious?.()
    } else {
      onNext?.()
    }
  }

  function setup(element) {
    if (!element) return
    swipeContainer.value = element
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  function cleanup(element) {
    if (!element) return
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchend', handleTouchEnd)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (swipeContainer.value) cleanup(swipeContainer.value)
  })

  return { setup, cleanup }
}