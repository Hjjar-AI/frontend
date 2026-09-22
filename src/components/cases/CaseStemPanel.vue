<!-- frontend/src/components/cases/CaseStemPanel.vue -->
<!--
  Shared clinical-case vignette panel.

  Rendered above the question text whenever a question carries a
  shared case stem. Extracted from three near-identical inline
  copies in:
    • features/testCommon/TestQuestion.vue
    • features/testCommon/QuestionDisplay.vue
    • features/masterExams/views/MasterExamRunner.vue

  The three copies were byte-identical modulo the source of `stem`.
  Any future change to the panel (collapse toggle, markdown warning,
  length cap) now lands in one file instead of three.

  NOT extracted: the collapsible variants in QuestionCard.vue and
  QuestionForm.vue. Those use a different markup shape (a `<details>`
  wrapper and an editor) and serve different purposes.
-->
<template>
  <div class="case-stem-panel">
    <div class="case-stem-panel__header">
      <i class="bi bi-journal-medical"></i>
      <span>{{ t('tests.caseStemTitle') }}</span>
    </div>
    <div class="case-stem-panel__body" dir="auto">
      <BaseMarkdown :text="stem" />
    </div>
  </div>
</template>

<script setup>
import BaseMarkdown from '@/components/markdown/BaseMarkdown.vue'

const { t } = useI18n()

defineProps({
  // The shared vignette. Callers should guard on `v-if` before
  // rendering this component, so `stem` is expected non-empty.
  stem: { type: String, required: true },
})
</script>
