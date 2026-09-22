<!-- frontend/src/components/common/Timer.vue -->
<!--
  Countdown or stopwatch display.

  TICK EVENT (third-review item 3)
  --------------------------------
  The component emits a `tick` event on every internal tick with
  `{ elapsed, remaining }`. `elapsed` is the seconds the timer has
  been running (matching `useTimer`'s `seconds` ref); `remaining` is
  `totalSeconds - elapsed`, or `null` when no `totalSeconds` prop was
  passed (stopwatch mode).

  A parent that needs to act on the same clock the display reads —
  for example, to apply a "critical time remaining" class or to
  trigger an auto-finish — listens to this event instead of running
  its own `setInterval`. That removes the class of bug where the
  displayed countdown and the parent's decision diverge by up to the
  difference between the two intervals' phases.

  The event fires at the timer's internal tick rate (250 ms), not the
  displayed second rate, so a parent that reacts on `remaining === 0`
  sees the transition on the first tick at or after zero.
-->
<template>
  <div
    class="timer"
    :class="{
      'timer--warning': isWarning,
      'timer--critical': isCritical,
      'timer--overtime': isOvertime,
    }"
    aria-live="off"
    aria-atomic="true"
  >
    <i class="bi bi-stopwatch timer__icon"></i>
    <span class="timer__time">{{ display }}</span>
  </div>
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue'
import { useTimer } from '@/composables/useTimer'
import { formatTime } from '@/utils/timer'

const props = defineProps({
  startTime: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  totalSeconds: { type: Number, default: null },
  overtime: { type: Boolean, default: false },
})

const emit = defineEmits(['tick'])

const timer = useTimer({ autoStart: false })

watch(() => props.startTime, (val) => {
  if (val) timer.start(val.getTime())
}, { immediate: true })

watch(() => props.isActive, (active) => {
  active && props.startTime ? timer.resume() : timer.pause()
})

onUnmounted(() => timer.stop())

// Raw remaining seconds (can go negative during overtime).
const remainingRaw = computed(() => {
  if (props.totalSeconds == null) return null
  return props.totalSeconds - timer.seconds.value
})

// Clamped remaining (never negative) — used for ratio calculations.
const remainingSeconds = computed(() => {
  if (remainingRaw.value === null) return null
  return Math.max(0, remainingRaw.value)
})

// True when the timer has crossed zero in overtime mode.
const isOvertime = computed(() => {
  return props.overtime && remainingRaw.value !== null && remainingRaw.value < 0
})

// Display logic.
const display = computed(() => {
  if (props.totalSeconds != null) {
    const remaining = remainingRaw.value
    if (remaining >= 0) {
      return formatTime(remaining)
    }
    if (props.overtime) {
      return '+' + formatTime(-remaining)
    }
    return formatTime(0)
  }
  return timer.display
})

// Warning / critical only apply while counting down (remaining > 0).
const isCritical = computed(() => {
  if (remainingSeconds.value === null) return false
  if (isOvertime.value) return false
  if (remainingSeconds.value === 0) return false
  const ratio = remainingSeconds.value / props.totalSeconds
  return ratio <= 0.1
})

const isWarning = computed(() => {
  if (remainingSeconds.value === null) return false
  if (isOvertime.value) return false
  if (remainingSeconds.value === 0) return false
  const ratio = remainingSeconds.value / props.totalSeconds
  return ratio > 0.1 && ratio <= 0.2
})

// ──────────────────────────────────────────────────────────────────
// Emit a tick on every change of `timer.seconds`.
//
// `timer.seconds` is the elapsed-seconds ref from `useTimer`, which
// updates on its internal 250 ms interval. Watching it here keeps the
// parent in sync with the exact value this component is displaying —
// same source, same moment.
//
// The watcher does not fire on the initial render (Vue's default is
// non-immediate). A parent that wants an immediate first tick reads
// `remainingSeconds` once at mount; every subsequent change is
// delivered through this event.
// ──────────────────────────────────────────────────────────────────
watch(timer.seconds, (elapsed) => {
  emit('tick', {
    elapsed,
    remaining: remainingRaw.value,
  })
})
</script>