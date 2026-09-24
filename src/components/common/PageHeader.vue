<!-- frontend/src/components/common/PageHeader.vue -->
<template>
  <div class="page-header">
    <component :is="`h${level}`" class="page-header__title">
      <i v-if="icon" :class="icon"></i>
      {{ title }}
    </component>
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
  level: {
    type: Number,
    default: 1,
    validator: (value) => value >= 1 && value <= 6,
  },
})
</script>
