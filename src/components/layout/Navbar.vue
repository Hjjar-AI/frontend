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
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      />

      <div class="navbar__links" :class="{ 'navbar__links--open': menuOpen }">
        <router-link
          v-for="link in coreLinks"
          :key="link.id"
          :to="link.to"
          class="nav-link navbar__core-link"
          active-class="nav-link--active"
        >
          <i :class="link.icon"></i> {{ t(link.labelKey) }}
        </router-link>

        <NavbarDropdown
          :label="t('nav.more')"
          icon="bi bi-grid"
          :is-active="isMoreActive"
        >
          <router-link
            v-for="link in moreLinks"
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
import { useWrongAnswerStore } from '@/stores/wrongAnswerStore'
import { useMasterExamStore } from '@/stores/masterExamStore'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import ThemeDropdown from '@/components/layout/ThemeDropdown.vue'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import NavbarDropdown from './NavbarDropdown.vue'
import NavbarUserMenu from './NavbarUserMenu.vue'
import { ADMIN_LINKS } from '@/constants/adminLinks'
import { NAVIGATION_LINKS, isNavigationLinkActive } from '@/constants/navigationLinks'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const flagStore = useFlagStore()
const wrongAnswerStore = useWrongAnswerStore()
const masterExamStore = useMasterExamStore()

const canUseLink = link => !link.capability || authStore.can(link.capability)
const CORE_LINK_IDS = new Set(['questions', 'study', 'bookmarks', 'analytics'])
const coreLinks = computed(() =>
  NAVIGATION_LINKS.filter(link => CORE_LINK_IDS.has(link.id)).filter(canUseLink),
)
const moreLinks = computed(() =>
  NAVIGATION_LINKS.filter(link =>
    !CORE_LINK_IDS.has(link.id) &&
    link.id !== 'home' &&
    link.id !== 'preferences' &&
    (link.desktop || link.moreSheet),
  ).filter(canUseLink),
)

const menuOpen = ref(false)
const pendingFlagCount = computed(() => flagStore.pendingCount)

// `/analytics` is intentionally NOT included here — it is a
// top-level nav destination (rendered above), not part of the admin
// dropdown. Highlighting the admin dropdown when the user is on
// `/analytics` was correct before the route was loosened; now it
// would be misleading. The top-level `/analytics` link highlights
// itself via `active-class`.
const isAdminActive = computed(() => route.path.startsWith('/admin'))

const isMoreActive = computed(() =>
  moreLinks.value.some(link => isNavigationLinkActive(link, route.path))
)

const visibleAdminLinks = computed(() =>
  ADMIN_LINKS.filter(link => authStore.can(link.cap))
)

const canSeeAdminMenu = computed(() => visibleAdminLinks.value.length > 0)

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
  wrongAnswerStore.fetchSummary()
  masterExamStore.fetchNeedsAck()
})
</script>
