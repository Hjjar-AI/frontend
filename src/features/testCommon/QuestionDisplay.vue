<!-- frontend/src/features/testCommon/QuestionDisplay.vue -->
<template>
  <div>
    <CaseStemPanel v-if="question.case?.stem" :stem="question.case.stem" />

    <BaseCard
      class="question-card"
      :class="{ 'question-card--disabled': disabled }"
    >
      <div class="question-display__header">
        <h4 class="question-display__text">
          <BaseMarkdown :text="displayQuestion.text" />
        </h4>
        <template v-if="showVerification">
          <BaseBadge
            v-if="question.verified"
            variant="success"
            status
            :title="`${t('questions.verified')} — ${question.verified_by || ''}`"
          >
            <i class="bi bi-patch-check-fill"></i> {{ t('questions.verified') }}
          </BaseBadge>
          <BaseBadge v-else variant="warning" status :title="t('questions.unverified')">
            <i class="bi bi-patch-check"></i> {{ t('questions.unverified') }}
          </BaseBadge>
        </template>
      </div>

      <img
        v-if="question.image_url"
        :src="question.image_url"
        :alt="t('tests.questionImageAlt')"
        class="question-image"
        loading="lazy"
      />

      <div
        v-if="answerBeforeOptions && !choicesRevealed"
        class="recall-prompt"
      >
        <label class="recall-prompt__label" for="recall-pre-answer">
          {{ t('tests.recallPrompt') }}
        </label>
        <textarea
          id="recall-pre-answer"
          v-model="preAnswer"
          class="form-control recall-prompt__input"
          rows="3"
          maxlength="1000"
          :disabled="disabled"
          :placeholder="t('tests.recallPlaceholder')"
          @keydown.ctrl.enter.prevent="revealChoices"
        ></textarea>
        <button
          type="button"
          class="btn btn-primary recall-prompt__reveal"
          :disabled="disabled || !preAnswer.trim()"
          @click="revealChoices"
        >
          <i class="bi bi-eye"></i> {{ t('tests.revealOptions') }}
        </button>
        <small class="text-muted">{{ t('tests.recallPrivacyHint') }}</small>
      </div>

      <div v-if="!answerBeforeOptions || choicesRevealed" class="question-card__choices">
        <div
          v-for="(choice, idx) in displayQuestion.choices"
          :key="idx"
          class="question-card__choice"
          :class="{ 'question-card__choice--selected': selectedAnswer === idx + 1 }"
        >
          <label>
            <input
              v-model="selectedAnswer"
              type="radio"
              :value="idx + 1"
              :disabled="disabled || showReflectionPrompt || lockAnswerChoices"
              @change="onUserSelect(idx + 1)"
            />
            <span class="question-card__choice-text" dir="auto">
              <strong>{{ idx + 1 }}.</strong> {{ choice }}
            </span>
          </label>
        </div>
      </div>

      <div v-if="selectedAnswer" class="confidence-row confidence-score">
        <span class="confidence-score__label">{{ t('tests.confidencePrompt') }}</span>
        <div class="confidence-score__options" role="radiogroup">
          <label
            v-for="option in confidenceOptions"
            :key="option.value"
            class="confidence-score__option"
            :class="{ 'confidence-score__option--active': confidenceScore === option.value }"
          >
          <input
            v-model.number="confidenceScore"
            type="radio"
            :value="option.value"
            :disabled="disabled"
            @change="onConfidenceChange"
          />
          <span>
            <i :class="option.icon"></i> {{ t(option.labelKey) }}
          </span>
          </label>
        </div>
        <span v-if="showConfidenceHint" class="confidence-hint">
          <i class="bi bi-info-circle"></i>
          {{ t('tests.confidenceHint') }}
        </span>
      </div>

      <div v-if="showReflectionPrompt" class="reflection-prompt">
        <div class="reflection-prompt__header">
          <i class="bi bi-question-circle"></i>
          <strong>{{ t('tests.reflectionTitle') }}</strong>
          <span class="reflection-prompt__hint">{{ t('tests.reflectionHint') }}</span>
        </div>
        <div class="reflection-prompt__buttons">
          <button type="button" class="reflection-prompt__btn" :disabled="disabled" @click="pickReason('unknown')">
            <i class="bi bi-x-octagon"></i>
            {{ t('tests.reflectionUnknown') }}
          </button>
          <button type="button" class="reflection-prompt__btn" :disabled="disabled" @click="pickReason('misread')">
            <i class="bi bi-eye-slash"></i>
            {{ t('tests.reflectionMisread') }}
          </button>
          <button type="button" class="reflection-prompt__btn" :disabled="disabled" @click="pickReason('confused')">
            <i class="bi bi-signpost-split"></i>
            {{ t('tests.reflectionConfused') }}
          </button>
          <button type="button" class="reflection-prompt__btn" :disabled="disabled" @click="pickReason('guessed')">
            <i class="bi bi-dice-5"></i>
            {{ t('tests.reflectionGuessed') }}
          </button>
        </div>
      </div>
      <slot name="feedback"></slot>
    </BaseCard>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseMarkdown from '@/components/markdown/BaseMarkdown.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { localizedQuestion } from '@/utils/localizedQuestion'
import { normalizeConfidenceScore } from '@/utils/confidence'

const { t, locale } = useI18n()

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Number, default: null },
  initialConfidence: { type: [Number, Boolean], default: null },
  answerBeforeOptions: { type: Boolean, default: false },
  initialPreAnswer: { type: String, default: '' },
  choicesRevealed: { type: Boolean, default: true },
  showVerification: { type: Boolean, default: true },
  showConfidenceHint: { type: Boolean, default: true },
  showReflectionPrompt: { type: Boolean, default: false },
  lockAnswerChoices: { type: Boolean, default: false },
  // When true, the answer radios and the confidence checkbox are
  // disabled. The master-exam runner binds this to the store's
  // in-flight answer flag so a second click cannot land while the
  // first is being saved. Defaults to false so every existing caller
  // (TestQuestion.vue, ExamStudy components) renders exactly as
  // before without any change on their side.
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['answer', 'confidence', 'reflection', 'reveal'])

const selectedAnswer = ref(props.initialAnswer)
const confidenceScore = ref(normalizeConfidenceScore(props.initialConfidence, null))
const preAnswer = ref(props.initialPreAnswer || '')
const displayQuestion = computed(() => localizedQuestion(props.question, locale.value))
const confidenceOptions = [
  { value: 1, icon: 'bi bi-dice-5', labelKey: 'tests.confidenceGuessing' },
  { value: 2, icon: 'bi bi-question-circle', labelKey: 'tests.confidenceUncertain' },
  { value: 3, icon: 'bi bi-emoji-smile', labelKey: 'tests.confidenceCertain' },
]

watch(
  () => props.question?.id,
  () => {
    selectedAnswer.value = props.initialAnswer
    confidenceScore.value = normalizeConfidenceScore(props.initialConfidence, null)
    preAnswer.value = props.initialPreAnswer || ''
  },
)

watch(
  () => props.initialAnswer,
  (val) => {
    selectedAnswer.value = val
  },
)

watch(
  () => props.initialConfidence,
  (val) => {
    confidenceScore.value = normalizeConfidenceScore(val, null)
  },
)

watch(
  () => props.initialPreAnswer,
  (val) => {
    preAnswer.value = val || ''
  },
)

function onUserSelect(val) {
  emit('answer', val)
}

function onConfidenceChange() {
  emit('confidence', confidenceScore.value)
}

function revealChoices() {
  const clean = preAnswer.value.trim()
  if (clean) emit('reveal', clean)
}

function pickReason(reason) {
  emit('reflection', reason)
}
</script>
