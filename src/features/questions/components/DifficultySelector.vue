<!-- frontend/src/features/questions/components/DifficultySelector.vue -->
<template>
  <div class="difficulty-selector" role="group" :aria-label="t('difficulty.label')">
    <BaseButton
      v-for="opt in options"
      :key="opt.value"
      variant="outline"
      size="small"
      :class="[
        `diff-btn--${opt.value}`,
        { 'diff-btn--active': modelValue === opt.value }
      ]"
      @click="$emit('update:modelValue', opt.value)"
      :aria-pressed="modelValue === opt.value"
    >
      <i :class="opt.icon"></i>
      {{ t(opt.labelKey) }}
    </BaseButton>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'


const { t } = useI18n()

defineProps({ modelValue: String })
defineEmits(['update:modelValue'])

const options = computed(() => [
  { value: 'easy', labelKey: 'difficulty.easy', icon: 'bi bi-emoji-smile' },
  { value: 'medium', labelKey: 'difficulty.medium', icon: 'bi bi-emoji-neutral' },
  { value: 'hard', labelKey: 'difficulty.hard', icon: 'bi bi-emoji-frown' },
])
</script>