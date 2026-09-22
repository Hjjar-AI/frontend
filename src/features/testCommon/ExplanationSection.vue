<!-- frontend/src/features/testCommon/ExplanationSection.vue -->

<template>
  <Transition name="slide-down">
    <div v-if="explanation" class="explanation-section">
      <strong><i class="bi bi-lightbulb"></i> {{ t('tests.reviewExplanation') }}</strong>
      <BaseMarkdown :text="explanation" />
    </div>
  </Transition>
</template>

<script setup>
import BaseMarkdown from '@/components/markdown/BaseMarkdown.vue'


const { t } = useI18n()

defineProps({
  explanation: { type: String, required: true },
})
</script>
