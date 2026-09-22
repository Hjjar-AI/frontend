<!-- frontend/src/components/base/StatTile.vue -->
<template>
  <BaseCard class="stat-tile" :style="{ '--card-accent': accent }">
    <span class="stat-tile__value">{{ displayValue }}</span>
    <span class="stat-tile__label">{{ label }}</span>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue'
import { useCountUp } from '@/composables/useCountUp'
import BaseCard from './BaseCard.vue'

const props = defineProps({
  value: { type: [Number, String], required: true },
  label: { type: String, required: true },
  accent: { type: String, default: '' },
})

// A value is safe to hand to `useCountUp` only when it is a plain
// number — a real number, or a string whose text is exactly a JS
// number literal ("42", "-3.5"). Anything else is a PRE-FORMATTED
// display string and must be rendered verbatim.
//
// The previous implementation called `parseFloat` on every string,
// which silently truncated formatted values:
//   "1,234"  → 1     (thousands separator stops the parse)
//   "12:34"  → 12    (MM:SS time string)
//   "75.3%"  → 75.3  (unit dropped)
//
// The three affected call sites are TestResults.vue (localized
// counts and MM:SS time), Profile.vue (percentage), and any future
// consumer that passes a pre-formatted string.
//
// The round-trip check (`String(n) === trimmed`) is what makes the
// detection precise rather than approximate:
//   "42"     → Number 42     → String "42"      → match, animate
//   "007"    → Number 7      → String "7" ≠ "007" → render as-is
//   "1,234"  → Number NaN    → not finite        → render as-is
//   "75.3%"  → Number 75.3   → String "75.3" ≠ "75.3%" → render as-is
function isAnimatable(value) {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return false
    const n = Number(trimmed)
    return Number.isFinite(n) && String(n) === trimmed
  }
  return false
}

const animatable = computed(() => isAnimatable(props.value))

// When `animatable` is false the composable's target is pinned to 0
// and its output is ignored by `displayValue` below — but the
// composable still runs (it is called unconditionally, as every Vue
// composable must be). That has no visible effect: `displayValue`
// picks `props.value` in that branch.
const numericTarget = computed(() => (animatable.value ? Number(props.value) : 0))

const { displayValue: animatedValue } = useCountUp(numericTarget, 1000, true)

const displayValue = computed(() =>
  animatable.value ? animatedValue.value : props.value
)
</script>