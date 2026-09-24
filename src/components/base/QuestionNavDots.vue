<template>
  <nav v-if="total > 1" class="question-nav-dots" :aria-label="t('questions.navigationAria')">
    <button
      type="button"
      class="question-nav-dots__control"
      :disabled="disabled || current === 0"
      :aria-label="t('questions.navDotPrevAria')"
      @click="emit('go', current - 1)"
    >
      <DirectionalIcon ltr="bi bi-chevron-left" rtl="bi bi-chevron-right" />
    </button>

    <button
      v-for="index in visibleIndexes"
      :key="index"
      type="button"
      class="question-nav-dots__item"
      :class="{
        'question-nav-dots__item--active': index === current,
        'question-nav-dots__item--answered': hasAnswer(index),
      }"
      :aria-current="index === current ? 'step' : undefined"
      :disabled="disabled"
      :aria-label="
        t('questions.navDotAriaLabel', {
          index: index + 1,
          status: statusLabel(index),
        })
      "
      @click="emit('go', index)"
    >
      {{ index + 1 }}
    </button>

    <button
      type="button"
      class="question-nav-dots__control"
      :disabled="disabled || current === total - 1"
      :aria-label="t('questions.navDotNextAria')"
      @click="emit('go', current + 1)"
    >
      <DirectionalIcon ltr="bi bi-chevron-right" rtl="bi bi-chevron-left" />
    </button>

    <span v-if="total > visibleLimit" class="question-nav-dots__summary">
      {{ t('questions.navDotSummary', { current: current + 1, total }) }}
    </span>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

const { t } = useI18n()

const props = defineProps({
  total: { type: Number, required: true },
  current: { type: Number, required: true },
  hasAnswer: { type: Function, required: true },
  maxVisibleDots: { type: Number, default: 9 },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['go'])
const isMobile = useMediaQuery('(max-width: 640px)')

const visibleLimit = computed(() =>
  Math.max(1, Math.min(props.maxVisibleDots, isMobile.value ? 5 : 9)),
)

const visibleIndexes = computed(() => {
  const count = Math.min(props.total, visibleLimit.value)
  const maxStart = Math.max(0, props.total - count)
  const start = Math.min(maxStart, Math.max(0, props.current - Math.floor(count / 2)))
  return Array.from({ length: count }, (_, offset) => start + offset)
})

function statusLabel(index) {
  if (index === props.current) return t('questions.navDotCurrent')
  if (props.hasAnswer(index)) return t('questions.navDotAnswered')
  return t('questions.navDotUnanswered')
}
</script>
