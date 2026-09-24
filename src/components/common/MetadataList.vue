<template>
  <ul class="metadata-list" :class="{ 'metadata-list--compact': compact }">
    <li v-for="(item, index) in items" :key="item.key || index" class="metadata-list__item">
      <i v-if="item.icon" :class="item.icon" aria-hidden="true"></i>
      <span v-if="item.label" class="metadata-list__label">{{ item.label }}</span>
      <BidiText class="metadata-list__value" :text="item.value" />
    </li>
  </ul>
</template>

<script setup>
import BidiText from './BidiText.vue'

defineProps({
  items: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false },
})
</script>
