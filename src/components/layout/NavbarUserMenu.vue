<!-- frontend/src/components/layout/NavbarUserMenu.vue -->
<!--
  User avatar + dropdown menu, extracted from Navbar.vue.

  The previous implementation kept the user menu in Navbar.vue and
  coordinated its open state with the two NavbarDropdown instances
  via a shared `activeDropdown` ref. Now that `useDropdown()` owns
  that coordination, the user menu becomes a self-contained
  component with the same behavior.

  This menu is intentionally account-only. Product destinations live
  in the primary navbar menu so navigation has one source of truth.
-->
<template>
  <div ref="rootRef" class="navbar__user">
    <BaseButton
      variant="ghost"
      size="small"
      raw-content
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
    </BaseButton>

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
        <router-link to="/preferences" class="nav-link">
          <i class="bi bi-sliders"></i> {{ t('nav.settings') }}
        </router-link>
        <div class="navbar__user-divider"></div>
        <BaseButton variant="ghost" size="small" raw-content class="nav-link nav-link--danger" @click="handleLogout">
          <i class="bi bi-box-arrow-right"></i> {{ t('nav.logout') }}
        </BaseButton>
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
import BaseButton from '@/components/base/BaseButton.vue'

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
