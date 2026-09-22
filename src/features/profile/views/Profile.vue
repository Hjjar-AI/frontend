<!-- frontend/src/features/profile/views/Profile.vue -->
<template>
  <Layout>
    <div class="profile-page">
      <PageHeader :title="t('profile.title')" icon="bi bi-person-circle">
        <template #actions>
          <BaseButton variant="secondary" @click="router.push('/change-password')">
            <i class="bi bi-key"></i> {{ t('profile.changePassword') }}
          </BaseButton>
        </template>
      </PageHeader>

      <div class="profile-grid">
        <BaseCard class="profile-card profile-card--main">
          <div class="profile-avatar">
            <div class="avatar-circle">{{ avatarInitial }}</div>
            <div class="avatar-info">
              <h3>{{ user.full_name || user.username }}</h3>
              <div class="profile-badges">
                <BaseBadge :variant="roleBadgeClass">{{ roleLabel }}</BaseBadge>

                <BaseBadge
                  v-if="authorRankLabel"
                  :variant="authorRankVariant"
                  :title="t('profile.rankTrustTooltip', {
                    trust: (user.trust_score || 0).toFixed(1),
                    count: user.questions_count || 0,
                  })"
                >
                  <i :class="authorRankIcon"></i>
                  {{ authorRankLabel }}
                </BaseBadge>
              </div>
            </div>
          </div>
          <div class="profile-details">
            <div class="detail-item">
              <i class="bi bi-person-badge"></i>
              <span class="detail-label">{{ t('profile.usernameLabel') }}</span>
              <span class="detail-value">@{{ user.username }}</span>
            </div>
            <div class="detail-item">
              <i class="bi bi-calendar-check"></i>
              <span class="detail-label">{{ t('profile.joinedLabel') }}</span>
              <span class="detail-value">{{ formatDate(user.created_at) }}</span>
            </div>
            <div class="detail-item">
              <i class="bi bi-palette"></i>
              <span class="detail-label">{{ t('profile.themeLabel') }}</span>
              <span class="detail-value">{{ themeLabel }}</span>
            </div>
          </div>
        </BaseCard>

        <div class="profile-stats">
          <StatTile :value="user.questions_count || 0" :label="t('profile.statQuestions')" />
          <StatTile :value="(user.trust_score || 0).toFixed(1) + '%'" :label="t('profile.statTrust')" />
        </div>

        <BaseCard
          v-if="user.expires_at"
          class="profile-card profile-card--expiry"
        >
          <h4 class="card-title">
            <i class="card-title__icon bi bi-hourglass-split"></i>
            {{ t('profile.subscriptionTitle') }}
          </h4>
          <div class="expiry-info">
            <div class="expiry-date">
              <span class="label">{{ t('profile.subscriptionExpires') }}</span>
              <span class="value">{{ formatLongDate(user.expires_at) }}</span>
            </div>
            <div class="expiry-days" :class="{ 'text-danger': daysUntilExpiry <= 7 }">
              <i class="bi bi-clock"></i>
              <span v-if="daysUntilExpiry > 0">
                {{ t('profile.subscriptionDaysLeft', { days: daysUntilExpiry }) }}
              </span>
              <span v-else class="text-danger">{{ t('profile.subscriptionExpired') }}</span>
            </div>
          </div>
          <p
            v-if="daysUntilExpiry <= 7 && daysUntilExpiry > 0"
            class="text-muted profile__subscription-contact"
          >
            {{ t('profile.subscriptionContact') }}
          </p>
        </BaseCard>

        <!--
          Admin card. The three buttons are driven by the shared
          PROFILE_ADMIN_SHORTCUTS list, which is a subset of
          ADMIN_LINKS. This used to hard-code the same three
          buttons — the shared registry is the single source of
          truth for admin destinations.
        -->
        <BaseCard
          v-if="profileAdminLinks.length > 0"
          class="profile-card profile-card--admin"
        >
          <h4 class="card-title">
            <i class="card-title__icon bi bi-shield-lock"></i>
            {{ t('profile.adminTitle') }}
          </h4>
          <p class="text-muted">{{ t('profile.adminDesc') }}</p>
          <div class="admin-actions">
            <BaseButton
              v-for="(link, idx) in profileAdminLinks"
              :key="link.to"
              :variant="idx === 0 ? 'primary' : 'secondary'"
              size="small"
              @click="router.push(link.to)"
            >
              <i :class="link.icon"></i> {{ t(link.labelKey) }}
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import '@/assets/profile.css'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/composables/useTheme'
import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatTile from '@/components/base/StatTile.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'

import { formatDate, formatLongDate } from '@/utils/formatters'
import { ROLES, ROLE_LABEL_KEYS } from '@/utils/constants'
import { ADMIN_LINKS, PROFILE_ADMIN_SHORTCUTS } from '@/constants/adminLinks'
import {
  authorRankVariantFor,
  authorRankIconFor,
  authorRankLabelFor,
} from '@/utils/authorRank'

const { t } = useI18n()

const router = useRouter()
const authStore = useAuthStore()
const { currentTheme, getThemeLabel } = useTheme()

const user = computed(() => authStore.user || {})

const avatarInitial = computed(() => {
  const name = user.value.full_name || user.value.username || '?'
  return name.charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  const role = user.value.role
  const key = ROLE_LABEL_KEYS[role]
  return key ? t(key) : (role || '')
})

const roleBadgeClass = computed(() => {
  switch (user.value.role) {
    case ROLES.ADMIN:     return 'danger'
    case ROLES.MODERATOR: return 'warning'
    case ROLES.MEMBER:
    default:              return 'info'
  }
})

const themeLabel = computed(() => getThemeLabel(currentTheme.value))

// Subset of ADMIN_LINKS that belongs on the profile page, filtered
// by the caller's capabilities. Order follows PROFILE_ADMIN_SHORTCUTS.
const profileAdminLinks = computed(() => {
  return PROFILE_ADMIN_SHORTCUTS
    .map(cap => ADMIN_LINKS.find(link => link.cap === cap))
    .filter(link => link && authStore.can(link.cap))
})

const authorRankLabel = computed(() => {
  // A missing author_rank returns '' — matching the original
  // implementation, which only fell through to
  // `author_rank_label_ar` for an UNRECOGNIZED (non-empty) key.
  // Without this guard, the shared helper would return the fallback
  // for a missing key, which changes behavior for a backend state
  // that should not normally occur but is not explicitly prevented.
  if (!user.value.author_rank) return ''
  return authorRankLabelFor(
    user.value.author_rank,
    t,
    user.value.author_rank_label_ar || '',
  )
})

const authorRankVariant = computed(() =>
  authorRankVariantFor(user.value.author_rank)
)

const authorRankIcon = computed(() =>
  authorRankIconFor(user.value.author_rank)
)

const daysUntilExpiry = computed(() => {
  if (!user.value.expires_at) return null
  const diff = new Date(user.value.expires_at) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})
</script>
