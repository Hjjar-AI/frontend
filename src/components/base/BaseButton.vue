<!-- frontend/src/components/base/BaseButton.vue -->
<template>
  <button
    :type="type"
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${normalizedSize}`,
      { 'base-button--loading': loading, 'base-button--icon-only': iconOnly },
    ]"
    :disabled="disabled || loading"
    :aria-disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="handleClick"
  >
    <i v-if="loading" class="bi bi-arrow-repeat spin-icon"></i>
    <i v-else-if="icon" :class="icon" aria-hidden="true"></i>
    <span v-if="!iconOnly && $slots.default" class="base-button__label"><slot /></span>
    <slot v-else-if="iconOnly && !icon" />
  </button>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'success', 'danger', 'warning', 'info', 'outline'].includes(v)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (v) => ['sm', 'small', 'medium', 'large'].includes(v)
  },
  icon: { type: String, default: '' },
  iconOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})

const emit = defineEmits(['click'])

const normalizedSize = computed(() => props.size === 'sm' ? 'small' : props.size)

const rippleTimers = new Set()

function handleClick(event) {
  if (props.disabled || props.loading) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  createRipple(event)
  emit('click', event)
}

function createRipple(event) {
  const button = event.currentTarget
  if (!button) return

  const rect = button.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  button.style.setProperty('--ripple-x', `${x}px`)
  button.style.setProperty('--ripple-y', `${y}px`)
  button.classList.remove('base-button--ripple')
  void button.offsetWidth
  button.classList.add('base-button--ripple')

  const timer = setTimeout(() => {
    button.classList.remove('base-button--ripple')
    rippleTimers.delete(timer)
  }, 600)
  rippleTimers.add(timer)
}

onBeforeUnmount(() => {
  rippleTimers.forEach(t => clearTimeout(t))
  rippleTimers.clear()
})
</script>
