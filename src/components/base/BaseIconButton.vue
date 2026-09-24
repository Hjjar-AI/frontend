<template>
  <BaseButton
    :variant="variant"
    :size="size"
    :icon="icon"
    icon-only
    :disabled="disabled"
    :loading="loading"
    :aria-label="label"
    :title="title || label"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
import BaseButton from './BaseButton.vue'

defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  title: { type: String, default: '' },
  variant: { type: String, default: 'ghost' },
  size: { type: String, default: 'medium' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>
