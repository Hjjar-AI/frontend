<template>
  <SectionHeader
    class="card-header"
    :title="title"
    :description="description"
    :icon="icon"
    :level="level"
    compact
  >
    <template v-if="$slots.badges" #badges><slot name="badges" /></template>
    <template v-if="$slots.actions" #actions><slot name="actions" /></template>
  </SectionHeader>
</template>

<script setup>
import SectionHeader from './SectionHeader.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  level: { type: Number, default: 3 },
})
</script>
