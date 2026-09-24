<!-- frontend/src/components/base/DifficultyBadge.vue -->
<template>
  <BaseBadge :variant="variant" status class="difficulty-badge" :class="`difficulty-badge--${difficulty}`">
    <span class="difficulty-badge__dot"></span>
    {{ label }}
  </BaseBadge>
</template>

<script setup>
import { computed } from 'vue'
import BaseBadge from './BaseBadge.vue'

import { DIFFICULTY_LABEL_KEYS } from '@/utils/constants'


const { t } = useI18n()

const props = defineProps({
  difficulty: { type: String, required: true },
})

const label = computed(() => {
  const key = DIFFICULTY_LABEL_KEYS[props.difficulty]
  // Unknown difficulty values fall through to the raw string so a
  // backend-added value still renders something instead of blank.
  return key ? t(key) : props.difficulty
})

const variant = computed(() => ({
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
})[props.difficulty] || 'secondary')
</script>
