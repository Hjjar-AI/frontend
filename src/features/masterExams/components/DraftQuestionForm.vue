<template>
  <form class="master-exam-draft-form" @submit.prevent="$emit('submit')">
    <BaseTextarea
      v-model="form.question"
      :label="t('masterExams.questionTextLabel')"
      :rows="3"
      :maxlength="3000"
      required
    />

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
        <BaseInput
          v-model="form.choices[index]"
          :maxlength="300"
          show-count
          :placeholder="t('masterExams.choiceN', { n: index + 1 })"
        />
        <BaseIconButton
          variant="danger"
          size="small"
          icon="bi bi-x"
          :disabled="form.choices.length <= 2"
          :label="t('masterExams.removeChoiceAria')"
          @click="removeChoice(index)"
        />
        <BaseRadio
          v-model="form.correct_answer"
          :name="correctAnswerName"
          :value="index + 1"
          :label="t('masterExams.correctLabel')"
        />
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
      <BaseTextarea
        v-model="form.explanation"
        :label="t('questions.explanationLabel')"
        :rows="2"
        :maxlength="3000"
      />
      <BaseInput
        v-model="form.source"
        :label="t('questions.sourceLabel')"
        :maxlength="200"
        show-count
      />
    </FormGrid>

    <FormGrid>
      <BaseSelect
        v-model="form.difficulty"
        :label="t('questions.difficultyLabel')"
        :options="difficultyOptions"
      />
      <BaseSelect
        v-model="form.category"
        :label="t('questions.categoryLabel')"
        :options="categoryOptions"
        :placeholder="t('questions.noCategory')"
      />
    </FormGrid>

    <div>
      <BaseInput
        :model-value="form.case_key"
        :label="t('questions.caseKeyLabel')"
        :hint="t('questions.caseKeyHint')"
        :list="caseListId"
        :maxlength="64"
        :placeholder="t('questions.caseKeyPlaceholder')"
        @update:model-value="form.case_key = $event.trim()"
      />
      <datalist :id="caseListId">
        <option v-for="item in cases" :key="item.key" :value="item.key">
          {{ item.title || item.key }}
        </option>
      </datalist>
    </div>

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
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseRadio from '@/components/base/BaseRadio.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
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

const props = defineProps({
  categories: { type: Array, default: () => [] },
  cases: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  submitLabel: { type: String, required: true },
  caseListId: { type: String, default: 'draft-case-key-suggestions' },
  correctAnswerName: { type: String, default: 'draft-correct-answer' },
  maxChoices: { type: Number, default: FALLBACK_MAX_CHOICES },
})

const difficultyOptions = computed(() => DIFFICULTY_OPTIONS.map(option => ({
  value: option.value,
  label: t(option.labelKey),
})))
const categoryOptions = computed(() => props.categories.map(category => ({
  value: category.id,
  label: category.name,
})))

defineEmits(['submit', 'cancel'])

function removeChoice(index) {
  if (form.value.choices.length <= 2) return
  form.value.choices.splice(index, 1)
  if (form.value.correct_answer > form.value.choices.length) {
    form.value.correct_answer = 1
  }
}
</script>
