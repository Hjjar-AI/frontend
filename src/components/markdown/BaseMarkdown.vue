<!-- frontend/src/components/markdown/BaseMarkdown.vue -->
<template>
  <div
    class="base-markdown"
    :class="{ 'base-markdown--inline': inline }"
    v-html="rendered"
    dir="auto"
  ></div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown, renderInlineMarkdown } from '@/utils/markdown'

const props = defineProps({
  text: { type: String, default: '' },
  inline: { type: Boolean, default: false },
})

const rendered = computed(() => {
  if (!props.text) return ''
  return props.inline ? renderInlineMarkdown(props.text) : renderMarkdown(props.text)
})
</script>
