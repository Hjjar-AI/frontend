<!-- frontend/src/features/questions/components/QuestionForm.vue -->
<template>
  <BaseCard class="question-form-card">
    <Transition name="splash">
      <div v-if="showSplash" class="question-form__splash">
        <i class="bi bi-check-circle-fill"></i>
      </div>
    </Transition>

    <form class="question-form__form" @submit.prevent="submitWithGuard">
      <!--
        Case section (feature: case-based question chains).

        The `case_key` field is a plain string input backed by a
        native <datalist>. Existing keys autocomplete; a new key
        creates the case on save. Clearing the field detaches the
        question from whatever case it was in.
      -->
      <details class="question-form__case-section">
        <summary class="question-form__case-summary">
          <i class="bi bi-journal-medical"></i>
          <span>{{ t('questions.caseSection') }}</span>
          <span v-if="form.case_key" class="question-form__case-badge">{{ form.case_key }}</span>
        </summary>
        <FormGrid>
          <div>
            <BaseInput
              v-model.trim="form.case_key"
              :label="t('questions.caseKeyLabel')"
              :hint="t('questions.caseKeyHint')"
              list="case-key-suggestions"
              :maxlength="64"
              :placeholder="t('questions.caseKeyPlaceholder')"
            />
            <datalist id="case-key-suggestions">
              <option v-for="c in availableCases" :key="c.key" :value="c.key">
                {{ c.title || c.key }}
              </option>
            </datalist>
          </div>
        </FormGrid>
        <MarkdownEditor
          id="q-case-stem"
          v-model="form.case_stem"
          :label="t('questions.caseStemLabel')"
          :maxlength="3000"
          :rows="5"
        />
        <p
          v-if="form.case_key"
          class="text-muted question-form__case-hint"
        >
          <i class="bi bi-info-circle"></i>
          {{ t('questions.caseStemHint') }}
        </p>
      </details>

      <MarkdownEditor
        id="q-question"
        v-model="form.question"
        :label="t('questions.questionLabel')"
        :maxlength="3000"
        required
      />

      <details class="question-form__case-section">
        <summary class="question-form__case-summary">
          <i class="bi bi-bullseye"></i>
          <span>{{ t('questions.knowledgeObjectSection') }}</span>
          <span v-if="selectedKnowledgeObject" class="question-form__case-badge">
            {{ selectedKnowledgeObject.title }}
          </span>
        </summary>
        <p class="text-muted question-form__case-hint">
          {{ t('questions.knowledgeObjectHint') }}
        </p>
        <FormGrid>
          <BaseSelect
            v-model="form.knowledge_object"
            :label="t('questions.knowledgeObjectLabel')"
            :options="knowledgeObjectOptions"
            :placeholder="t('questions.noKnowledgeObject')"
          />
          <div class="form-group question-form__knowledge-action">
            <BaseButton
              type="button"
              variant="secondary"
              @click="showKnowledgeCreator = !showKnowledgeCreator"
            >
              <i :class="showKnowledgeCreator ? 'bi bi-dash-lg' : 'bi bi-plus-lg'"></i>
              {{
                showKnowledgeCreator
                  ? t('questions.knowledgeObjectCancelCreate')
                  : t('questions.knowledgeObjectCreate')
              }}
            </BaseButton>
          </div>
        </FormGrid>

        <div v-if="showKnowledgeCreator" class="question-form__knowledge-creator">
          <FormGrid>
            <BaseInput
              v-model.trim="knowledgeDraft.title"
              :label="t('questions.knowledgeObjectTitle')"
              :maxlength="200"
              show-count
              :placeholder="t('questions.knowledgeObjectTitlePlaceholder')"
            />
            <BaseTextarea
              v-model.trim="knowledgeDraft.learning_objective"
              :label="t('questions.knowledgeObjectObjective')"
              :rows="3"
              :maxlength="3000"
              :placeholder="t('questions.knowledgeObjectObjectivePlaceholder')"
            />
          </FormGrid>
          <BaseTextarea
            v-model.trim="knowledgeDraft.canonical_answer"
            :label="t('questions.knowledgeObjectAnswer')"
            :rows="3"
            :maxlength="3000"
            :placeholder="t('questions.knowledgeObjectAnswerPlaceholder')"
          />
          <BaseTextarea
            v-model="knowledgeDraft.key_facts"
            :label="t('questions.knowledgeObjectFacts')"
            :hint="t('questions.knowledgeObjectFactsHint')"
            :rows="3"
            :placeholder="t('questions.knowledgeObjectFactsPlaceholder')"
          />
          <BaseButton
            type="button"
            variant="primary"
            :loading="creatingKnowledgeObject"
            @click="createKnowledgeObject"
          >
            <i class="bi bi-check-lg"></i>
            {{ t('questions.knowledgeObjectCreateAndSelect') }}
          </BaseButton>
        </div>
      </details>

      <div class="form-group">
        <label>{{ t('questions.imageSection') }}</label>
        <div
          v-if="!imagePreview"
          class="image-dropzone"
          :class="{ 'image-dropzone--dragging': isDraggingImage }"
          @dragenter.prevent="isDraggingImage = true"
          @dragleave.prevent="isDraggingImage = false"
          @dragover.prevent
          @drop.prevent="handleImageDrop"
        >
          <input
            type="file"
            class="image-dropzone__input"
            accept=".jpg,.jpeg,.png,.gif,.webp"
            @change="handleImagePick"
          />
          <div class="image-dropzone__icon"><i class="bi bi-image"></i></div>
          <p class="image-dropzone__text">{{ t('questions.imageDropHint') }}</p>
          <small class="image-dropzone__hint">{{ t('questions.imageTypeHint') }}</small>
        </div>
        <div v-else class="image-preview">
          <img :src="imagePreview" :alt="t('questions.imagePreviewAlt')" />
          <BaseIconButton
            type="button"
            class="image-preview__remove"
            icon="bi bi-x-lg"
            variant="danger"
            :label="t('questions.imageRemove')"
            @click="clearImage"
          />
          <div class="image-preview__status">
            <i class="bi bi-info-circle"></i>
            {{ imageUploadStatus }}
          </div>
        </div>
      </div>

      <FormGrid>
        <CategorySelect v-model="form.category_id" />
        <div class="form-group">
          <label>{{ t('questions.difficultyLabel') }}</label>
          <DifficultySelector v-model="form.difficulty" />
        </div>
        <TagInput v-model="form.tags" />
      </FormGrid>

      <div class="question-form__choices">
        <h4>{{ t('questions.choicesLabel') }}</h4>
        <ChoiceEditor v-model="form.choices" v-model:correct-answer="form.correct_answer" />
      </div>

      <MarkdownEditor
        id="q-explanation"
        v-model="form.explanation"
        :label="t('questions.explanationLabel')"
        :maxlength="3000"
      />

      <details class="question-form__case-section">
        <summary class="question-form__case-summary">
          <i class="bi bi-book"></i>
          <span>{{ t('questions.provenanceSection') }}</span>
        </summary>
        <FormGrid>
          <BaseInput
            id="q-source"
            v-model="form.source"
            :label="t('questions.sourceLabel')"
            :hint="t('questions.sourcePlaceholder')"
            :maxlength="200"
            show-count
          />
          <BaseInput
            id="q-source-document"
            v-model="form.source_document"
            :label="t('questions.sourceDocumentLabel')"
            :hint="t('questions.sourceDocumentHint')"
            :maxlength="500"
            show-count
            :placeholder="t('questions.sourceDocumentPlaceholder')"
          />
          <BaseInput
            id="q-source-page"
            v-model="form.source_page"
            type="number"
            :label="t('questions.sourcePageLabel')"
            :min="1"
            :step="1"
            :placeholder="t('questions.sourcePagePlaceholder')"
          />
          <BaseInput
            id="q-last-revised"
            v-model="form.last_revised_at"
            type="date"
            :label="t('questions.lastRevisedLabel')"
            :hint="t('questions.lastRevisedHint')"
          />
        </FormGrid>
      </details>

      <details class="question-form__case-section">
        <summary class="question-form__case-summary">
          <i class="bi bi-translate"></i>
          <span>{{ t('questions.translationsSection') }}</span>
          <span v-if="translationCount" class="question-form__case-badge">
            {{ translationCount }}
          </span>
        </summary>
        <p class="text-muted question-form__case-hint">
          {{ t('questions.translationsHint') }}
        </p>
        <div class="question-form__translation-add">
          <BaseInput
            v-model.trim="translationLocale"
            :label="t('questions.translationLocaleLabel')"
            :maxlength="6"
            show-count
            :placeholder="t('questions.translationLocalePlaceholder')"
            @enter="addTranslation"
          />
          <BaseButton type="button" variant="secondary" @click="addTranslation">
            <i class="bi bi-plus-lg"></i> {{ t('questions.translationAdd') }}
          </BaseButton>
        </div>

        <section
          v-for="(translation, locale) in form.translations"
          :key="locale"
          class="question-form__translation"
        >
          <header class="question-form__translation-header">
            <strong>{{ locale }}</strong>
            <BaseButton
              type="button"
              variant="danger"
              size="small"
              @click="removeTranslation(locale)"
            >
              <i class="bi bi-trash"></i> {{ t('common.delete') }}
            </BaseButton>
          </header>
          <MarkdownEditor
            :id="`q-translation-${locale}-question`"
            v-model="translation.question"
            :label="t('questions.translationQuestionLabel')"
            :maxlength="3000"
          />
          <div class="question-form__translation-choices">
            <BaseInput
              v-for="(_, index) in form.choices"
              :key="`${locale}-${index}`"
              v-model="translation.choices[index]"
              :label="t('questions.choiceN', { n: index + 1 })"
              :maxlength="1000"
              show-count
            />
          </div>
          <MarkdownEditor
            :id="`q-translation-${locale}-explanation`"
            v-model="translation.explanation"
            :label="t('questions.translationExplanationLabel')"
            :maxlength="3000"
          />
        </section>
      </details>

      <div v-if="form.verified_by" class="verification-info">
        <span
          ><i class="bi bi-patch-check-fill"></i> {{ t('questions.verified') }} —
          {{ form.verified_by }}</span
        >
        <span v-if="form.verified_at">{{ formatDate(form.verified_at) }}</span>
      </div>
      <p class="text-muted question-form__verification-hint">
        <i class="bi bi-info-circle"></i>
        {{ t('questions.verifyHint') }}
      </p>

      <div class="form-actions">
        <BaseButton type="submit" variant="primary" :loading="isLoading || isSubmitting">{{
          submitLabel
        }}</BaseButton>
        <BaseButton type="button" variant="secondary" @click="router.push('/questions')">{{
          t('common.cancel')
        }}</BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<script setup>
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/configStore'
import { useCaseStore } from '@/stores/caseStore'
import MarkdownEditor from '@/components/markdown/MarkdownEditor.vue'
import CategorySelect from './CategorySelect.vue'
import DifficultySelector from './DifficultySelector.vue'
import TagInput from './TagInput.vue'
import ChoiceEditor from './ChoiceEditor.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import { useSubmitGuard } from '@/composables/useSubmitGuard'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { formatDate } from '@/utils/formatters'
import {
  normalizeQuestionChoices,
  validateChoices,
  validateCorrectAnswer,
} from '@/utils/questionValidators'
import { FALLBACK_MAX_CHOICES } from '@/utils/constants'
import { useNotify } from '@/composables/useNotify'
import { validateFile, FILE_VALIDATION_REASONS } from '@/utils/fileValidation'
import { knowledgeService } from '@/services/knowledgeService'

const { t } = useI18n()

const props = defineProps({ question: Object, loading: Boolean })
const emit = defineEmits(['save'])

const router = useRouter()
const { isSubmitting, guard } = useSubmitGuard()
const { notify } = useNotify()
const configStore = useConfigStore()
const caseStore = useCaseStore()

const isLoading = computed(() => Boolean(props.loading))
const isEdit = computed(() => !!props.question)
const submitLabel = computed(() => (isEdit.value ? t('questions.update') : t('questions.save')))
const showSplash = ref(false)

const pendingImageFile = ref(null)
const imagePreview = ref(null)
const imageCleared = ref(false)
const isDraggingImage = ref(false)
const knowledgeObjects = ref([])
const showKnowledgeCreator = ref(false)
const creatingKnowledgeObject = ref(false)
const initialRevisionDate = ref('')

const knowledgeDraft = reactive({
  title: '',
  learning_objective: '',
  canonical_answer: '',
  key_facts: '',
})

// Cases for the picker datalist. Populated once on mount; the list
// is short enough that re-fetching on every render would be wasteful.
const availableCases = computed(() => caseStore.items)

const imageUploadStatus = computed(() => {
  if (pendingImageFile.value) return t('questions.imagePending')
  if (imageCleared.value) return t('questions.imageCleared')
  return t('questions.imageSaved')
})

const form = reactive({
  question: '',
  choices: ['', ''],
  correct_answer: 1,
  explanation: '',
  source: '',
  source_document: '',
  source_page: '',
  knowledge_object: '',
  last_revised_at: '',
  translations: {},
  tags: '',
  difficulty: 'medium',
  category_id: null,
  verified_by: null,
  verified_at: null,
  // ── Case linkage ─────────────────────────────────────────────────
  // `case_key` is the human-readable case identifier. Null/empty
  // means "standalone question". `case_stem` is only consulted by
  // the backend when the case is being created for the first time;
  // editing a stem on an existing case goes through the dedicated
  // case-stem endpoint. See the hint text below the field.
  case_key: '',
  case_stem: '',
})

const { isDirty, markClean, allowNextNavigation } = useUnsavedChanges(
  () => ({
    form,
    pendingImageFile: pendingImageFile.value,
    imageCleared: imageCleared.value,
  }),
  { message: () => t('common.unsavedChanges') },
)

defineExpose({ isDirty, markClean, allowNextNavigation })

const selectedKnowledgeObject = computed(() =>
  knowledgeObjects.value.find((item) => Number(item.id) === Number(form.knowledge_object)),
)
const knowledgeObjectOptions = computed(() =>
  knowledgeObjects.value.map(item => ({ value: item.id, label: item.title })),
)

const translationLocale = ref('')
const translationCount = computed(() => Object.keys(form.translations).length)

watch(
  () => props.loading,
  (now, before) => {
    if (before && !now) {
      showSplash.value = false
    }
  },
)

onMounted(async () => {
  if (props.question) {
    form.choices =
      props.question.choices && props.question.choices.length >= 2
        ? [...props.question.choices]
        : ['', '']
    form.question = props.question.question || ''
    form.correct_answer = props.question.correct_answer || 1
    form.explanation = props.question.explanation || ''
    form.source = props.question.source || ''
    form.source_document = props.question.source_document || ''
    form.source_page = props.question.source_page || ''
    form.knowledge_object = props.question.knowledge_object || ''
    form.last_revised_at = props.question.last_revised_at || ''
    initialRevisionDate.value = form.last_revised_at
    form.translations = Object.fromEntries(
      Object.entries(props.question.translations || {}).map(([locale, content]) => [
        locale,
        {
          question: content?.question || '',
          choices: [...(content?.choices || [])],
          explanation: content?.explanation || '',
        },
      ]),
    )
    syncTranslationChoices()
    form.tags = Array.isArray(props.question.tags)
      ? props.question.tags.join(', ')
      : props.question.tags || ''
    form.difficulty = props.question.difficulty || 'medium'
    form.category_id = props.question.category ?? null
    form.verified_by = props.question.verified_by || null
    form.verified_at = props.question.verified_at || null
    form.case_key = props.question.case?.key || ''
    form.case_stem = props.question.case?.stem || ''
    if (props.question.image_url) {
      imagePreview.value = props.question.image_url
    }
  }

  markClean()

  // Populate the datalist. Failures are non-fatal — the picker
  // degrades to a plain text input.
  await Promise.all([caseStore.fetchList({ limit: 100 }), loadKnowledgeObjects()])
})

async function loadKnowledgeObjects() {
  try {
    // Include draft/retired objects so an existing question never loses its
    // visible selection merely because the linked objective changed status.
    const result = await knowledgeService.list()
    knowledgeObjects.value = result?.items || []
  } catch {
    knowledgeObjects.value = []
  }
}

function lines(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

async function createKnowledgeObject() {
  if (!knowledgeDraft.title || !knowledgeDraft.learning_objective) {
    notify(t('questions.knowledgeObjectRequired'), 'error')
    return
  }

  creatingKnowledgeObject.value = true
  try {
    const created = await knowledgeService.create({
      title: knowledgeDraft.title,
      learning_objective: knowledgeDraft.learning_objective,
      canonical_answer: knowledgeDraft.canonical_answer,
      key_facts: lines(knowledgeDraft.key_facts),
      category: form.category_id || null,
      status: 'active',
    })
    knowledgeObjects.value = [...knowledgeObjects.value, created].sort((left, right) =>
      left.title.localeCompare(right.title),
    )
    form.knowledge_object = created.id
    showKnowledgeCreator.value = false
    Object.assign(knowledgeDraft, {
      title: '',
      learning_objective: '',
      canonical_answer: '',
      key_facts: '',
    })
    notify(t('questions.knowledgeObjectCreated'), 'success')
  } catch (error) {
    notify(error?.message || t('questions.knowledgeObjectCreateFailed'), 'error')
  } finally {
    creatingKnowledgeObject.value = false
  }
}

watch(
  () => form.choices.length,
  () => syncTranslationChoices(),
)

function normalizeLocale(value) {
  const parts = String(value || '').trim().replaceAll('_', '-').split('-')
  if (parts.length < 1 || parts.length > 2) return ''
  if (parts.length === 1) return parts[0].toLowerCase()
  return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`
}

function syncTranslationChoices() {
  for (const translation of Object.values(form.translations)) {
    if (!Array.isArray(translation.choices)) translation.choices = []
    while (translation.choices.length < form.choices.length) translation.choices.push('')
    if (translation.choices.length > form.choices.length) {
      translation.choices.splice(form.choices.length)
    }
  }
}

function addTranslation() {
  const locale = normalizeLocale(translationLocale.value)
  if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(locale)) {
    notify(t('questions.translationLocaleInvalid'), 'error')
    return
  }
  if (!form.translations[locale]) {
    form.translations[locale] = {
      question: '',
      choices: Array(form.choices.length).fill(''),
      explanation: '',
    }
  }
  translationLocale.value = ''
}

function removeTranslation(locale) {
  delete form.translations[locale]
}

function buildTranslations() {
  const output = {}
  for (const [locale, content] of Object.entries(form.translations)) {
    const question = String(content.question || '').trim()
    const explanation = String(content.explanation || '').trim()
    const choices = (content.choices || [])
      .slice(0, form.choices.length)
      .map((choice) => String(choice || '').trim())
    const hasChoices = choices.some(Boolean)
    const hasContent = question || explanation || hasChoices
    if (!hasContent) continue
    if (!question) {
      notify(t('questions.translationQuestionRequired', { locale }), 'error')
      return null
    }
    if (hasChoices && choices.some((choice) => !choice)) {
      notify(t('questions.translationChoicesIncomplete', { locale }), 'error')
      return null
    }
    output[locale] = {
      question,
      choices: hasChoices ? choices : [],
      explanation,
    }
  }
  return output
}

function validateImageFile(file) {
  const result = validateFile(file, {
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSizeMb: 5,
  })
  if (result.ok) return true

  if (result.reason === FILE_VALIDATION_REASONS.WRONG_TYPE) {
    notify(t('questions.imageBadType'), 'error')
  } else {
    notify(t('questions.imageTooLarge'), 'error')
  }
  return false
}

function setImageFromFile(file) {
  if (!validateImageFile(file)) return
  pendingImageFile.value = file
  imageCleared.value = false
  if (imagePreview.value && imagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imagePreview.value = URL.createObjectURL(file)
}

function handleImagePick(e) {
  const file = e.target.files?.[0]
  if (file) setImageFromFile(file)
  e.target.value = ''
}

function handleImageDrop(e) {
  isDraggingImage.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) setImageFromFile(file)
}

function clearImage() {
  pendingImageFile.value = null
  imageCleared.value = true
  if (imagePreview.value && imagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imagePreview.value = null
}

async function handleSubmit() {
  const maxChoices = configStore.maxChoices || FALLBACK_MAX_CHOICES

  const choicesResult = validateChoices(form.choices, 2, maxChoices)
  if (!choicesResult.valid) {
    notify(choicesResult.message, 'error')
    return
  }

  const correctResult = validateCorrectAnswer(form.correct_answer, form.choices, maxChoices)
  if (!correctResult.valid) {
    notify(correctResult.message, 'error')
    return
  }

  showSplash.value = true

  const { choices: filteredChoices, correctAnswer: remappedCorrectAnswer } =
    normalizeQuestionChoices(form.choices, form.correct_answer)

  if (remappedCorrectAnswer === null) {
    showSplash.value = false
    notify(t('validation.correctAnswerEmpty'), 'error')
    return
  }

  const translations = buildTranslations()
  if (translations === null) {
    showSplash.value = false
    return
  }

  const payload = {
    question: form.question,
    choices: filteredChoices,
    correct_answer: remappedCorrectAnswer,
    explanation: form.explanation,
    source: form.source,
    source_document: form.source_document || null,
    source_page: form.source_page ? Number(form.source_page) : null,
    translations,
    tags: form.tags,
    difficulty: form.difficulty,
    category:
      form.category_id === '' || form.category_id === null ? null : Number(form.category_id),
    knowledge_object: form.knowledge_object ? Number(form.knowledge_object) : null,
    // ── Case linkage ─────────────────────────────────────────────────
    // Emitted under the write-side field name the backend expects.
    // A null/empty case_key detaches the question.
    case_key: form.case_key || null,
    case_stem: form.case_stem || null,
    __pending_image: pendingImageFile.value,
    __clear_image: imageCleared.value,
  }

  if (!isEdit.value || form.last_revised_at !== initialRevisionDate.value) {
    payload.last_revised_at = form.last_revised_at || undefined
  }

  emit('save', payload)
}

function submitWithGuard() {
  guard(handleSubmit)
}
</script>
