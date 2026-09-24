<!-- frontend/src/features/admin/views/VerificationStats.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('admin.verification.title')"
      icon="bi bi-bar-chart"
      page-class="verification-stats"
    >
        <template #actions>
          <BaseButton variant="secondary" size="small" @click="refresh" :loading="isRefreshing">
            <i class="bi bi-arrow-repeat"></i> {{ t('common.refresh') }}
          </BaseButton>
        </template>
      <FeedbackRegion
        :error="adminVerificationStatsStore.error"
        @dismiss="adminVerificationStatsStore.error = null"
      />

      <div class="stat-grid">
        <StatTile
          :value="stats.total_verified || 0"
          :label="t('admin.verification.totalVerified')"
        />
        <StatTile
          :value="stats.total_unverified || 0"
          :label="t('admin.verification.totalUnverified')"
        />
        <StatTile
          :value="(stats.verification_rate?.toFixed(1) || 0) + '%'"
          :label="t('admin.verification.rate')"
        />
      </div>

      <div class="grid-2col">
        <BaseCard>
          <h4 class="card-title">
            <i class="card-title__icon bi bi-trophy"></i> {{ t('admin.verification.topVerifiers') }}
          </h4>
          <div v-if="stats.by_user && stats.by_user.length">
            <div v-for="(user, idx) in stats.by_user" :key="idx" class="verifier-item">
              <span class="rank">{{ idx + 1 }}</span>
              <span class="name">{{ user.verified_by }}</span>
              <span class="count">{{
                t('admin.verification.verifierCount', { count: user.count })
              }}</span>
            </div>
          </div>
          <BaseEmptyState v-else :title="t('admin.verification.noVerifiers')" icon="bi-bar-chart" />
        </BaseCard>

        <BaseCard>
          <h4 class="card-title">
            <i class="card-title__icon bi bi-folder2"></i> {{ t('admin.verification.byCategory') }}
          </h4>
          <div v-if="stats.by_category && stats.by_category.length">
            <div v-for="cat in stats.by_category" :key="cat.name" class="category-progress">
              <div class="category-progress__label">
                <span>{{ cat.name }}</span>
                <span>{{ cat.verified }}/{{ cat.total }}</span>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{ width: (cat.total > 0 ? (cat.verified / cat.total) * 100 : 0) + '%' }"
                ></div>
              </div>
            </div>
          </div>
          <BaseEmptyState
            v-else
            :title="t('admin.verification.noCategories')"
            icon="bi-folder2-open"
          />
        </BaseCard>
      </div>

      <BaseCard v-if="stats.by_category && stats.by_category.length">
        <h4 class="card-title">
          <i class="card-title__icon bi bi-diagram-3"></i>
          {{ t('admin.verification.breakdownTitle') }}
        </h4>
        <BaseTableShell density="compact" striped mobile-mode="cards">
          <table class="table-shared">
            <thead>
              <tr>
                <th>{{ t('admin.verification.colCategory') }}</th>
                <th class="text-center">{{ t('admin.verification.colVerified') }}</th>
                <th class="text-center">{{ t('admin.verification.colUnverified') }}</th>
                <th class="text-center">{{ t('admin.verification.colTotal') }}</th>
                <th class="text-center">{{ t('admin.verification.colPercent') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in stats.by_category" :key="cat.name">
                <td :data-label="t('admin.verification.colCategory')">{{ cat.name }}</td>
                <td class="text-center text-success" :data-label="t('admin.verification.colVerified')">{{ cat.verified }}</td>
                <td class="text-center text-warning" :data-label="t('admin.verification.colUnverified')">{{ cat.total - cat.verified }}</td>
                <td class="text-center" :data-label="t('admin.verification.colTotal')">{{ cat.total }}</td>
                <td class="text-center" :data-label="t('admin.verification.colPercent')">
                  <span :class="categoryAccuracyClass(cat)">
                    {{ cat.total > 0 ? ((cat.verified / cat.total) * 100).toFixed(0) : 0 }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </BaseTableShell>
      </BaseCard>

      <ChartCard
        v-if="stats.monthly && stats.monthly.length"
        :title="t('admin.verification.chartMonthly')"
        type="bar"
        :data="monthlyChartData"
        :options="{
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        }"
      />

      <div class="export-section no-print">
        <h4 class="card-title">
          <i class="card-title__icon bi bi-download"></i> {{ t('admin.verification.exportTitle') }}
        </h4>

        <ExportButtons :url-builder="buildVerifiedExportUrl" />
      </div>
    </PageShell>
  </Layout>
</template>

<script setup>
import { computed } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import StatTile from '@/components/base/StatTile.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'
import ExportButtons from '@/components/common/ExportButtons.vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import BaseTableShell from '@/components/common/BaseTableShell.vue'
import { useAdminVerificationStatsStore } from '@/stores/adminVerificationStatsStore'
import { useAdminDatabaseStore } from '@/stores/adminDatabaseStore'
import { useAutoRefresh } from '@/composables/useAutoRefresh'

const { t } = useI18n()

const adminVerificationStatsStore = useAdminVerificationStatsStore()
const adminDatabaseStore = useAdminDatabaseStore()
const EMPTY_STATS = {
  total_verified: 0,
  total_unverified: 0,
  verification_rate: 0,
  by_user: [],
  by_category: [],
  monthly: [],
}
const stats = computed(() => adminVerificationStatsStore.stats || EMPTY_STATS)

const buildVerifiedExportUrl = (fmt) => adminDatabaseStore.exportUrl(fmt, { verifiedOnly: true })

const { isRefreshing, refresh } = useAutoRefresh(loadStats, 60000, true)

const monthlyChartData = computed(() => {
  if (!stats.value.monthly?.length) return { labels: [], datasets: [] }
  return {
    labels: stats.value.monthly.map((m) => m.month).reverse(),
    datasets: [
      {
        label: t('admin.verification.chartMonthlyLabel'),
        data: stats.value.monthly.map((m) => m.count).reverse(),
      },
    ],
  }
})

function categoryAccuracyClass(cat) {
  if (!cat.total) return ''
  const pct = (cat.verified / cat.total) * 100
  if (pct >= 80) return 'text-success'
  if (pct >= 50) return 'text-warning'
  return 'text-danger'
}

async function loadStats() {
  return await adminVerificationStatsStore.fetchStats()
}
</script>
