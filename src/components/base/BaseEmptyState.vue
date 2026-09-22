<!-- frontend/src/components/base/BaseEmptyState.vue -->
<template>
  <div class="base-empty-state">
    <div class="base-empty-state__illustration">
      <i class="illustration__bg" :class="bgIcon"></i>
      <i class="illustration__fg" :class="fgIcon"></i>
    </div>
    <h4 class="base-empty-state__title">{{ title }}</h4>
    <p class="base-empty-state__message" v-if="message">{{ message }}</p>
    <slot name="actions"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  bgIconOverride: { type: String, default: '' },
})

const isBootstrapIcon = computed(() => props.icon.trim().startsWith('bi-'))
const fgIcon = computed(() => isBootstrapIcon.value ? `bi ${props.icon}` : props.icon)

const bgIcon = computed(() => {
  if (props.bgIconOverride) {
    return props.bgIconOverride.startsWith('bi-') ? `bi ${props.bgIconOverride}` : props.bgIconOverride
  }
  if (props.icon.includes('question') || props.icon.includes('journal')) return 'bi bi-journal-x'
  if (props.icon.includes('bookmark')) return 'bi bi-bookmark-x'
  if (props.icon.includes('folder')) return 'bi bi-folder-x'
  if (props.icon.includes('flag')) return 'bi bi-flag'
  if (props.icon.includes('people')) return 'bi bi-people'
  if (props.icon.includes('tags')) return 'bi bi-tags'
  return 'bi bi-inbox'
})
</script>