<template>
  <component :is="as" class="bidi-text" dir="auto"><slot>{{ text }}</slot></component>
</template>

<script setup>
defineProps({
  as: { type: String, default: 'span' },
  text: { type: [String, Number], default: '' },
})
</script>
