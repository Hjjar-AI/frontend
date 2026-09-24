<!-- frontend/src/components/layout/Navbar.vue -->
<template>
  <nav class="navbar no-print">
    <div class="navbar__shell">
      <router-link to="/" class="navbar__brand">
        <span class="navbar__brand-icon"><i class="bi bi-journal-medical"></i></span>
        <span class="navbar__brand-text">{{ t('app.name') }}</span>
      </router-link>

      <BaseIconButton
        class="navbar__toggle"
        :icon="menuOpen ? 'bi bi-x-lg' : 'bi bi-list'"
        :label="menuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
        @click="menuOpen = !menuOpen"
        :aria-expanded="menuOpen"
      />

      <div class="navbar__links" :class="{ 'navbar__links--open': menuOpen }">
        <NavbarDropdown
          :label="t('nav.content')"
          icon="bi bi-collection"
          :is-active="isContentActive"
        >
          <router-link
            v-for="link in contentLinks"
            :key="link.id"
            :to="link.to"
            class="nav-link"
          >
            <i :class="link.icon"></i> {{ t(link.labelKey) }}
            <BaseBadge
              v-if="navBadge(link.id)"
              variant="danger"
              small
              class="navbar__badge"
            >{{ navBadge(link.id) }}</BaseBadge>
          </router-link>
        </NavbarDropdown>

        <NavbarDropdown
          :label="t('nav.tests')"
          icon="bi bi-pencil-square"
          :is-active="isTestsActive"
        >
          <router-link v-for="link in testLinks" :key="link.id" :to="link.to" class="nav-link">
            <i :class="link.icon"></i> {{ t(link.labelKey) }}
            <BaseBadge
              v-if="navBadge(link.id)"
              variant="danger"
              small
              class="navbar__badge"
            >{{ navBadge(link.id) }}</BaseBadge>
          </router-link>
        </NavbarDropdown>

        <router-link
          v-for="link in topLinks"
          :key="link.id"
          :to="link.to"
          class="nav-link"
          active-class="nav-link--active"
        >
          <i :class="link.icon"></i> {{ t(link.labelKey) }}
        </router-link>

        <template v-if="canSeeAdminMenu">
          <span class="navbar__sep"></span>
          <NavbarDropdown
            :label="t('nav.admin')"
            icon="bi bi-gear"
            :is-active="isAdminActive"
          >
            <router-link
              v-for="link in visibleAdminLinks"
              :key="link.to"
              :to="link.to"
              class="nav-link"
            >
              <i :class="link.icon"></i> {{ t(link.labelKey) }}
            </router-link>
          </NavbarDropdown>
        </template>
      </div>

      <div class="navbar__actions">
        <BaseBadge
          v-if="showAdminBadge"
          variant="warning"
          small
          class="navbar__admin-badge"
          :title="t('a11y.adminMode')"
        >
          <i class="bi bi-shield-lock"></i>
        </BaseBadge>

        <BaseBadge
          v-if="streak > 0"
          variant="warning"
          class="streak-chip streak-chip--compact"
          :title="t('a11y.streakTooltip', { current: streak, longest: longestStreak })"
        >
          <span class="streak-chip__emoji">🔥</span>
          <span class="streak-chip__count">{{ streak }}</span>
        </BaseBadge>

        <NotificationBell
          v-if="authStore.can('admin.flags')"
          :count="pendingFlagCount"
          @click="router.push('/admin/flags')"
        />

        <LanguageSwitcher />
        <ThemeDropdown />

        <NavbarUserMenu />
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useFlagStore } from '@/stores/flagStore'
import { useGroupStore } from '@/stores/groupStore'
import { useWrongAnswerStore } from '@/stores/wrongAnswerStore'
import { useMasterExamStore } from '@/stores/masterExamStore'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import ThemeDropdown from '@/components/layout/ThemeDropdown.vue'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import NavbarDropdown from './NavbarDropdown.vue'
import NavbarUserMenu from './NavbarUserMenu.vue'
import { ADMIN_LINKS, ADMIN_BADGE_CAPABILITIES } from '@/constants/adminLinks'
import { navigationLinksFor, isNavigationLinkActive } from '@/constants/navigationLinks'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const flagStore = useFlagStore()
const groupStore = useGroupStore()
const wrongAnswerStore = useWrongAnswerStore()
const masterExamStore = useMasterExamStore()

const canUseLink = link => !link.capability || authStore.can(link.capability)
const contentLinks = computed(() => navigationLinksFor('desktop', 'content').filter(canUseLink))
const testLinks = computed(() => navigationLinksFor('desktop', 'tests').filter(canUseLink))
const topLinks = computed(() => navigationLinksFor('desktop', 'top').filter(canUseLink))

const menuOpen = ref(false)
const pendingFlagCount = computed(() => flagStore.pendingCount)
const streak = computed(() => groupStore.currentStreak)
const longestStreak = computed(() => groupStore.longestStreak)

// `/analytics` is intentionally NOT included here — it is a
// top-level nav destination (rendered above), not part of the admin
// dropdown. Highlighting the admin dropdown when the user is on
// `/analytics` was correct before the route was loosened; now it
// would be misleading. The top-level `/analytics` link highlights
// itself via `active-class`.
const isAdminActive = computed(() => route.path.startsWith('/admin'))

const isTestsActive = computed(() =>
  testLinks.value.some(link => isNavigationLinkActive(link, route.path))
)

const isContentActive = computed(() =>
  contentLinks.value.some(link => isNavigationLinkActive(link, route.path))
)

const visibleAdminLinks = computed(() =>
  ADMIN_LINKS.filter(link => authStore.can(link.cap))
)

const canSeeAdminMenu = computed(() => visibleAdminLinks.value.length > 0)

const showAdminBadge = computed(() =>
  authStore.canAny(...ADMIN_BADGE_CAPABILITIES)
)

function navBadge(id) {
  if (id === 'mistakes') return wrongAnswerStore.summary?.wrong_open || 0
  if (id === 'master-exams') return masterExamStore.needsAckCount || 0
  return 0
}

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

onMounted(() => {
  if (authStore.can('admin.flags')) {
    flagStore.ensureLoaded()
  }
  groupStore.fetchStreak()
  wrongAnswerStore.fetchSummary()
  masterExamStore.fetchNeedsAck()
})
</script>
