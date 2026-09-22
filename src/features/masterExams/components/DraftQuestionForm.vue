<template>
  <form class="master-exam-draft-form" @submit.prevent="$emit('submit')">
    <BaseField v-slot="{ id }" :label="t('masterExams.questionTextLabel')">
      <textarea
        :id="id"
        v-model="form.question"
        class="form-control"
        rows="3"
        maxlength="3000"
        required
      ></textarea>
    </BaseField>

    <div class="form-group">
      <label>{{ t('masterExams.choicesLabel') }}</label>
      <div
        v-for="(_choice, index) in form.choices"
        :key="index"
        class="d-flex align-center gap-1 mb-1"
      >
        <span class="master-exam-question-row__index draft-choice-index">
          {{ index + 1 }}
        </span>
        <input
          v-model="form.choices[index]"
          class="form-control"
          maxlength="300"
          :placeholder="t('masterExams.choiceN', { n: index + 1 })"
        />
        <button
          type="button"
          class="btn-icon text-danger"
          :disabled="form.choices.length <= 2"
          :aria-label="t('masterExams.removeChoiceAria')"
          @click="removeChoice(index)"
        >
          <i class="bi bi-x"></i>
        </button>
        <label class="d-flex align-center gap-1 draft-correct-label">
          <input
            v-model.number="form.correct_answer"
            type="radio"
            :name="correctAnswerName"
            :value="index + 1"
          />
          {{ t('masterExams.correctLabel') }}
        </label>
      </div>
      <BaseButton
        v-if="form.choices.length < maxChoices"
        type="button"
        variant="secondary"
        size="small"
        @click="form.choices.push('')"
      >
        <i class="bi bi-plus"></i> {{ t('masterExams.addChoice') }}
      </BaseButton>
    </div>

    <FormGrid>
      <BaseField v-slot="{ id }" :label="t('questions.explanationLabel')">
        <textarea :id="id" v-model="form.explanation" class="form-control" rows="2"></textarea>
      </BaseField>
      <BaseField v-slot="{ id }" :label="t('questions.sourceLabel')">
        <input :id="id" v-model="form.source" class="form-control" maxlength="200" />
      </BaseField>
    </FormGrid>

    <FormGrid>
      <BaseField v-slot="{ id }" :label="t('questions.difficultyLabel')">
        <select :id="id" v-model="form.difficulty" class="form-control">
          <option v-for="option in DIFFICULTY_OPTIONS" :key="option.value" :value="option.value">
            {{ t(option.labelKey) }}
          </option>
        </select>
      </BaseField>
      <BaseField v-slot="{ id }" :label="t('questions.categoryLabel')">
        <select :id="id" v-model="form.category" class="form-control">
          <option :value="null">{{ t('questions.noCategory') }}</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </BaseField>
    </FormGrid>

    <BaseField
      v-slot="{ id, describedBy }"
      :label="t('questions.caseKeyLabel')"
      :hint="t('questions.caseKeyHint')"
    >
      <input
        :id="id"
        v-model.trim="form.case_key"
        :aria-describedby="describedBy"
        class="form-control"
        :list="caseListId"
        maxlength="64"
        :placeholder="t('questions.caseKeyPlaceholder')"
      />
      <datalist :id="caseListId">
        <option v-for="item in cases" :key="item.key" :value="item.key">
          {{ item.title || item.key }}
        </option>
      </datalist>
    </BaseField>

    <div class="form-actions">
      <BaseButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" variant="primary" :loading="loading">
        {{ submitLabel }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup>
import BaseButton from '@/components/base/BaseButton.vue'
import BaseField from '@/components/base/BaseField.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import { DIFFICULTY_OPTIONS, FALLBACK_MAX_CHOICES } from '@/utils/constants'

const { t } = useI18n()

const form = defineModel({
  type: Object,
  default: () => ({
    question: '',
    choices: ['', ''],
    correct_answer: 1,
    explanation: '',
    source: '',
    difficulty: 'medium',
    category: null,
    case_key: '',
  }),
})

defineProps({
  categories: { type: Array, default: () => [] },
  cases: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  submitLabel: { type: String, required: true },
  caseListId: { type: String, default: 'draft-case-key-suggestions' },
  correctAnswerName: { type: String, default: 'draft-correct-answer' },
  maxChoices: { type: Number, default: FALLBACK_MAX_CHOICES },
})

defineEmits(['submit', 'cancel'])

function removeChoice(index) {
  if (form.value.choices.length <= 2) return
  form.value.choices.splice(index, 1)
  if (form.value.correct_answer > form.value.choices.length) {
    form.value.correct_answer = 1
  }
}
</script>
