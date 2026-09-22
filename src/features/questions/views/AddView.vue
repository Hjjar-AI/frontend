<!-- frontend/src/features/questions/views/AddView.vue -->
<template>
  <Layout>
    <div class="question-form-page">
      <PageHeader :title="t('questions.addTitle')" icon="bi bi-plus-circle" />
      <ErrorBanner :error="questionStore.error" @dismiss="questionStore.error = null" />
      <QuestionForm @save="handleSave" :loading="questionStore.isLoading" />
    </div>
  </Layout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import QuestionForm from '../components/QuestionForm.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useQuestionSave } from '../composables/useQuestionSave'


const { t } = useI18n()

const router = useRouter()
const questionStore = useQuestionStore()
const { extractSentinels, finishSave } = useQuestionSave()
async function handleSave(formData) {
  const sentinels = extractSentinels(formData)

  const result = await questionStore.create(formData)
  if (!result) return

  await finishSave({
    questionId: result.id,
    sentinels,
    payload: formData,
    uploadFailureKey: 'questions.imageUploadFailed',
  })

  router.push('/questions')
}
</script>