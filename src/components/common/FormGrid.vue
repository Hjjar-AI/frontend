<!-- frontend/src/components/common/FormGrid.vue -->
<template>
  <div class="form-grid" :class="{ 'form-grid--single': singleColumn }">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  singleColumn: { type: Boolean, default: false },
})
</script>

