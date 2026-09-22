<!-- frontend/src/features/masterExams/views/MasterExamDrafts.vue -->
<template>
  <Layout>
    <div class="master-exam-drafts-page">
      <PageHeader :title="t('masterExams.draftsTitle')" icon="bi bi-journal-text">
        <template #badges>
          <BaseBadge variant="warning"
            >{{ masterExamStore.draftsTotal }} {{ t('masterExams.draftBadge') }}</BaseBadge
          >
        </template>
        <template #actions>
          <BaseButton variant="secondary" @click="router.push('/master-exams')">
            <DirectionalIcon ltr="bi bi-arrow-left" rtl="bi bi-arrow-right" />
            {{ t('common.back') }}
          </BaseButton>
        </template>
      </PageHeader>

      <p class="text-muted master-exam-drafts__intro">
        {{ t('masterExams.draftsEmptyHint') }}
      </p>

      <div class="master-exam-drafts-toolbar">
        <div class="master-exam-drafts-toolbar__search">
          <BaseInput
            :model-value="searchInput"
            @update:model-value="onSearchInput"
            :placeholder="t('masterExams.draftsSearchPlaceholder')"
          />
        </div>
        <div class="master-exam-drafts-toolbar__usage">
          <button :class="{ active: usage === '' }" @click="setUsage('')">
            {{ t('masterExams.draftsFilterAll') }}
          </button>
          <button :class="{ active: usage === 'orphan' }" @click="setUsage('orphan')">
            {{ t('masterExams.draftsFilterOrphan') }}
          </button>
          <button :class="{ active: usage === 'attached' }" @click="setUsage('attached')">
            {{ t('masterExams.draftsFilterAttached') }}
          </button>
        </div>
      </div>

      <ErrorBanner
        :error="masterExamStore.draftsError"
        :retry="masterExamStore.draftsError ? true : false"
        @dismiss="masterExamStore.draftsError = null"
        @retry="load"
      />

      <BaseListContainer
        :loading="masterExamStore.isDraftsLoading"
        :error="masterExamStore.draftsError"
        :items="masterExamStore.drafts"
        :empty-title="t('masterExams.draftsEmpty')"
        :empty-message="t('masterExams.draftsEmptyHint')"
        empty-icon="bi-journal-x"
        @retry="load"
      >
        <template #emptyActions>
          <BaseButton variant="primary" @click="router.push('/master-exams/new')">
            <i class="bi bi-plus-circle"></i> {{ t('masterExams.draftsStartNew') }}
          </BaseButton>
        </template>
        <template #default="{ items }">
          <div class="master-exam-drafts-list stagger-list">
            <div v-for="draft in items" :key="draft.id" class="master-exam-draft-item">
              <div class="master-exam-draft-item__body">
                <p class="master-exam-draft-item__text">{{ draft.question }}</p>
                <div class="master-exam-draft-item__meta">
                  <span>
                    <i class="bi bi-list-ol"></i>
                    {{ t('masterExams.draftChoicesCount', { n: draft.choices?.length || 0 }) }}
                  </span>
                  <span>
                    <i class="bi bi-check-circle"></i>
                    {{ t('masterExams.draftCorrectAnswer', { n: draft.correct_answer }) }}
                  </span>
                  <span>
                    <i class="bi bi-speedometer"></i> {{ difficultyLabel(draft.difficulty) }}
                  </span>
                  <span v-if="draft.category_name">
                    <i class="bi bi-folder2"></i> {{ draft.category_name }}
                  </span>
                  <span v-if="draft.case" :title="draft.case.title || draft.case.key">
                    <i class="bi bi-journal-medical"></i>
                    {{ draft.case.key }}
                  </span>
                  <span> <i class="bi bi-calendar"></i> {{ formatDate(draft.created_at) }} </span>
                </div>
              </div>
              <div class="master-exam-draft-item__actions">
                <BaseButton variant="secondary" size="small" @click="openEdit(draft)">
                  <i class="bi bi-pencil"></i> {{ t('masterExams.edit') }}
                </BaseButton>
                <BaseButton variant="danger" size="small" @click="handleDelete(draft)">
                  <i class="bi bi-trash"></i>
                </BaseButton>
              </div>
            </div>
          </div>
        </template>
      </BaseListContainer>
    </div>

    <BaseModal
      :is-open="editModalOpen"
      :title="t('masterExams.draftEditTitle')"
      size="lg"
      @update:is-open="editModalOpen = false"
    >
      <DraftQuestionForm
        v-model="editForm"
        :categories="categoryStore.items"
        :cases="availableCases"
        :loading="masterExamStore.isLoading"
        :submit-label="t('common.save')"
        @submit="submitEdit"
        @cancel="editModalOpen = false"
      />
    </BaseModal>
  </Layout>
</template>

<script setup>
import '@/assets/master.css'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import DraftQuestionForm from '../components/DraftQuestionForm.vue'
import { useMasterExamStore } from '@/stores/masterExamStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useCaseStore } from '@/stores/caseStore'
import { useDialog } from '@/composables/useDialog'
import { useDebounceFn } from '@/composables/useDebounceFn'
import { formatDate } from '@/utils/formatters'
import { difficultyLabelFor } from '@/utils/constants'
import { normalizeQuestionChoices } from '@/utils/questionValidators'

const { t } = useI18n()

const router = useRouter()
const masterExamStore = useMasterExamStore()
const categoryStore = useCategoryStore()
const caseStore = useCaseStore()
const { confirm } = useDialog()

const searchInput = ref(masterExamStore.draftsSearch)
const usage = ref(masterExamStore.draftsUsageFilter)
const availableCases = computed(() => caseStore.items)

// Shared difficulty-registry lookup. The previous local function
// duplicated the same easy/medium/hard key map that already lives
// in `utils/constants.js`.
function difficultyLabel(d) {
  return difficultyLabelFor(d, t)
}

async function load() {
  const params = {}
  if (searchInput.value) params.search = searchInput.value
  if (usage.value) params.usage = usage.value
  await masterExamStore.fetchDrafts(params)
}

const { debounced: debouncedLoad } = useDebounceFn(() => load(), 400)

function onSearchInput(v) {
  searchInput.value = v
  masterExamStore.setDraftsSearch(v)
  debouncedLoad()
}

function setUsage(u) {
  usage.value = u
  masterExamStore.setDraftsUsageFilter(u)
  load()
}

const editModalOpen = ref(false)
const editForm = ref({
  id: null,
  question: '',
  choices: [],
  correct_answer: 1,
  explanation: '',
  source: '',
  difficulty: 'medium',
  category: null,
  case_key: '',
})

function openEdit(draft) {
  editForm.value = {
    id: draft.id,
    question: draft.question,
    choices: [...(draft.choices || [])],
    correct_answer: draft.correct_answer,
    explanation: draft.explanation || '',
    source: draft.source || '',
    difficulty: draft.difficulty || 'medium',
    category: draft.category || null,
    case_key: draft.case?.key || '',
  }
  editModalOpen.value = true
}

async function submitEdit() {
  if (!editForm.value.question.trim()) return

  const { choices: filteredChoices, correctAnswer: remappedCorrectAnswer } =
    normalizeQuestionChoices(editForm.value.choices, editForm.value.correct_answer)

  if (filteredChoices.length < 2) return
  if (remappedCorrectAnswer === null) return

  const payload = {
    question: editForm.value.question.trim(),
    choices: filteredChoices,
    correct_answer: remappedCorrectAnswer,
    explanation: editForm.value.explanation,
    source: editForm.value.source,
    difficulty: editForm.value.difficulty,
    category: editForm.value.category,
    case_key: editForm.value.case_key || null,
  }
  const result = await masterExamStore.updateDraft(editForm.value.id, payload)
  if (result) editModalOpen.value = false
}

async function handleDelete(draft) {
  if (!(await confirm(t('masterExams.draftDeleteConfirm')))) return
  await masterExamStore.deleteDraft(draft.id)
}

onMounted(async () => {
  await categoryStore.fetchAll()
  await load()
  await caseStore.fetchList({ limit: 100 })
})
</script>
