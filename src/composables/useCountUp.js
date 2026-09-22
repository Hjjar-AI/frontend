// frontend/src/composables/useCountUp.js
import { ref, watch, onMounted, onBeforeUnmount, nextTick, toValue } from 'vue'

export function useCountUp(target, duration = 1000, animate = true) {
  const displayValue = ref(0)
  let animationFrame = null
  let hasStarted = false

  function runAnimation(endValue) {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }

    const startValue = displayValue.value
    const diff = endValue - startValue
    if (diff === 0) return

    const startTime = performance.now()

    function step(currentTime) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      displayValue.value = startValue + diff * eased
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step)
      } else {
        animationFrame = null
      }
    }

    animationFrame = requestAnimationFrame(step)
  }

  // Single entry point for "apply a new target value". When animation
  // is disabled, snap; otherwise run the animation.
  function apply(newTarget) {
    if (animate) {
      runAnimation(newTarget)
    } else {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
        animationFrame = null
      }
      displayValue.value = newTarget
    }
  }

  watch(target, (newTarget) => {
    if (hasStarted) {
      apply(toValue(newTarget))
    }
  })

  onMounted(() => {
    // Deferred one tick so the initial value paint is not flushed against
    // the animation's first frame.
    nextTick(() => {
      hasStarted = true
      apply(toValue(target))
    })
  })

  onBeforeUnmount(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  })

  return { displayValue }
}