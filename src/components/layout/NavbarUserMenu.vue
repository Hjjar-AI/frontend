<!-- frontend/src/components/layout/NavbarUserMenu.vue -->
<!--
  User avatar + dropdown menu, extracted from Navbar.vue.

  The previous implementation kept the user menu in Navbar.vue and
  coordinated its open state with the two NavbarDropdown instances
  via a shared `activeDropdown` ref. Now that `useDropdown()` owns
  that coordination, the user menu becomes a self-contained
  component with the same behavior.

  ANALYTICS ENTRY
  ---------------
  A link to `/analytics` is rendered here for every authenticated
  user. Before the router's `/analytics` route was loosened from
  `analytics.view_all` to `requiresAuth`, that link lived in
  `ADMIN_LINKS` and was only visible to admins. It was moved here
  because the page has a member-facing section that every
  authenticated user can read (see `router/index.js`); the
  admin-only accordion reports on that page remain hidden by the
  `canViewAll` check inside the view.
-->
<template>
  <div ref="rootRef" class="navbar__user">
    <button
      class="navbar__user-btn"
      :aria-expanded="isOpen"
      :aria-label="t('nav.userMenu')"
      @click.stop="toggle"
    >
      <span class="navbar__avatar">{{ avatarInitial }}</span>
      <i
        class="bi bi-chevron-down navbar__user-arrow"
        :class="{ 'navbar__user-arrow--open': isOpen }"
      ></i>
    </button>

    <BasePopoverPanel
        :open="isOpen"
        panel-class="navbar__user-menu"
        @click="handleChildClick"
      >
        <div class="navbar__user-info">
          <span class="navbar__user-name">{{ authStore.fullName }}</span>
          <span class="navbar__user-role">{{ roleLabel }}</span>
        </div>
        <div class="navbar__user-divider"></div>
        <router-link to="/profile" class="nav-link">
          <i class="bi bi-person-circle"></i> {{ t('nav.profile') }}
        </router-link>
        <router-link to="/change-password" class="nav-link">
          <i class="bi bi-key"></i> {{ t('nav.changePassword') }}
        </router-link>
        <router-link to="/planner" class="nav-link">
          <i class="bi bi-calendar-check"></i> {{ t('nav.planner') }}
        </router-link>
        <router-link to="/groups" class="nav-link">
          <i class="bi bi-people-fill"></i> {{ t('nav.myGroups') }}
        </router-link>
        <router-link to="/analytics" class="nav-link">
          <i class="bi bi-graph-up"></i> {{ t('nav.analytics') }}
        </router-link>
        <router-link
          v-if="authStore.can('master_exams.create')"
          to="/master-exams/new"
          class="nav-link"
        >
          <i class="bi bi-plus-circle"></i> {{ t('nav.newMasterExam') }}
        </router-link>
        <router-link
          v-if="authStore.can('master_exams.drafts_library')"
          to="/master-exams/drafts"
          class="nav-link"
        >
          <i class="bi bi-journal-text"></i> {{ t('nav.draftsLibrary') }}
        </router-link>
        <router-link to="/history" class="nav-link">
          <i class="bi bi-clock-history"></i> {{ t('nav.history') }}
        </router-link>
        <router-link to="/preferences" class="nav-link">
          <i class="bi bi-sliders"></i> {{ t('nav.settings') }}
        </router-link>
        <div class="navbar__user-divider"></div>
        <button class="nav-link nav-link--danger" @click="handleLogout">
          <i class="bi bi-box-arrow-right"></i> {{ t('nav.logout') }}
        </button>
    </BasePopoverPanel>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useDropdown } from '@/composables/useDropdown'
import { roleLabelFor } from '@/utils/roleDisplay'
import BasePopoverPanel from '@/components/base/BasePopoverPanel.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const { isOpen, rootRef, close, toggle } = useDropdown()

const avatarInitial = computed(() => (authStore.fullName || '?')[0])

const roleLabel = computed(() =>
  roleLabelFor(authStore.user?.role, t)
)

// Close the menu on any click inside it that targets a link or
// button. The logout button is included — the handler below closes
// the menu before navigating, so the click still runs the logout.
function handleChildClick(e) {
  const target = e.target.closest('a, button')
  if (target && isOpen.value) close()
}

async function handleLogout() {
  close()
  await authStore.logout()
  router.push('/login')
}
</script>
