<!-- frontend/src/features/admin/views/ActiveUsers.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('admin.activeUsers.title')"
      icon="bi bi-people"
      page-class="active-users"
    >
        <template #badges>
          <span class="live-indicator" :title="t('admin.activeUsers.liveTooltip')">
            <span class="live-dot"></span> {{ t('admin.activeUsers.liveBadge') }}
          </span>
          <BaseBadge variant="info">
            {{ t('admin.activeUsers.countBadge', { count: activeUserStore.count }) }}
          </BaseBadge>
          <BaseBadge variant="secondary">{{ lastUpdateBadgeText }}</BaseBadge>
        </template>
        <template #actions>
          <BaseButton variant="secondary" size="small" @click="refresh" :loading="isRefreshing">
            <i v-if="isRefreshing" class="bi bi-arrow-repeat spin-icon"></i>
            <i v-else class="bi bi-arrow-repeat"></i>
            {{ t('admin.activeUsers.refresh') }}
          </BaseButton>
        </template>
      <ErrorBanner
        :error="activeUserStore.error"
        :retry="activeUserStore.error ? true : false"
        @dismiss="activeUserStore.error = null"
        @retry="refresh"
      />

      <BaseListContainer
        :loading="activeUserStore.isLoading && activeUserStore.count === 0"
        :error="activeUserStore.error && activeUserStore.count === 0 ? activeUserStore.error : ''"
        :items="activeUserStore.users"
        :empty-title="t('admin.activeUsers.empty')"
        empty-icon="bi-people"
        :skeleton-count="3"
        :skeleton-height="'80px'"
        @retry="refresh"
      >
        <template #default="{ items }">
          <div class="users-grid stagger-list">
            <ModerationCard
              v-for="user in items"
              :key="user.id"
              :label="user.name"
              :subtitle="roleLabel(user.role)"
              icon="bi bi-person-circle"
              variant="default"
            >
              <template #meta>
                <span><i class="bi bi-wifi"></i> {{ user.ip }}</span>
         
                <span class="user-time" :title="formatDateTime(user.last_seen)">
                  <i class="bi bi-clock"></i>
                  <TimeAgo :date="user.last_seen" />
                </span>
              </template>
            </ModerationCard>
          </div>
        </template>
      </BaseListContainer>
    </PageShell>
  </Layout>
</template>

<script setup>
import { computed } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ModerationCard from '@/components/common/ModerationCard.vue'
import { useActiveUserStore } from '@/stores/activeUserStore'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { formatDateTime } from '@/utils/formatters'
import { ROLE_LABEL_KEYS } from '@/utils/constants'

const { t } = useI18n()

const activeUserStore = useActiveUserStore()
const { lastUpdated, isRefreshing, refresh } = useAutoRefresh(
  () => activeUserStore.fetchActiveUsers(),
  30000,
  true,
)

// Role label resolves through the shared constants map. Unknown
// roles fall back to the raw role string so a backend-added role
// still renders something instead of blanking the card.
function roleLabel(role) {
  const key = ROLE_LABEL_KEYS[role]
  return key ? t(key) : (role || '')
}

function formatShortRelativeTime(timestamp) {
  if (!timestamp) return '—'
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 10) return t('admin.activeUsers.justNow')
  if (seconds < 60) return t('admin.activeUsers.secondsAgo', { n: seconds })
  const mins = Math.floor(seconds / 60)
  return t('admin.activeUsers.minutesAgo', { n: mins })
}

const lastUpdateBadgeText = computed(() => {
  if (!lastUpdated.value) {
    return t('admin.activeUsers.lastUpdateBadge', { value: '—' })
  }
  return t('admin.activeUsers.lastUpdateBadge', {
    value: formatShortRelativeTime(lastUpdated.value.getTime()),
  })
})
</script>
