<!-- frontend/src/components/layout/MobileBottomNav.vue -->
<template>
  <nav class="bottom-nav no-print" :aria-label="t('a11y.bottomNav')">
    <div class="bottom-nav__bar">
      <router-link
        v-for="link in bottomLinks"
        :key="link.id"
        :to="link.to"
        class="bottom-nav__item"
        :class="{ 'bottom-nav__item--active': isLinkActive(link) }"
      >
        <span class="bottom-nav__icon"><i :class="link.icon"></i></span>
        <span class="bottom-nav__label">{{ t(link.shortLabelKey || link.labelKey) }}</span>
      </router-link>

      <button class="bottom-nav__item" @click="openSheet" :aria-label="t('nav.more')">
        <span class="bottom-nav__icon"><i class="bi bi-three-dots"></i></span>
        <span class="bottom-nav__label">{{ t('nav.more') }}</span>
        <span
          v-if="masterExamStore.needsAckCount > 0"
          class="notification-bell__badge bottom-nav__badge"
        >{{ masterExamStore.needsAckCount > 9 ? '9+' : masterExamStore.needsAckCount }}</span>
      </button>
    </div>
  </nav>

  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showMore" class="sheet-overlay" @click.self="closeSheet">
        <div class="sheet">
          <div class="sheet__handle"></div>
          <h4 class="sheet__title">{{ t('nav.more') }}</h4>
          <div class="sheet__grid">
            <router-link
              v-for="link in generalSheetLinks"
              :key="link.id"
              :to="link.to"
              class="sheet__link"
              @click="closeSheet"
            >
              <i :class="link.icon"></i><span>{{ t(link.labelKey) }}</span>
            </router-link>
          </div>

          <template v-if="masterSheetLinks.length">
            <div class="sheet__divider"></div>
            <h5 class="sheet__section-title">{{ t('nav.masterExams') }}</h5>
            <div class="sheet__grid">
              <router-link
                v-for="link in masterSheetLinks"
                :key="link.id"
                :to="link.to"
                class="sheet__link"
                @click="closeSheet"
              >
                <i :class="link.icon"></i><span>{{ t(link.labelKey) }}</span>
              </router-link>
            </div>
          </template>

          <!--
            Admin section. Iterates the shared ADMIN_LINKS registry
            (constants/adminLinks.js). Previously this section
            hard-coded its own list, which had already drifted from
            the desktop navbar — four admin pages reachable on
            desktop were not reachable from the mobile sheet. The
            list is now the single source of truth.

            `/analytics` is deliberately NOT in ADMIN_LINKS — it is
            a member-reachable page (see the router comment) and is
            rendered above in the general sheet grid.
          -->
          <template v-if="visibleAdminLinks.length > 0">
            <div class="sheet__divider"></div>
            <h5 class="sheet__section-title">{{ t('nav.admin') }}</h5>
            <div class="sheet__grid">
              <router-link
                v-for="link in visibleAdminLinks"
                :key="link.to"
                :to="link.to"
                class="sheet__link"
                @click="closeSheet"
              >
                <i :class="link.icon"></i><span>{{ t(link.labelKey) }}</span>
              </router-link>
            </div>
          </template>

          <div class="sheet__divider"></div>
          <button class="sheet__logout" @click="handleLogout">
            <i class="bi bi-box-arrow-right"></i> {{ t('nav.logout') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useMasterExamStore } from '@/stores/masterExamStore'
import { useFocusReturn } from '@/composables/useFocusReturn'
import { ADMIN_LINKS } from '@/constants/adminLinks'
import { navigationLinksFor, isNavigationLinkActive } from '@/constants/navigationLinks'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const masterExamStore = useMasterExamStore()
const showMore = ref(false)
const { storeFocus, restoreFocus } = useFocusReturn()

const canUseLink = link => !link.capability || authStore.can(link.capability)
const bottomLinks = computed(() => navigationLinksFor('bottomNav').filter(canUseLink))
const generalSheetLinks = computed(() => navigationLinksFor('moreSheet', 'general').filter(canUseLink))
const masterSheetLinks = computed(() => navigationLinksFor('moreSheet', 'master').filter(canUseLink))

const isLinkActive = link => isNavigationLinkActive(link, route.path)

// Same registry the desktop navbar uses. Iterating it fixes the
// drift that had made four admin pages unreachable on mobile.
const visibleAdminLinks = computed(() =>
  ADMIN_LINKS.filter(link => authStore.can(link.cap))
)

function openSheet() {
  storeFocus()
  showMore.value = true
}

function closeSheet() {
  showMore.value = false
  restoreFocus()
}

async function handleLogout() {
  closeSheet()
  await authStore.logout()
  router.push('/login')
}
</script>
