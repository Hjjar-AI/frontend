<!-- frontend/src/components/common/AlertBox.vue -->
<template>
  <div
    class="alert-box"
    :class="`alert-box--${variant}`"
    :role="variant === 'danger' || variant === 'warning' ? 'alert' : 'status'"
    :aria-live="variant === 'danger' || variant === 'warning' ? 'assertive' : 'polite'"
  >
    <i :class="icon"></i>
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'warning', 'info', 'danger'].includes(v)
  },
  message: { type: String, required: true },
})

const icon = computed(() => {
  const icons = {
    success: 'bi bi-check-circle',
    warning: 'bi bi-exclamation-triangle',
    info: 'bi bi-info-circle',
    danger: 'bi bi-x-circle'
  }
  return icons[props.variant] || icons.info
})
</script>
