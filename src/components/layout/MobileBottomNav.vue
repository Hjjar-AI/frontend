<!-- frontend/src/components/layout/MobileBottomNav.vue -->
<template>
  <nav class="bottom-nav no-print" :aria-label="t('a11y.bottomNav')">
    <div class="bottom-nav__bar">
      <router-link
        to="/"
        class="bottom-nav__item"
        exact-active-class="bottom-nav__item--active"
      >
        <span class="bottom-nav__icon"><i class="bi bi-house-fill"></i></span>
        <span class="bottom-nav__label">{{ t('nav.home') }}</span>
      </router-link>

      <router-link to="/questions" custom v-slot="{ navigate }">
        <div
          class="bottom-nav__item"
          :class="{ 'bottom-nav__item--active': isQuestionsActive }"
          @click="navigate"
          role="link"
        >
          <span class="bottom-nav__icon"><i class="bi bi-question-circle-fill"></i></span>
          <span class="bottom-nav__label">{{ t('nav.questions') }}</span>
        </div>
      </router-link>

      <router-link to="/study" custom v-slot="{ navigate }">
        <div
          class="bottom-nav__item"
          :class="{ 'bottom-nav__item--active': isTestsActive }"
          @click="navigate"
          role="link"
        >
          <span class="bottom-nav__icon"><i class="bi bi-journal-check"></i></span>
          <span class="bottom-nav__label">{{ t('nav.studyModeShort') }}</span>
        </div>
      </router-link>

      <router-link
        to="/bookmarks"
        class="bottom-nav__item"
        active-class="bottom-nav__item--active"
      >
        <span class="bottom-nav__icon"><i class="bi bi-bookmark-heart-fill"></i></span>
        <span class="bottom-nav__label">{{ t('nav.bookmarks') }}</span>
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
            <router-link to="/manual" class="sheet__link" @click="closeSheet">
              <i class="bi bi-book"></i><span>{{ t('nav.manual') }}</span>
            </router-link>
            <router-link to="/about" class="sheet__link" @click="closeSheet">
              <i class="bi bi-info-circle"></i><span>{{ t('nav.about') }}</span>
            </router-link>
            <router-link to="/categories" class="sheet__link" @click="closeSheet">
              <i class="bi bi-folder2"></i><span>{{ t('nav.categories') }}</span>
            </router-link>
            <router-link to="/questions/review" class="sheet__link" @click="closeSheet">
              <i class="bi bi-check2-all"></i><span>{{ t('nav.review') }}</span>
            </router-link>
            <router-link to="/questions/mistakes" class="sheet__link" @click="closeSheet">
              <i class="bi bi-journal-x"></i><span>{{ t('nav.mistakes') }}</span>
            </router-link>
            <router-link to="/questions/fragile" class="sheet__link" @click="closeSheet">
              <i class="bi bi-shield-slash"></i><span>{{ t('nav.fragile') }}</span>
            </router-link>
            <router-link to="/groups" class="sheet__link" @click="closeSheet">
              <i class="bi bi-people-fill"></i><span>{{ t('nav.myGroups') }}</span>
            </router-link>
            <router-link to="/planner" class="sheet__link" @click="closeSheet">
              <i class="bi bi-calendar-check"></i><span>{{ t('nav.planner') }}</span>
            </router-link>
            <router-link to="/analytics" class="sheet__link" @click="closeSheet">
              <i class="bi bi-graph-up"></i><span>{{ t('nav.analytics') }}</span>
            </router-link>
            <router-link to="/master-exams" class="sheet__link" @click="closeSheet">
              <i class="bi bi-mortarboard"></i><span>{{ t('nav.masterExams') }}</span>
            </router-link>
            <router-link to="/history" class="sheet__link" @click="closeSheet">
              <i class="bi bi-clock-history"></i><span>{{ t('nav.history') }}</span>
            </router-link>
            <router-link to="/preferences" class="sheet__link" @click="closeSheet">
              <i class="bi bi-sliders"></i><span>{{ t('nav.settings') }}</span>
            </router-link>
          </div>

          <template v-if="authStore.can('master_exams.create')">
            <div class="sheet__divider"></div>
            <h5 class="sheet__section-title">{{ t('nav.masterExams') }}</h5>
            <div class="sheet__grid">
              <router-link to="/master-exams/new" class="sheet__link" @click="closeSheet">
                <i class="bi bi-plus-circle"></i><span>{{ t('nav.newMasterExam') }}</span>
              </router-link>
              <router-link
                v-if="authStore.can('master_exams.drafts_library')"
                to="/master-exams/drafts"
                class="sheet__link"
                @click="closeSheet"
              >
                <i class="bi bi-journal-text"></i><span>{{ t('nav.draftsLibrary') }}</span>
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

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const masterExamStore = useMasterExamStore()
const showMore = ref(false)
const { storeFocus, restoreFocus } = useFocusReturn()

const isTestsActive = computed(() =>
  ['/exam', '/study', '/master-exams'].some(p => route.path.startsWith(p))
)

const isQuestionsActive = computed(() =>
  ['/questions', '/categories'].some(p => route.path.startsWith(p))
)

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
