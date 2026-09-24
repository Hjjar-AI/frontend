<!-- frontend/src/features/questions/views/AddView.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('questions.addTitle')"
      icon="bi bi-plus-circle"
      size="base"
      page-class="question-form-page"
      :error="questionStore.error || ''"
      @dismiss-feedback="questionStore.error = null"
    >
      <QuestionForm ref="questionFormRef" @save="handleSave" :loading="questionStore.isLoading" />
    </PageShell>
  </Layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import QuestionForm from '../components/QuestionForm.vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useQuestionSave } from '../composables/useQuestionSave'


const { t } = useI18n()

const router = useRouter()
const questionFormRef = ref(null)
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

  questionFormRef.value?.markClean()
  router.push('/questions')
}
</script>
