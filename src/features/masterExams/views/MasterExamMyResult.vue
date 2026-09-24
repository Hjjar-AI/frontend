<!-- frontend/src/features/masterExams/views/MasterExamMyResult.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('masterExams.myResultTitle', { name: exam?.name || '' })"
      icon="bi bi-trophy"
      page-class="master-exam-results-page"
    >
        <template #actions>
          <BaseButton variant="secondary" @click="router.push('/master-exams')">
            <DirectionalIcon ltr="bi bi-arrow-left" rtl="bi bi-arrow-right" />
            {{ t('common.back') }}
          </BaseButton>
        </template>
      <AsyncContent
        :loading="loading"
        :error="error || ''"
        :empty="!attempt || !attempt.is_complete"
        :empty-title="t('masterExams.myResultEmpty')"
        :empty-message="t('masterExams.myResultEmptyDesc')"
        empty-icon="bi-trophy"
        skeleton-height="60px"
        @retry="load"
      >
        <ResultStatGrid :items="statItems" />

        <BaseCard>
          <CardHeader :title="t('masterExams.resultsParticipants')" icon="bi bi-info-circle" />
          <BaseTableShell density="compact">
            <table class="table-shared master-exam-results__table">
              <thead>
                <tr>
                  <th>{{ t('masterExams.resultsColStarted') }}</th>
                  <th>{{ t('masterExams.resultsColFinished') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ attempt.started_at ? formatDateTime(attempt.started_at) : '—' }}</td>
                  <td>{{ attempt.finished_at ? formatDateTime(attempt.finished_at) : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </BaseTableShell>
          <div
            v-if="attempt.is_makeup || attempt.forced_finish"
            class="master-exam-my-result__flags"
          >
            <span v-if="attempt.is_makeup" class="master-exam-results__makeup-flag">{{
              t('masterExams.resultsMakeupFlag')
            }}</span>
            <span v-if="attempt.forced_finish" class="master-exam-results__forced-flag">{{
              t('masterExams.resultsForcedFlag')
            }}</span>
          </div>
        </BaseCard>
      </AsyncContent>
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/master.css'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import AsyncContent from '@/components/common/AsyncContent.vue'
import CardHeader from '@/components/common/CardHeader.vue'
import BaseTableShell from '@/components/common/BaseTableShell.vue'
import ResultStatGrid from '../components/ResultStatGrid.vue'
import { useMasterExamStore } from '@/stores/masterExamStore'
import { formatDateTime } from '@/utils/formatters'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const masterExamStore = useMasterExamStore()

const examId = computed(() => Number(route.params.id))
const exam = computed(() => masterExamStore.byId[examId.value] || null)
const attempt = computed(() => exam.value?.my_attempt || null)
const loading = ref(true)
const error = ref(null)

// The four tiles shown to the participant.
function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n.toFixed(1)}%`
}

const statItems = computed(() => {
  if (!attempt.value) return []
  return [
    {
      key: 'correct',
      value: attempt.value.correct_count,
      label: t('masterExams.resultsColCorrect'),
      accent: 'var(--color-success)',
    },
    {
      key: 'total',
      value: attempt.value.total_questions,
      label: t('masterExams.resultsColQuestion'),
      accent: 'var(--color-info)',
    },
    {
      key: 'accuracy',
      value: formatPercent(attempt.value.accuracy),
      label: t('masterExams.resultsColAccuracy'),
      accent: 'var(--color-primary)',
    },
    {
      key: 'weighted',
      value: formatPercent(attempt.value.weighted_score),
      label: t('masterExams.resultsColWeighted'),
      accent: 'var(--color-warning)',
    },
  ]
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await masterExamStore.fetchOne(examId.value)
    if (!data) throw new Error(masterExamStore.error || t('masterExams.detailLoadFailed'))
  } catch (e) {
    error.value = e?.message || t('masterExams.detailLoadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
