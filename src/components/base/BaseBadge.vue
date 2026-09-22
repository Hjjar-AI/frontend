<!-- frontend/src/components/base/BaseBadge.vue -->
<template>
  <span class="badge" :class="[`badge-${variant}`, { 'badge--small': small, 'status-badge': status }]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'secondary',
    validator: (v) => ['success', 'danger', 'warning', 'info', 'secondary'].includes(v)
  },
  small: { type: Boolean, default: false },
  status: { type: Boolean, default: false },
})
</script>

