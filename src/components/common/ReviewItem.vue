<!-- frontend/src/components/common/ReviewItem.vue -->
<template>
  <BaseCard
    class="review-item"
    :variant="result.is_correct ? 'success' : 'danger'"
  >
    <div class="review-item__header">
      <!--
        Question text — wrapper carries `dir="auto"`, `BaseMarkdown`
        inline mode renders as a bare <span> with no `dir`, so the
        wrapper's auto-detection reaches the question text. The
        leading `{{ index }}.` number is a bidi-neutral run and does
        not affect which script the auto algorithm finds first.
      -->
      <h5 class="review-item__question" dir="auto">
        <span class="review-item__index">{{ index }}.</span>
        <BaseMarkdown :text="result.question" inline />
      </h5>
      <BaseBadge :variant="result.is_correct ? 'success' : 'danger'">
        <i :class="result.is_correct ? 'bi bi-check-lg' : 'bi bi-x-lg'"></i>
        {{ result.is_correct ? t('tests.reviewCorrect') : t('tests.reviewWrong') }}
      </BaseBadge>
    </div>

    <!--
      CHOICE ROWS — `dir="auto"` on the outer row <div> and on NO
      descendant.

      Same invariant as QuestionDisplay.vue: the row <div> is the
      block-level box whose computed `direction` drives
      `text-align: start` for the choice text, and it is the
      auto-detection boundary. It must be able to see its own text
      during that pass — the inner <span> therefore carries no
      `dir`.

      The trailing check / cross icons are Bootstrap-Icon font
      glyphs (private-use code points, bidi-neutral) and do not
      participate in auto-detection. Their position is determined by
      the row's flex layout and follows the row's direction, which
      places them on the correct visual side in each script.
    -->
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
        dir="auto"
      >
        <span>{{ cidx + 1 }}. {{ choice }}</span>
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
</script>