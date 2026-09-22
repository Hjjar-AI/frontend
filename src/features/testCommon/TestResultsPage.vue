<!-- frontend/src/features/testCommon/TestResultsPage.vue -->

<template>
  <TestResults
    :results="store.results"
    :mode="mode"
    :tag="store.tag"
    :show-time="config.showTime"
    :show-share="config.showShare"
    :show-warning="!isCompleted"
    :warning-message="warningMessage"
    :show-answered-count="mode === 'study'"
    @retry="router.push(`/${mode}`)"
    @home="router.push('/')"
  />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TestResults from './TestResults.vue'
import { useTestSessionStore } from '@/stores/testSessionStore'
import { useNotify } from '@/composables/useNotify'
import { MODES } from './modes'

const { t } = useI18n()

const props = defineProps({
  mode: { type: String, required: true },
})

const router = useRouter()
const store = useTestSessionStore()
const { notify } = useNotify()

const config = computed(() => MODES[props.mode] || MODES.exam)

const isCompleted = computed(() => {
  if (!store.results) return false
  const questions = store.results.results || []
  const answered = questions.filter(q => q.user_answer !== null).length
  return answered === store.results.total_questions
})

const warningMessage = computed(() => {
  if (props.mode === 'exam') return t('tests.warningExamIncomplete')
  if (props.mode === 'study') return t('tests.warningStudyIncomplete')
  return t('tests.warningExamIncomplete')
})

onMounted(() => {
  if (!store.results) {
    notify(t('tests.noResults'), 'warning')
    router.push(`/${props.mode}`)
  }
})
</script>
