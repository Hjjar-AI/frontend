<!-- frontend/src/features/questions/views/EditView.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('questions.editTitle')"
      icon="bi bi-pencil-square"
      size="base"
      page-class="question-form-page"
    >
      <ErrorBanner :error="questionStore.error" @dismiss="questionStore.error = null" />
      <QuestionForm
        v-if="question"
        :question="question"
        :loading="questionStore.isLoading"
        @save="handleSave"
      />
      <div v-else class="loading-placeholder">
        <BaseSkeleton height="400px" />
      </div>
    </PageShell>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import QuestionForm from '../components/QuestionForm.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotify } from '@/composables/useNotify'
import { useQuestionSave } from '../composables/useQuestionSave'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const questionStore = useQuestionStore()
const authStore = useAuthStore()
const { notify } = useNotify()
const { extractSentinels, finishSave } = useQuestionSave()

const question = ref(null)

onMounted(async () => {
  const id = parseInt(route.params.id)
  if (isNaN(id)) {
    notify(t('questions.invalidId'), 'error')
    router.push('/questions')
    return
  }

  const q = await questionStore.fetchOne(id)
  if (q) {
    question.value = q
    questionStore.rememberLastViewed(id, authStore.user?.id || 'guest')
  } else {
    notify(t('questions.notFound'), 'error')
    router.push('/questions')
  }
})

async function handleSave(formData) {
  const id = parseInt(route.params.id)

  // Include expected_version for optimistic locking. Unchanged from
  // the pre-refactor behaviour. This is the one payload difference
  // between Add and Edit that the shared helper does NOT handle —
  // the value comes from the loaded `question.value`, which only
  // Edit has.
  if (question.value && question.value.version !== undefined) {
    formData.expected_version = question.value.version
  }

  const sentinels = extractSentinels(formData)

  const result = await questionStore.update(id, formData)
  if (!result) return

  await finishSave({
    questionId: id,
    sentinels,
    payload: formData,
    uploadFailureKey: 'questions.imageUploadFailedUpdate',
  })

  router.push('/questions')
}
</script>
