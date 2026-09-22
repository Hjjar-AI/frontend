<!-- frontend/src/components/base/DirectionalIcon.vue -->
<template>
  <i :class="iconClass" :aria-hidden="ariaHidden ? 'true' : undefined" />
</template>

<script setup>
import { computed } from 'vue'
import { useDirection } from '@/composables/useDirection'

const props = defineProps({
  // Icon class when <html dir="ltr">.
  ltr: { type: String, required: true },
  // Icon class when <html dir="rtl">.
  rtl: { type: String, required: true },
  // Set to false when the icon itself is the only content of the
  // control and carries semantic meaning. Rare — prefer wrapping the
  // icon in a labelled button.
  ariaHidden: { type: Boolean, default: true },
})

const { isRTL } = useDirection()

const iconClass = computed(() => (isRTL.value ? props.rtl : props.ltr))
</script>