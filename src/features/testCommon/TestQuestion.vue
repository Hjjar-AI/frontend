<!-- frontend/src/features/testCommon/TestQuestion.vue -->
<template>
  <div ref="swipeContainer" class="test-question" :class="{ 'test-question--critical': isCritical }">
    <div class="top-bar">
      <Timer
        v-if="config.showTime"
        :start-time="startTime"
        :total-seconds="examTotalSeconds"
        :overtime="config.overtime || false"
        @tick="onTimerTick"
      />
      <button
        v-if="isPauseSupported && store.isActive"
        type="button"
        class="btn-icon pause-btn"
        :disabled="navigationDisabled"
        @click="pauseSession"
        :aria-label="t('tests.pauseAria')"
        :title="t('tests.pause')"
      >
        <i class="bi bi-pause-circle"></i>
      </button>
      <ProgressBar
        :progress="store.progress"
        :label="`${store.currentIndex + 1}/${store.totalQuestions}`"
      />
    </div>

    <template v-if="question">
      <QuestionDisplay
        :question="displayQuestion"
        :initial-answer="selectedAnswer"
        :initial-confidence="confidence"
        :answer-before-options="mode === 'recall'"
        :initial-pre-answer="preAnswer"
        :choices-revealed="choicesRevealed"
        :lock-answer-choices="(mode === 'study' || mode === 'recall') && store.hasAnswer(store.currentIndex)"
        :disabled="answerControlsBusy"
        :show-reflection-prompt="showReflectionPrompt"
        @answer="handleAnswer"
        @confidence="handleConfidence"
        @reveal="handleReveal"
        @reflection="handleReflection"
      />

      <ExplanationSection
        v-if="(mode === 'study' || mode === 'recall') && displayQuestion.explanation && store.hasAnswer(store.currentIndex)"
        :explanation="displayQuestion.explanation"
      />

      <TestNavigation
        :current="store.currentIndex"
        :total="store.totalQuestions"
        :loading="submitting"
        :disabled="navigationDisabled"
        @previous="goPrevious"
        @next="goNext"
        @finish="finish"
      />

      <QuestionNavDots
        :total="store.totalQuestions"
        :current="store.currentIndex"
        :has-answer="store.hasAnswer"
        :disabled="navigationDisabled"
        @go="goTo"
      />

      <ShortcutHint />
    </template>

    <div v-else-if="questionLoadFailed" class="test-question__loading">
      <p>{{ t('notifications.questionLoadFailed') }}</p>
      <button type="button" class="btn btn-primary" @click="retryLoadQuestion">
        {{ t('common.retry') }}
      </button>
    </div>

    <div v-else class="test-question__loading">
      <BaseSkeleton height="400px" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Timer from '@/components/common/Timer.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import QuestionDisplay from './QuestionDisplay.vue'
import TestNavigation from './TestNavigation.vue'
import ExplanationSection from './ExplanationSection.vue'
import QuestionNavDots from '@/components/base/QuestionNavDots.vue'
import ShortcutHint from '@/components/common/ShortcutHint.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import { useTestQuestionController } from './composables/useTestQuestionController'
import { MODES } from './modes'
import { localizedQuestion } from '@/utils/localizedQuestion'

const { t, locale } = useI18n()

const props = defineProps({
  mode: { type: String, required: true },
  isPauseSupported: { type: Boolean, default: false },
})

const config = computed(() => MODES[props.mode] || MODES.exam)

const {
  store,
  question,
  selectedAnswer,
  confidence,
  startTime,
  swipeContainer,
  showReflectionPrompt,
  questionLoadFailed,
  submitting,
  navigationDisabled,
  answerControlsBusy,
  examTotalSeconds,
  isCritical,
  preAnswer,
  choicesRevealed,
  onTimerTick,
  retryLoadQuestion,
  handleAnswer,
  handleConfidence,
  handleReveal,
  handleReflection,
  goNext,
  goPrevious,
  goTo,
  pauseSession,
  finish,
} = useTestQuestionController(() => props.mode)

const displayQuestion = computed(() => localizedQuestion(question.value, locale.value))
</script>
