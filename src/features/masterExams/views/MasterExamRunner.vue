<!-- frontend/src/features/masterExams/views/MasterExamRunner.vue -->
<template>
  <Layout>
    <div class="master-exam-runner">
      <div v-if="attemptStore.isPreview" class="master-exam-runner__preview-banner">
        <i class="bi bi-eye"></i>
        <span>{{ t('masterExams.runnerPreview') }}</span>
      </div>

      <div v-if="attemptStore.isMakeup" class="master-exam-runner__makeup-banner">
        <i class="bi bi-arrow-repeat"></i>
        <span>{{ t('masterExams.runnerMakeup') }}</span>
      </div>

      <div class="master-exam-runner__header">
        <div class="master-exam-runner__exam-name">{{ attemptStore.examName }}</div>
        <div v-if="attemptStore.deadlineAt" class="master-exam-runner__timer" :class="timerClass">
          <i class="bi bi-stopwatch"></i>
          <span>{{ timerDisplay }}</span>
        </div>
        <BaseButton
          v-if="!attemptStore.isPreview && attemptStore.currentQuestionId"
          variant="secondary"
          size="small"
          @click="handleFlag"
        >
          <i class="bi bi-flag"></i> {{ t('masterExams.runnerFlag') }}
        </BaseButton>
        <BaseButton variant="primary" size="small" @click="attemptFinish">
          <i class="bi bi-check-lg"></i> {{ t('masterExams.runnerFinish') }}
        </BaseButton>
      </div>

      <BaseModal
        :is-open="showPreStart"
        :title="t('masterExams.runnerPreStartTitle')"
        size="md"
        :dismissable="false"
        static-backdrop
      >
        <div class="master-exam-prestart">
          <div class="master-exam-prestart__meta-grid">
            <div class="master-exam-prestart__meta-item">
              <span class="master-exam-prestart__meta-value">{{
                attemptStore.totalQuestions
              }}</span>
              <span class="master-exam-prestart__meta-label">{{
                t('masterExams.runnerPreStartQuestions')
              }}</span>
            </div>
            <div class="master-exam-prestart__meta-item">
              <span class="master-exam-prestart__meta-value">{{
                attemptStore.durationMinutes
              }}</span>
              <span class="master-exam-prestart__meta-label">{{
                t('masterExams.runnerPreStartMinutes')
              }}</span>
            </div>
          </div>

          <div v-if="attemptStore.examInstructions" class="master-exam-prestart__instructions">
            <h4>
              <i class="bi bi-info-circle"></i> {{ t('masterExams.runnerPreStartInstructions') }}
            </h4>
            <p>{{ attemptStore.examInstructions }}</p>
          </div>

          <div class="master-exam-prestart__warning">
            <i class="bi bi-exclamation-triangle"></i>
            <div>
              <strong>{{ t('masterExams.runnerPreStartWarningTitle') }}</strong>
              <ul>
                <li>{{ t('masterExams.runnerPreStartWarning1') }}</li>
                <li>{{ t('masterExams.runnerPreStartWarning2') }}</li>
                <li>
                  {{
                    t('masterExams.runnerPreStartWarning3', {
                      minutes: attemptStore.durationMinutes,
                    })
                  }}
                </li>
                <li>{{ t('masterExams.runnerPreStartWarning4') }}</li>
              </ul>
            </div>
          </div>
        </div>
        <template #footer>
          <BaseButton variant="secondary" @click="exitAttempt">{{ t('common.cancel') }}</BaseButton>
          <BaseButton variant="primary" @click="beginCountdown">
            <i class="bi bi-play-circle"></i> {{ t('masterExams.runnerPreStartBegin') }}
          </BaseButton>
        </template>
      </BaseModal>

      <BaseModal
        :is-open="preCountdownActive"
        :title="t('masterExams.runnerCountdownTitle')"
        size="sm"
        :dismissable="false"
        static-backdrop
      >
        <div class="master-exam-prestart-countdown">
          <div class="master-exam-prestart-countdown__number">{{ preCountdownValue }}</div>
          <p class="master-exam-prestart-countdown__text">
            {{ t('masterExams.runnerCountdownHint') }}
          </p>
        </div>
        <template #footer>
          <BaseButton variant="secondary" @click="cancelCountdown">{{
            t('common.cancel')
          }}</BaseButton>
        </template>
      </BaseModal>

      <div
        v-if="attemptStore.inGraceWindow && !attemptStore.isComplete"
        class="master-exam-runner__grace-overlay"
        aria-live="assertive"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle"></i>
        <h2>{{ t('masterExams.runnerGraceTitle') }}</h2>
        <p>{{ t('masterExams.runnerGraceBody') }}</p>
        <div class="master-exam-runner__grace-countdown">
          {{ graceDisplay }}
        </div>
      </div>

      <div v-if="attemptStore.currentQuestion && !showPreStart">
        <div class="d-flex justify-between align-center flex-wrap gap-2 mb-2">
          <span class="text-muted master-exam-runner__progress">
            {{
              t('masterExams.runnerQuestionProgress', {
                current: currentIndex + 1,
                total: attemptStore.totalQuestions,
              })
            }}
          </span>
        </div>

        <!--
          The answer controls are disabled while `answerSubmitting` is
          true. `attemptStore.submitAnswer` has its own in-flight
          dedup guard (see the module-level `_pendingAnswers` map in
          masterExamAttemptStore.js), so a second click while a
          request is in flight is a no-op at the network layer. The
          disabled binding below adds the visible half of that
          contract: the radio group dims and stops accepting input
          until the response lands, so a rapid keyboard `1`-`2` on
          the same question cannot stack two saves.

          `answerSubmitting` reads `attemptStore.isAnswerLoading`,
          which is generated from the `answerStatus` sub-resource by
          `subResourceGetters('answer')` in storeHelpers.js.
        -->
        <QuestionDisplay
          :question="attemptStore.currentQuestion"
          :initial-answer="currentSavedAnswer"
          :initial-confidence="currentConfidence"
          :show-verification="false"
          :show-confidence-hint="false"
          :disabled="answerSubmitting"
          @answer="onSelectAnswer"
          @confidence="onConfidenceChange"
        >
          <template #feedback>
            <div
              v-if="attemptStore.isPreview && attemptStore.previewFeedback"
              class="preview-feedback"
              :class="
                attemptStore.previewFeedback.isCorrect
                  ? 'preview-feedback--correct'
                  : 'preview-feedback--wrong'
              "
            >
              <div class="preview-feedback__headline">
                <i
                  :class="
                    attemptStore.previewFeedback.isCorrect
                      ? 'bi bi-check-circle-fill'
                      : 'bi bi-x-circle-fill'
                  "
                ></i>
                <span v-if="attemptStore.previewFeedback.isCorrect">
                  {{ t('masterExams.runnerPreviewCorrect') }}
                </span>
                <span v-else>
                  {{
                    t('masterExams.runnerPreviewWrong', {
                      n: attemptStore.previewFeedback.correctAnswer,
                    })
                  }}
                </span>
              </div>
              <div
                v-if="attemptStore.previewFeedback.explanation"
                class="preview-feedback__explanation"
              >
                <strong>
                  <i class="bi bi-lightbulb"></i>
                  {{ t('tests.reviewExplanation') }}
                </strong>
                <BaseMarkdown :text="attemptStore.previewFeedback.explanation" />
              </div>
            </div>
          </template>
        </QuestionDisplay>
      </div>

      <QuestionNavDots
        v-if="!showPreStart"
        :total="attemptStore.totalQuestions"
        :current="currentIndex"
        :has-answer="hasAnswerAtIndex"
        @go="gotoIndex"
      />

      <div class="d-flex justify-center gap-2 mt-3">
        <BaseButton variant="secondary" :disabled="currentIndex <= 0" @click="gotoPrevious">
          <DirectionalIcon ltr="bi bi-chevron-left" rtl="bi bi-chevron-right" />
          {{ t('tests.previous') }}
        </BaseButton>
        <BaseButton
          v-if="currentIndex < attemptStore.totalQuestions - 1"
          variant="primary"
          @click="gotoNext"
        >
          {{ t('tests.next') }}
          <DirectionalIcon ltr="bi bi-chevron-right" rtl="bi bi-chevron-left" />
        </BaseButton>
        <BaseButton v-else variant="success" @click="attemptFinish">
          <i class="bi bi-check-lg"></i> {{ t('masterExams.runnerFinish') }}
        </BaseButton>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import '@/assets/master.css'
import Layout from '@/components/common/Layout.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseMarkdown from '@/components/markdown/BaseMarkdown.vue'
import QuestionNavDots from '@/components/base/QuestionNavDots.vue'
import QuestionDisplay from '@/features/testCommon/QuestionDisplay.vue'
import { useMasterExamRunner } from '../composables/useMasterExamRunner'

const {
  t,
  attemptStore,
  showPreStart,
  preCountdownActive,
  preCountdownValue,
  currentIndex,
  answerSubmitting,
  currentSavedAnswer,
  currentConfidence,
  timerDisplay,
  graceDisplay,
  timerClass,
  beginCountdown,
  cancelCountdown,
  exitAttempt,
  onSelectAnswer,
  onConfidenceChange,
  gotoIndex,
  gotoPrevious,
  gotoNext,
  hasAnswerAtIndex,
  handleFlag,
  attemptFinish,
} = useMasterExamRunner()
</script>
