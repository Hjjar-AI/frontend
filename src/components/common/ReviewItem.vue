<!-- frontend/src/components/common/ReviewItem.vue -->
<template>
  <BaseCard
    class="review-item"
    :variant="result.is_correct ? 'success' : 'danger'"
  >
    <div class="review-item__header">
      <h5 class="review-item__question" dir="auto">
        <span class="review-item__index">{{ index }}.</span>
        <BaseMarkdown :text="result.question" inline />
      </h5>
      <BaseBadge :variant="result.is_correct ? 'success' : 'danger'">
        <i :class="result.is_correct ? 'bi bi-check-lg' : 'bi bi-x-lg'"></i>
        {{ result.is_correct ? t('tests.reviewCorrect') : t('tests.reviewWrong') }}
      </BaseBadge>
    </div>

    <div v-if="result.pre_answer" class="review-item__recall">
      <strong><i class="bi bi-pencil-square"></i> {{ t('tests.reviewRecallAnswer') }}</strong>
      <p dir="auto">{{ result.pre_answer }}</p>
    </div>

    <div v-if="result.confidence_score" class="review-item__confidence">
      <i class="bi bi-speedometer2"></i>
      {{ t('tests.reviewConfidence') }}: {{ confidenceLabel(result.confidence_score) }}
    </div>

    <div class="review-item__choices">
      <div
        v-for="(choice, cidx) in result.choices"
        :key="cidx"
        class="review-choice"
        :class="{
          'review-choice--correct': cidx + 1 === result.correct_answer,
          'review-choice--user': cidx + 1 === result.user_answer,
          'review-choice--wrong': cidx + 1 === result.user_answer && cidx + 1 !== result.correct_answer,
        }"
      >
        <span class="review-choice__text" dir="auto">{{ cidx + 1 }}. {{ choice }}</span>
        <i v-if="cidx + 1 === result.correct_answer" class="bi bi-check-lg review-choice__check"></i>
        <i v-if="cidx + 1 === result.user_answer && cidx + 1 !== result.correct_answer" class="bi bi-x-lg review-choice__cross"></i>
      </div>
    </div>

    <div v-if="result.explanation" class="review-item__explanation">
      <strong><i class="bi bi-lightbulb"></i> {{ t('tests.reviewExplanation') }}</strong>
      <BaseMarkdown :text="result.explanation" />
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseMarkdown from '@/components/markdown/BaseMarkdown.vue'


const { t } = useI18n()

defineProps({
  result: { type: Object, required: true },
  index: { type: Number, required: true },
})

function confidenceLabel(value) {
  if (Number(value) === 1) return t('tests.confidenceGuessing')
  if (Number(value) === 2) return t('tests.confidenceUncertain')
  return t('tests.confidenceCertain')
}
</script>
