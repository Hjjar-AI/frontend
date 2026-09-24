<template>
  <article class="entity-row" :class="{ 'entity-row--inactive': inactive }">
    <div class="entity-row__body">
      <div class="entity-row__heading">
        <component :is="`h${level}`" class="entity-row__title" dir="auto">{{ title }}</component>
        <div v-if="$slots.status" class="entity-row__status"><slot name="status" /></div>
      </div>
      <p v-if="description" class="entity-row__description" dir="auto">{{ description }}</p>
      <MetadataList v-if="metadata.length" :items="metadata" compact />
      <div v-if="$slots.metadata" class="entity-row__metadata"><slot name="metadata" /></div>
      <slot />
    </div>
    <div v-if="$slots.actions" class="entity-row__actions"><slot name="actions" /></div>
  </article>
</template>

<script setup>
import MetadataList from './MetadataList.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  inactive: { type: Boolean, default: false },
  level: { type: Number, default: 3, validator: value => value >= 2 && value <= 6 },
  metadata: { type: Array, default: () => [] },
})
</script>
