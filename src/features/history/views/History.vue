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
    <PageShell
      :title="t('history.title')"
      icon="bi bi-clock-history"
      page-class="history-page"
    >

      <FeedbackRegion
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
          <BaseTableShell mobile-mode="cards" :aria-label="t('history.title')" sticky max-height="70vh" striped>
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
                  <td v-if="mode === 'all'" :data-label="t('admin.history.colUser')">
                    {{ item.full_name || item.username || t('common.noData') }}
                  </td>
                  <td :data-label="t('history.colDate')">{{ formatDate(item.completed_at) }}</td>
                  <td :data-label="t('history.colType')">
                    <BaseBadge variant="info">{{ modeLabel(item.mode) }}</BaseBadge>
                  </td>
                  <td :data-label="t('history.colTag')">{{ item.tag || '—' }}</td>
                  <td :data-label="t('history.colScore')">{{ item.correct_count }} / {{ item.total_questions }}</td>
                  <td :data-label="t('history.colAccuracy')">
                    <span :class="accuracyClass(item.accuracy)">
                      {{ item.accuracy.toFixed(1) }}%
                    </span>
                  </td>
                  <td :data-label="t('history.colTime')">{{ formatTime(item.time_spent) }}</td>
                </tr>
              </tbody>
            </table>
          </BaseTableShell>
        </template>
      </BaseListContainer>

      <Pagination
        v-if="totalPages > 1"
        :current="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/history.css'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'
import Pagination from '@/components/base/BasePagination.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseTableShell from '@/components/common/BaseTableShell.vue'
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
const route = useRoute()
const router = useRouter()

const initialPage = Math.max(1, Number.parseInt(String(route.query.page || '1'), 10) || 1)
const currentPage = ref(initialPage)

const totalPages = computed(() => historyStore.pagination.total_pages || 1)

function modeLabel(m) {
  const key = {
    exam: 'history.modeExam',
    study: 'history.modeStudy',
    'self-test': 'history.modeSelfTest',
    recall: 'history.modeRecall',
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
  const next = Math.max(1, Number(page) || 1)
  router.replace({ query: { ...route.query, page: next === 1 ? undefined : String(next) } })
  fetchHistory(next)
}

// If the mode prop changes without unmounting — e.g. the user navigates
// from /history to /admin/history via a link while the component is
// still mounted — refetch from page 1 so the table does not show the
// previous mode's data. In practice the router treats these as
// distinct routes so the component remounts; this is a safety net for
// any future shape where they share a layout.
watch(() => props.mode, () => {
  currentPage.value = 1
  router.replace({ query: { ...route.query, page: undefined } })
  fetchHistory(1)
})

watch(() => route.query.page, (page) => {
  const next = Math.max(1, Number.parseInt(String(page || '1'), 10) || 1)
  if (next !== currentPage.value) fetchHistory(next)
})

onMounted(() => {
  fetchHistory(currentPage.value)
})
</script>
