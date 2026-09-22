<!-- frontend/src/features/testCommon/QuestionDisplay.vue -->
<template>
  <div>
    <CaseStemPanel v-if="question.case?.stem" :stem="question.case.stem" />

    <BaseCard
      class="question-card"
      :class="{ 'question-card--disabled': disabled }"
    >
      <div class="question-card__meta">
        <h4 class="question-card__text" dir="auto">
          <BaseMarkdown :text="question.text" />
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

      <!--
        The `disabled` prop disables both the answer radios and the
        confidence checkbox below. It is set by the master-exam runner
        while an answer is being saved, so a rapid second click cannot
        stack a second write on top of the first. The store-level dedup
        in `masterExamAttemptStore.js` already makes the second call a
        no-op at the network layer; the disabled binding is the visible
        half of that contract.

        Callers that do not pass the prop get the default `false` and
        the component behaves exactly as before.
      -->
      <div class="question-card__choices">
        <div
          v-for="(choice, idx) in question.choices"
          :key="idx"
          class="question-card__choice"
          :class="{ 'question-card__choice--selected': selectedAnswer === idx + 1 }"
        >
          <label>
            <input
              type="radio"
              :value="idx + 1"
              v-model="selectedAnswer"
              :disabled="disabled"
              @change="onUserSelect(idx + 1)"
            />
            <span
              ><strong>{{ idx + 1 }}.</strong> {{ choice }}</span
            >
          </label>
        </div>
      </div>

      <div v-if="selectedAnswer" class="confidence-row">
        <label class="confidence-toggle">
          <input
            type="checkbox"
            v-model="isConfident"
            :disabled="disabled"
            @change="onConfidenceChange"
          />
          <span class="confidence-toggle__label">
            <i :class="isConfident ? 'bi bi-emoji-smile' : 'bi bi-emoji-frown'"></i>
            {{ isConfident ? t('tests.confidence') : t('tests.notConfident') }}
          </span>
        </label>
        <span v-if="showConfidenceHint" class="confidence-hint">
          <i class="bi bi-info-circle"></i>
          {{ t('tests.confidenceHint') }}
        </span>
      </div>

      <div v-if="showReflectionPrompt && !pickedReason" class="reflection-prompt">
        <div class="reflection-prompt__header">
          <i class="bi bi-question-circle"></i>
          <strong>{{ t('tests.reflectionTitle') }}</strong>
          <span class="reflection-prompt__hint">{{ t('tests.reflectionHint') }}</span>
        </div>
        <div class="reflection-prompt__buttons">
          <button type="button" class="reflection-prompt__btn" @click="pickReason('unknown')">
            <i class="bi bi-x-octagon"></i>
            {{ t('tests.reflectionUnknown') }}
          </button>
          <button type="button" class="reflection-prompt__btn" @click="pickReason('misread')">
            <i class="bi bi-eye-slash"></i>
            {{ t('tests.reflectionMisread') }}
          </button>
          <button type="button" class="reflection-prompt__btn" @click="pickReason('confused')">
            <i class="bi bi-signpost-split"></i>
            {{ t('tests.reflectionConfused') }}
          </button>
          <button type="button" class="reflection-prompt__btn" @click="pickReason('guessed')">
            <i class="bi bi-dice-5"></i>
            {{ t('tests.reflectionGuessed') }}
          </button>
        </div>
      </div>
      <div v-else-if="pickedReason" class="reflection-prompt reflection-prompt--done">
        <i class="bi bi-check-circle-fill"></i>
        <span>{{ t('tests.reflectionThanks') }}</span>
      </div>

      <slot name="feedback"></slot>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseMarkdown from '@/components/markdown/BaseMarkdown.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseCard from '@/components/base/BaseCard.vue'

const { t } = useI18n()

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Number, default: null },
  initialConfidence: { type: Boolean, default: true },
  showVerification: { type: Boolean, default: true },
  showConfidenceHint: { type: Boolean, default: true },
  showReflectionPrompt: { type: Boolean, default: false },
  // When true, the answer radios and the confidence checkbox are
  // disabled. The master-exam runner binds this to the store's
  // in-flight answer flag so a second click cannot land while the
  // first is being saved. Defaults to false so every existing caller
  // (TestQuestion.vue, ExamStudy components) renders exactly as
  // before without any change on their side.
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['answer', 'confidence', 'reflection'])

const selectedAnswer = ref(props.initialAnswer)
const isConfident = ref(props.initialConfidence === undefined ? true : props.initialConfidence)
const pickedReason = ref(null)

watch(
  () => props.question?.id,
  () => {
    selectedAnswer.value = props.initialAnswer
    isConfident.value = props.initialConfidence === undefined ? true : props.initialConfidence
    pickedReason.value = null
  },
)

watch(
  () => props.initialAnswer,
  (val) => {
    selectedAnswer.value = val
    pickedReason.value = null
  },
)

watch(
  () => props.initialConfidence,
  (val) => {
    isConfident.value = val === undefined ? true : val
  },
)

function onUserSelect(val) {
  emit('answer', val)
}

function onConfidenceChange() {
  emit('confidence', isConfident.value)
}

function pickReason(reason) {
  pickedReason.value = reason
  emit('reflection', reason)
}
</script>
