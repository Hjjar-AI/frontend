<!-- frontend/src/components/base/BaseEmptyState.vue -->
<template>
  <div class="base-empty-state" role="status" aria-live="polite" :data-reason="reason">
    <div class="base-empty-state__illustration">
      <i class="illustration__bg" :class="bgIcon"></i>
      <i class="illustration__fg" :class="fgIcon"></i>
    </div>
    <component :is="`h${level}`" class="base-empty-state__title">{{ displayTitle }}</component>
    <p class="base-empty-state__message" v-if="message">{{ message }}</p>
    <div v-if="$slots.primary || $slots.secondary || $slots.actions" class="base-empty-state__actions">
      <slot name="secondary" />
      <slot name="actions" />
      <slot name="primary" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const { t } = useI18n()

const props = defineProps({
  icon: { type: String, default: '' },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  bgIconOverride: { type: String, default: '' },
  reason: {
    type: String,
    default: 'generic',
    validator: (value) => ['first-use', 'no-results', 'filtered', 'unavailable', 'generic'].includes(value),
  },
  level: { type: Number, default: 3, validator: (value) => value >= 2 && value <= 6 },
})

const reasonIcons = {
  'first-use': 'bi-plus-circle',
  'no-results': 'bi-search',
  filtered: 'bi-funnel',
  unavailable: 'bi-cloud-slash',
  generic: 'bi-inbox',
}
const reasonTitleKeys = {
  'first-use': 'emptyStates.firstUse',
  'no-results': 'emptyStates.noResults',
  filtered: 'emptyStates.filtered',
  unavailable: 'emptyStates.unavailable',
  generic: 'emptyStates.generic',
}
const displayTitle = computed(() => props.title || t(reasonTitleKeys[props.reason]))
const resolvedIcon = computed(() => props.icon || reasonIcons[props.reason])
const isBootstrapIcon = computed(() => resolvedIcon.value.trim().startsWith('bi-'))
const fgIcon = computed(() => isBootstrapIcon.value ? `bi ${resolvedIcon.value}` : resolvedIcon.value)

const bgIcon = computed(() => {
  if (props.bgIconOverride) {
    return props.bgIconOverride.startsWith('bi-') ? `bi ${props.bgIconOverride}` : props.bgIconOverride
  }
  if (resolvedIcon.value.includes('question') || resolvedIcon.value.includes('journal')) return 'bi bi-journal-x'
  if (resolvedIcon.value.includes('bookmark')) return 'bi bi-bookmark-x'
  if (resolvedIcon.value.includes('folder')) return 'bi bi-folder-x'
  if (resolvedIcon.value.includes('flag')) return 'bi bi-flag'
  if (resolvedIcon.value.includes('people')) return 'bi bi-people'
  if (resolvedIcon.value.includes('tags')) return 'bi bi-tags'
  return 'bi bi-inbox'
})
</script>
