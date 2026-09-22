// frontend/src/composables/useRotatingContent.js
//
// Rotating-content state for a pool of strings shown one at a time
// with an auto-advance timer.
//
// WHAT THIS REPLACES
// ------------------
// Two views had grown the same shape independently:
//
//   • `Dashboard.vue`    — a "did you know?" tip that rotates
//                          every 10 minutes and refreshes from an
//                          API when the locale changes.
//   • `TestResults.vue`  — a motivational quote that rotates every
//                          10 minutes and is redrawn on demand.
//
// Both maintained:
//   • an index into the pool,
//   • a `key` ref used to force a transition animation on advance,
//   • a `current` computed that returns the pool[index],
//   • an `advance()` that steps to the next item,
//   • an `onMounted` interval,
//   • an `onUnmounted` cleanup,
//   • a locale-reactive shuffle behaviour.
//
// The two implementations had already drifted: the Dashboard's
// locale watcher reset the pool to the fallback list and then
// re-fetched; TestResults' watcher jumped to a random index. This
// composable captures the common shape and lets each consumer
// control pool sourcing without duplicating the timer/cleanup.
//
// POOL REACTIVITY
// ---------------
// `pool` is a Ref<string[]> or ComputedRef<string[]>. The
// composable watches it for identity changes and shuffles on every
// change — which covers both cases:
//
//   • Dashboard reassigns `tips.value = newList` on locale change
//     and after the tips API resolves.
//   • TestResults uses `computed(() => selectMotivationalQuotes(locale.value))`.
//     `selectMotivationalQuotes` returns a static array reference,
//     so the computed only produces a new identity when `locale`
//     changes.
//
// `immediate: true` gives the initial random seed, matching the
// original `Math.floor(Math.random() * pool.length)` behaviour.
//
// INTERVAL
// --------
// `intervalMs` defaults to 10 minutes (600 000 ms), matching both
// original consumers. Set to 0 to disable the timer entirely — the
// pool and `advance()` still work, so a caller that drives rotation
// from an external source (a click, a route change) does not pay
// for a timer it never uses.

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export function useRotatingContent({ pool, intervalMs = 600000 }) {
  const index = ref(0)
  const key = ref(0)
  let timer = null

  const current = computed(() => {
    const list = pool.value || []
    if (!list.length) return ''
    return list[index.value % list.length]
  })

  function advance() {
    const list = pool.value || []
    if (list.length < 2) return
    index.value = (index.value + 1) % list.length
    key.value++
  }

  function shuffle() {
    const list = pool.value || []
    if (!list.length) return
    index.value = Math.floor(Math.random() * list.length)
    key.value++
  }

  // Re-shuffle on any pool identity change. This is what makes the
  // composable locale-reactive for the TestResults case (the pool
  // is a computed over locale) and fetch-reactive for the Dashboard
  // case (the pool is reassigned after the API resolves).
  watch(pool, () => shuffle(), { immediate: true })

  onMounted(() => {
    if (intervalMs > 0) {
      timer = setInterval(advance, intervalMs)
    }
  })

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })

  return { current, key, advance, shuffle }
}