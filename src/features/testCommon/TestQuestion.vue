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
        :question="question"
        :initial-answer="selectedAnswer"
        :initial-confidence="confidenceForCurrent"
        :show-reflection-prompt="showReflectionPrompt"
        @answer="handleAnswer"
        @confidence="handleConfidence"
        @reflection="handleReflection"
      />

      <ExplanationSection
        v-if="mode === 'study' && question.explanation && store.hasAnswer(store.currentIndex)"
        :explanation="question.explanation"
      />

      <TestNavigation
        :current="store.currentIndex"
        :total="store.totalQuestions"
        :loading="submitting"
        @previous="goPrevious"
        @next="goNext"
        @finish="finish"
      />

      <QuestionNavDots
        :total="store.totalQuestions"
        :current="store.currentIndex"
        :has-answer="store.hasAnswer"
        @go="goTo"
      />

      <ShortcutHint />
    </template>

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

const { t } = useI18n()

const props = defineProps({
  mode: { type: String, required: true },
  isPauseSupported: { type: Boolean, default: false },
})

const config = computed(() => MODES[props.mode] || MODES.exam)

const {
  store,
  question,
  selectedAnswer,
  startTime,
  swipeContainer,
  showReflectionPrompt,
  submitting,
  examTotalSeconds,
  isCritical,
  confidenceForCurrent,
  onTimerTick,
  handleAnswer,
  handleConfidence,
  handleReflection,
  goNext,
  goPrevious,
  goTo,
  pauseSession,
  finish,
} = useTestQuestionController(() => props.mode)
</script>
