<!-- frontend/src/components/base/BaseCard.vue -->
<template>
  <div
    class="base-card"
    :class="[
      `base-card--${variant}`,
      { 'base-card--hover': hover }
    ]"
    :style="accentColor ? { borderInlineStartColor: accentColor } : null"
  >
    <slot />
  </div>
</template>
<script setup>
defineProps({
  variant: {
    type: String,
    default: 'default',

    validator: (v) => ['default', 'primary', 'secondary', 'info', 'danger', 'success', 'warning'].includes(v),
  },
  hover: { type: Boolean, default: false },
  accentColor: { type: String, default: '' },
})
</script>