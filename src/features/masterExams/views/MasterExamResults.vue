<!-- frontend/src/features/masterExams/views/MasterExamResults.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('masterExams.resultsTitle', { name: exam?.name || '' })"
      icon="bi bi-bar-chart"
      page-class="master-exam-results-page"
    >
        <template #badges>
          <span v-if="isActive" class="master-exam-results__live-indicator">
            <span class="master-exam-results__live-indicator__dot"></span>
            {{ t('masterExams.resultsLive') }}
          </span>
        </template>
        <template #actions>
          <div class="master-exam-results__header-actions">
            <BaseButton variant="ghost" size="small" @click="load">
              <i class="bi bi-arrow-repeat"></i> {{ t('masterExams.resultsRefresh') }}
            </BaseButton>
            <BaseButton variant="ghost" size="small" @click="downloadSummaryCsv">
              <i class="bi bi-filetype-csv"></i> {{ t('masterExams.resultsSummaryCsv') }}
            </BaseButton>
            <BaseButton variant="ghost" size="small" @click="downloadMatrixCsv">
              <i class="bi bi-filetype-csv"></i> {{ t('masterExams.resultsMatrixCsv') }}
            </BaseButton>
            <BaseButton
              v-if="canPublishToBank"
              variant="primary"
              size="small"
              @click="publishToBank"
            >
              <i class="bi bi-cloud-upload"></i> {{ t('masterExams.resultsPublish') }}
            </BaseButton>
          </div>
        </template>
      <ErrorBanner
        :error="masterExamStore.error"
        :retry="masterExamStore.error ? true : false"
        @dismiss="masterExamStore.error = null"
        @retry="load"
      />

      <ResultStatGrid v-if="results" :items="statItems" />

      <!-- Flags raised during exam -->
      <BaseCard v-if="results && results.flags && results.flags.length">
        <CardHeader
          :title="t('masterExams.resultsFlagTitle', { count: results.flags.length })"
          icon="bi bi-flag-fill"
        />
        <div class="master-exam-flags-list">
          <div v-for="flag in results.flags" :key="flag.flag_id" class="master-exam-flag-item">
            <i class="bi bi-flag-fill"></i>
            <div class="master-exam-flag-item__body">
              <strong>{{ flag.question_text }}</strong>
              <div class="master-exam-flag-item__meta">
                <i class="bi bi-person"></i> {{ flag.flagger_username }}
                <span v-if="flag.reason"> — {{ flag.reason }}</span>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Per-user table -->
      <BaseCard>
        <CardHeader :title="t('masterExams.resultsParticipants')" icon="bi bi-people-fill" />
        <BaseListContainer
          :loading="masterExamStore.isLoading"
          :items="results?.per_user || []"
          :empty-title="t('masterExams.resultsEmpty')"
          :empty-message="t('masterExams.resultsEmptyHint')"
          empty-icon="bi-people"
        >
          <template #default="{ items }">
            <BaseTableShell mobile-mode="columns" :aria-label="t('masterExams.resultsParticipants')" sticky max-height="600px" striped>
              <table class="table-shared master-exam-results__table">
                <thead>
                  <tr>
                    <th>{{ t('masterExams.resultsColName') }}</th>
                    <th>{{ t('masterExams.resultsColScore') }}</th>
                    <th>{{ t('masterExams.resultsColAccuracy') }}</th>
                    <th>{{ t('masterExams.resultsColWeighted') }}</th>
                    <th data-priority="medium">{{ t('masterExams.resultsColStarted') }}</th>
                    <th data-priority="low">{{ t('masterExams.resultsColFinished') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in items" :key="row.user_id">
                    <td>
                      <strong>{{ row.full_name }}</strong>
                      <span v-if="row.is_makeup" class="master-exam-results__makeup-flag">{{
                        t('masterExams.resultsMakeupFlag')
                      }}</span>
                      <span v-if="row.forced_finish" class="master-exam-results__forced-flag">{{
                        t('masterExams.resultsForcedFlag')
                      }}</span>
                    </td>
                    <td class="numeric">
                      {{ row.is_complete ? `${row.correct_count}/${row.total_questions}` : '—' }}
                    </td>
                    <td class="numeric">
                      {{ row.is_complete ? `${row.accuracy}%` : '—' }}
                    </td>
                    <td class="numeric">
                      {{ row.is_complete ? `${row.weighted_score}%` : '—' }}
                    </td>
                    <td data-priority="medium">{{ formatDateTime(row.started_at) }}</td>
                    <td data-priority="low">{{ row.finished_at ? formatDateTime(row.finished_at) : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </BaseTableShell>
          </template>
        </BaseListContainer>
      </BaseCard>

      <!-- Per-question table -->
      <BaseCard v-if="results && results.per_question && results.per_question.length">
        <CardHeader :title="t('masterExams.resultsDistribution')" icon="bi bi-list-ol" />
        <BaseTableShell mobile-mode="columns" :aria-label="t('masterExams.resultsDistribution')" sticky max-height="600px" striped>
          <table class="table-shared master-exam-results__table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ t('masterExams.resultsColQuestion') }}</th>
                <th data-priority="medium">{{ t('masterExams.resultsColAnswered') }}</th>
                <th data-priority="medium">{{ t('masterExams.resultsColCorrect') }}</th>
                <th>{{ t('masterExams.resultsColPercent') }}</th>
                <th data-priority="low">{{ t('masterExams.resultsDistribution') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in results.per_question" :key="row.question_id">
                <td class="numeric">{{ idx + 1 }}</td>
                <td class="master-exam-results__question-text">
                  {{ row.question_text }}
                </td>
                <td class="numeric" data-priority="medium">{{ row.answered_count }}</td>
                <td class="numeric" data-priority="medium">{{ row.correct_count }}</td>
                <td class="numeric">{{ row.correct_rate }}%</td>
                <td data-priority="low">
                  <div class="master-exam-distribution">
                    <div
                      v-for="segment in distributionSegments(row)"
                      :key="segment.key"
                      class="master-exam-distribution__segment"
                      :class="`master-exam-distribution__segment--${segment.key}`"
                      :style="{ flex: segment.width }"
                      :title="`${segment.label}: ${segment.value}`"
                    >
                      {{ segment.value > 0 ? segment.value : '' }}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </BaseTableShell>
      </BaseCard>
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/master.css'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import CardHeader from '@/components/common/CardHeader.vue'
import BaseTableShell from '@/components/common/BaseTableShell.vue'
import ResultStatGrid from '../components/ResultStatGrid.vue'
import { useMasterExamStore } from '@/stores/masterExamStore'
import { useAuthStore } from '@/stores/authStore'
import { useDialog } from '@/composables/useDialog'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { formatDateTime } from '@/utils/formatters'
import { downloadUrl } from '@/utils/downloadFile'

const { t } = useI18n()

const route = useRoute()
const masterExamStore = useMasterExamStore()
const authStore = useAuthStore()
const { confirm } = useDialog()

const examId = computed(() => Number(route.params.id))
const exam = computed(() => masterExamStore.byId[examId.value])
const results = computed(() => masterExamStore.resultsById[examId.value] || null)
const isActive = computed(() => exam.value?.status === 'active')

// Three conditions must ALL hold before the button is rendered:
//
//   1. The exam is in the 'completed' status (author's window has
//      closed and grading is done).
//   2. The exam has not already been published to the bank.
//   3. The caller holds 'master_exams.publish_to_bank'.
//
// The third condition mirrors the SECOND of the two capability gates
// the backend enforces on `MasterExamPublishToBankView.post`:
// `_can_manage_exam(user, exam)` AND
// `user.has_capability('master_exams.publish_to_bank')`. Without the
// capability check here, a deployment that grants a role
// `master_exams.manage_own` but withholds `publish_to_bank` renders
// a button whose every click returns 403. See
// backend/apps/master_exams/views/lifecycle_views.py.
const canPublishToBank = computed(
  () =>
    exam.value &&
    exam.value.status === 'completed' &&
    exam.value.stored_status !== 'published_to_bank' &&
    authStore.can('master_exams.publish_to_bank'),
)

// The six summary tiles for the results page.
const statItems = computed(() => {
  if (!results.value) return []
  const s = results.value.summary
  return [
    {
      key: 'assigned',
      value: s.total_assigned,
      label: t('masterExams.resultsAssigned'),
      accent: 'var(--color-info)',
    },
    {
      key: 'started',
      value: s.started,
      label: t('masterExams.resultsStarted'),
      accent: 'var(--color-primary)',
    },
    {
      key: 'finished',
      value: s.finished,
      label: t('masterExams.resultsFinished'),
      accent: 'var(--color-success)',
    },
    {
      key: 'in-progress',
      value: s.in_progress,
      label: t('masterExams.resultsInProgress'),
      accent: 'var(--color-warning)',
    },
    {
      key: 'not-started',
      value: s.not_started,
      label: t('masterExams.resultsNotStarted'),
      accent: 'var(--color-danger)',
    },
    {
      key: 'avg-accuracy',
      value: `${s.avg_accuracy}%`,
      label: t('masterExams.resultsAvgAccuracy'),
      accent: 'var(--color-success)',
    },
  ]
})

async function load() {
  const [examData] = await Promise.all([
    masterExamStore.fetchOne(examId.value),
    masterExamStore.fetchResults(examId.value),
  ])
  return examData
}

function distributionSegments(row) {
  const dist = row.distribution || {}
  const correctAnswer = String(row.correct_answer)
  const segments = []

  const correctCount = dist[correctAnswer] || 0
  if (correctCount > 0) {
    segments.push({
      key: 'correct',
      value: correctCount,
      width: correctCount,
      label: t('masterExams.resultsDistributionCorrect'),
    })
  }

  let wrongCount = 0
  for (const [key, count] of Object.entries(dist)) {
    if (key === correctAnswer) continue
    wrongCount += count
  }
  if (wrongCount > 0) {
    segments.push({
      key: 'wrong',
      value: wrongCount,
      width: wrongCount,
      label: t('masterExams.resultsDistributionWrong'),
    })
  }

  return segments.map((s) => ({ ...s, width: Math.max(1, s.width) }))
}

async function publishToBank() {
  const ok = await confirm(t('masterExams.resultsPublishConfirm'))
  if (!ok) return
  const result = await masterExamStore.publishToBank(examId.value)
  if (result) load()
}

function downloadSummaryCsv() {
  downloadUrl(masterExamStore.summaryCsvUrl(examId.value))
}

function downloadMatrixCsv() {
  downloadUrl(masterExamStore.matrixCsvUrl(examId.value))
}

useAutoRefresh(
  async () => {
    if (!isActive.value) return { skipped: true }
    return load()
  },
  30_000,
  false,
)

onMounted(async () => {
  await load()
})
</script>
