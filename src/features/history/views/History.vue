<!-- frontend/src/features/history/views/History.vue -->
<!--
  Unified history page.

  Rendered by two router entries:

    • `/history`        → props: { mode: 'own' }  (any authenticated user)
    • `/admin/history`  → props: { mode: 'all' }  (requires
                                                    'tests.view_all_history')

  The two pages were previously two separate components with a
  near-identical table. The only structural difference was the extra
  "user" column in admin mode; the fetch URL was different but the
  backend route resolved to the same view either way.

  MODE SEMANTICS
  --------------
  `mode: 'own'` — sends `user_id = authStore.user.id`. The backend
  restricts to that user's rows.
  `mode: 'all'` — no `user_id`. The backend returns every user's
  rows when the caller holds `tests.view_all_history`; the capability
  is also declared on the `/admin/history` route meta, so an
  unprivileged caller cannot reach this page in the first place.

  PAGINATION
  ----------
  `totalPages` is read directly from the server's `total_pages`
  field, not recomputed. This was already the behaviour here; the
  two other paginated surfaces (`Users.vue`,
  `QuestionListPage.vue`) were brought into line in the same
  change. See `usePagination.js` for the module comment.
-->
<template>
  <Layout>
    <div class="history-page">
      <PageHeader
        :title="t('history.title')"
        icon="bi bi-clock-history"
      />

      <ErrorBanner
        :error="historyStore.error"
        @dismiss="historyStore.error = null"
      />

      <BaseListContainer
        :loading="historyStore.isLoading"
        :error="historyStore.error"
        :items="historyStore.items"
        :empty-title="t('history.empty')"
        empty-icon="bi-journal-x"
        @retry="() => fetchHistory(currentPage)"
      >
        <template #default="{ items }">
          <div class="history-table-wrap">
            <table class="table-shared">
              <thead>
                <tr>
                  <!-- User column only in admin mode. -->
                  <th v-if="mode === 'all'">{{ t('admin.history.colUser') }}</th>
                  <th>{{ t('history.colDate') }}</th>
                  <th>{{ t('history.colType') }}</th>
                  <th>{{ t('history.colTag') }}</th>
                  <th>{{ t('history.colScore') }}</th>
                  <th>{{ t('history.colAccuracy') }}</th>
                  <th>{{ t('history.colTime') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.id">
                  <td v-if="mode === 'all'">
                    {{ item.full_name || item.username || t('common.noData') }}
                  </td>
                  <td>{{ formatDate(item.completed_at) }}</td>
                  <td>
                    <BaseBadge variant="info">{{ modeLabel(item.mode) }}</BaseBadge>
                  </td>
                  <td>{{ item.tag || '—' }}</td>
                  <td>{{ item.correct_count }} / {{ item.total_questions }}</td>
                  <td>
                    <span :class="accuracyClass(item.accuracy)">
                      {{ item.accuracy.toFixed(1) }}%
                    </span>
                  </td>
                  <td>{{ formatTime(item.time_spent) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </BaseListContainer>

      <Pagination
        v-if="totalPages > 1"
        :current="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </Layout>
</template>

<script setup>
import '@/assets/history.css'
import { ref, computed, onMounted, watch } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import Pagination from '@/components/base/BasePagination.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { useTestHistoryStore } from '@/stores/testHistoryStore'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils/formatters'
import { formatTime } from '@/utils/timer'

const { t } = useI18n()

const props = defineProps({
  // 'own'  → the caller's own history
  // 'all'  → every user's history (requires the caller to hold
  //          'tests.view_all_history', enforced by the router meta)
  mode: {
    type: String,
    default: 'own',
    validator: (v) => ['own', 'all'].includes(v),
  },
})

const historyStore = useTestHistoryStore()
const authStore = useAuthStore()

const currentPage = ref(1)

const totalPages = computed(() => historyStore.pagination.total_pages || 1)

function modeLabel(m) {
  const key = {
    exam: 'history.modeExam',
    study: 'history.modeStudy',
    'self-test': 'history.modeSelfTest',
  }[m]
  return key ? t(key) : m
}

function accuracyClass(acc) {
  if (acc >= 80) return 'text-success'
  if (acc >= 50) return 'text-warning'
  return 'text-danger'
}

async function fetchHistory(page = 1) {
  currentPage.value = page

  const params = {
    page,
    per_page: historyStore.pagination.per_page || 20,
  }

  if (props.mode === 'own') {
    params.userId = authStore.user?.id
  }

  await historyStore.fetchHistory(params)
}

function handlePageChange(page) {
  fetchHistory(page)
}

// If the mode prop changes without unmounting — e.g. the user navigates
// from /history to /admin/history via a link while the component is
// still mounted — refetch from page 1 so the table does not show the
// previous mode's data. In practice the router treats these as
// distinct routes so the component remounts; this is a safety net for
// any future shape where they share a layout.
watch(() => props.mode, () => {
  currentPage.value = 1
  fetchHistory(1)
})

onMounted(() => {
  fetchHistory(1)
})
</script>