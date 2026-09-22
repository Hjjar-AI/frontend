<!-- frontend/src/components/markdown/BaseMarkdown.vue -->
<template>
  <!--
    Block markdown owns its direction boundary. Inline markdown
    deliberately does not: its block-level caller must use dir="auto"
    so alignment follows the rendered text's first strong character.
  -->
  <span
    v-if="inline"
    class="base-markdown base-markdown--inline"
    v-html="rendered"
  ></span>
  <div
    v-else
    class="base-markdown"
    dir="auto"
    v-html="rendered"
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
