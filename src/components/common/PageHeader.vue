<!-- frontend/src/components/common/PageHeader.vue -->
<template>
  <div class="page-header">
    <h2 class="page-header__title">
      <i v-if="icon" :class="icon"></i>
      {{ title }}
    </h2>
    <div v-if="$slots.badges" class="page-header__badges">
      <slot name="badges" />
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '' },
})
</script>