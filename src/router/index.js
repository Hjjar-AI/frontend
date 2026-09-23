// frontend/src/router/index.js
import { h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'
import { i18n } from '@/i18n'

export function createChunkLoadErrorComponent() {
  const iconStyle = { fontSize: '3rem', color: 'var(--color-danger)' }
  const wrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '1rem',
    textAlign: 'center',
    padding: '2rem',
  }
  const mutedStyle = { color: 'var(--color-text-muted)' }
  const buttonStyle = {
    padding: '0.6rem 1.4rem',
    borderRadius: '9999px',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: 'inherit',
  }

  return {
    name: 'ChunkLoadError',
    render() {
      const t = i18n.global.t
      return h('div', { style: wrapperStyle }, [
        h('i', { class: 'bi bi-wifi-off', style: iconStyle }),
        h('h2', null, t('errors.chunkLoad')),
        h('p', { style: mutedStyle }, t('errors.chunkLoadMessage')),
        h(
          'button',
          { style: buttonStyle, onClick: () => window.location.reload() },
          t('common.retry'),
        ),
      ])
    },
  }
}

export function lazyLoad(importFn) {
  return () =>
    importFn().catch((error) => {
      console.error('Failed to load route chunk:', error)
      return { default: createChunkLoadErrorComponent() }
    })
}

function scrollBehavior(to, _from, savedPosition) {
  if (savedPosition) {
    return savedPosition
  }

  if (to.hash) {
    return new Promise((resolve) => {
      const deadline = Date.now() + 1200
      const tryScroll = () => {
        let el = null
        try {
          el = document.querySelector(to.hash)
        } catch {
          resolve({ top: 0 })
          return
        }
        if (el) {
          resolve({ el: to.hash })
        } else if (Date.now() < deadline) {
          requestAnimationFrame(tryScroll)
        } else {
          resolve({ top: 0 })
        }
      }
      tryScroll()
    })
  }

  return { top: 0 }
}

const routes = [
  // ═══════════════════════════════════════════════════════════════════
  // Auth & public
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/login',
    name: 'Login',
    component: lazyLoad(() => import('@/features/auth/views/Login.vue')),
    meta: { guest: true },
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: lazyLoad(() => import('@/features/auth/views/ChangePassword.vue')),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: lazyLoad(() => import('@/features/profile/views/Profile.vue')),
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: lazyLoad(() => import('@/features/dashboard/views/Dashboard.vue')),
    meta: { requiresAuth: true },
  },


  {
    path: '/questions',
    name: 'QuestionsList',
    component: lazyLoad(() => import('@/features/questions/views/QuestionListPage.vue')),
    props: { mode: 'all' },
    meta: { requiresAuth: true },
  },
  {
    path: '/questions/add',
    name: 'QuestionAdd',
    component: lazyLoad(() => import('@/features/questions/views/AddView.vue')),
    meta: { requiresAuth: true, capability: 'questions.create' },
  },
  {
    path: '/questions/edit/:id',
    name: 'QuestionEdit',
    component: lazyLoad(() => import('@/features/questions/views/EditView.vue')),
    meta: { requiresAuth: true, capability: 'questions.edit_own' },
  },
  {
    path: '/questions/review',
    name: 'ReviewQueue',
    component: lazyLoad(() => import('@/features/questions/views/QuestionListPage.vue')),
    props: { mode: 'review' },
    meta: { requiresAuth: true },
  },
  {
    path: '/questions/mistakes',
    name: 'WrongAnswers',
    component: lazyLoad(() => import('@/features/questions/views/QuestionListPage.vue')),
    props: { mode: 'mistakes' },
    meta: { requiresAuth: true },
  },
  {
    path: '/questions/fragile',
    name: 'FragileAnswers',
    component: lazyLoad(() => import('@/features/questions/views/QuestionListPage.vue')),
    props: { mode: 'fragile' },
    meta: { requiresAuth: true },
  },
  {
    path: '/bookmarks',
    name: 'Bookmarks',
    component: lazyLoad(() => import('@/features/bookmarks/views/Bookmarks.vue')),
    meta: { requiresAuth: true },
  },
  {
    path: '/knowledge-map',
    name: 'KnowledgeMap',
    component: lazyLoad(() => import('@/features/knowledge/views/KnowledgeMap.vue')),
    meta: { requiresAuth: true },
  },

  // ═══════════════════════════════════════════════════════════════════
  // Test setup pages
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/exam',
    name: 'ExamSetup',
    component: lazyLoad(() => import('@/features/testCommon/TestSetupPage.vue')),
    props: { mode: 'exam' },
    meta: { requiresAuth: true, capability: 'tests.start' },
  },
  {
    path: '/study',
    name: 'TestSetup',
    component: lazyLoad(() => import('@/features/testCommon/TestSetupPage.vue')),
    props: { mode: 'study' },
    meta: { requiresAuth: true, capability: 'tests.start' },
  },
  {
    path: '/recall',
    name: 'RecallSetup',
    component: lazyLoad(() => import('@/features/testCommon/TestSetupPage.vue')),
    props: { mode: 'recall' },
    meta: { requiresAuth: true, capability: 'tests.start' },
  },


  {
    path: '/exam/question',
    name: 'ExamQuestion',
    component: lazyLoad(() => import('@/features/testCommon/TestQuestion.vue')),
    props: { mode: 'exam', isPauseSupported: true },
    meta: { requiresAuth: true, transition: 'slide-forward' },
  },
  {
    path: '/study/question',
    name: 'StudyQuestion',
    component: lazyLoad(() => import('@/features/testCommon/TestQuestion.vue')),
    props: { mode: 'study', isPauseSupported: true },
    meta: { requiresAuth: true, transition: 'slide-forward' },
  },
  {
    path: '/recall/question',
    name: 'RecallQuestion',
    component: lazyLoad(() => import('@/features/testCommon/TestQuestion.vue')),
    props: { mode: 'recall', isPauseSupported: true },
    meta: { requiresAuth: true, transition: 'slide-forward' },
  },

  // ═══════════════════════════════════════════════════════════════════
  // Test results
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/exam/results',
    name: 'ExamResults',
    component: lazyLoad(() => import('@/features/testCommon/TestResultsPage.vue')),
    props: { mode: 'exam' },
    meta: { requiresAuth: true, transition: 'slide-backward' },
  },
  {
    path: '/study/results',
    name: 'StudyResults',
    component: lazyLoad(() => import('@/features/testCommon/TestResultsPage.vue')),
    props: { mode: 'study' },
    meta: { requiresAuth: true, transition: 'slide-backward' },
  },
  {
    path: '/recall/results',
    name: 'RecallResults',
    component: lazyLoad(() => import('@/features/testCommon/TestResultsPage.vue')),
    props: { mode: 'recall' },
    meta: { requiresAuth: true, transition: 'slide-backward' },
  },

  // ═══════════════════════════════════════════════════════════════════
  // Informational
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/about',
    name: 'About',
    component: lazyLoad(() => import('@/features/about/views/About.vue')),
    meta: { requiresAuth: true },
  },
  {
    path: '/privacy',
    name: 'PrivacyPolicy',
    component: lazyLoad(() => import('@/features/legal/views/PrivacyPolicy.vue')),
  },

  // ═══════════════════════════════════════════════════════════════════
  // Admin — capability-gated
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: lazyLoad(() => import('@/features/admin/views/Users.vue')),
    meta: { requiresAuth: true, capability: 'admin.users' },
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: lazyLoad(() => import('@/features/admin/views/Settings.vue')),
    meta: { requiresAuth: true, capability: 'admin.settings' },
  },
  {
    path: '/admin/verification-stats',
    name: 'VerificationStats',
    component: lazyLoad(() => import('@/features/admin/views/VerificationStats.vue')),
    meta: { requiresAuth: true, capability: 'admin.verification_stats' },
  },
  {
    path: '/admin/database',
    name: 'DatabaseInfo',
    component: lazyLoad(() => import('@/features/admin/views/DatabaseInfo.vue')),
    meta: { requiresAuth: true, capability: 'admin.database' },
  },
  {
    path: '/admin/import',
    name: 'AdminImport',
    component: lazyLoad(() => import('@/features/admin/views/Import.vue')),
    meta: { requiresAuth: true, capability: 'admin.database' },
  },
  {
    path: '/admin/flags',
    name: 'AdminFlags',
    component: lazyLoad(() => import('@/features/admin/views/Flags.vue')),
    meta: { requiresAuth: true, capability: 'admin.flags' },
  },
  {
    path: '/admin/active-users',
    name: 'ActiveUsers',
    component: lazyLoad(() => import('@/features/admin/views/ActiveUsers.vue')),
    meta: { requiresAuth: true, capability: 'admin.active_users' },
  },
  {
    path: '/admin/tags',
    name: 'AdminTags',
    component: lazyLoad(() => import('@/features/admin/views/Tags.vue')),
    meta: { requiresAuth: true, capability: 'questions.manage_tags' },
  },
  {
    path: '/admin/groups',
    name: 'AdminGroups',
    component: lazyLoad(() => import('@/features/admin/views/Groups.vue')),
    meta: { requiresAuth: true, capability: 'groups.admin' },
  },
  {
    path: '/admin/groups/:id',
    name: 'AdminGroupDetail',
    component: lazyLoad(() => import('@/features/admin/views/GroupDetail.vue')),
    meta: { requiresAuth: true, capability: 'groups.admin' },
  },
  {
    path: '/admin/blueprints',
    name: 'AdminBlueprints',
    component: lazyLoad(() => import('@/features/admin/views/Blueprints.vue')),
    meta: { requiresAuth: true, capability: 'admin.blueprints' },
  },
  {
    path: '/admin/history',
    name: 'AdminHistory',
    component: lazyLoad(() => import('@/features/history/views/History.vue')),
    props: { mode: 'all' },
    meta: { requiresAuth: true, capability: 'tests.view_all_history' },
  },
  {
    path: '/admin/permissions',
    name: 'AdminPermissions',
    component: lazyLoad(() => import('@/features/admin/views/Permissions.vue')),
    meta: { requiresAuth: true, capability: 'admin.permissions' },
  },

  // ═══════════════════════════════════════════════════════════════════
  // Analytics
  //
  // Reachable by every authenticated user. The page renders two
  // sections internally:
  //   • a member section (category mastery + streak history) that
  //     every authenticated user can read — the backend endpoints
  //     behind it are gated by IsAuthenticated only;
  //   • an admin section (five accordion reports) gated by the
  //     'analytics.view_all' capability via `v-if="canViewAll"` in
  //     Analytics.vue.
  //
  // Loosening this route's meta to requiresAuth-only restores the
  // member-facing half of the page, which was previously
  // unreachable because the stricter capability gate was applied
  // here. The admin half remains protected inside the view.
  //
  // DISCOVERABILITY: the top-level nav link lives in Navbar.vue
  // (desktop) and MobileBottomNav.vue (mobile sheet).
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/analytics',
    name: 'Analytics',
    component: lazyLoad(() => import('@/features/analytics/views/Analytics.vue')),
    meta: { requiresAuth: true },
  },

  // ═══════════════════════════════════════════════════════════════════
  // User preferences, history, categories, manual
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/preferences',
    name: 'Preferences',
    component: lazyLoad(() => import('@/features/preferences/views/Preferences.vue')),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    redirect: '/preferences',
  },
  {
    path: '/history',
    name: 'History',
    component: lazyLoad(() => import('@/features/history/views/History.vue')),
    props: { mode: 'own' },
    meta: { requiresAuth: true },
  },
  {
    path: '/categories',
    name: 'Categories',
    component: lazyLoad(() => import('@/features/categories/views/Categories.vue')),
    meta: { requiresAuth: true },
  },
  {
    path: '/manual',
    name: 'Manual',
    component: lazyLoad(() => import('@/features/manual/views/Manual.vue')),
    meta: { requiresAuth: true },
  },

  // ═══════════════════════════════════════════════════════════════════
  // Feature routes
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/planner',
    name: 'StudyPlanner',
    component: lazyLoad(() => import('@/features/planner/views/StudyPlanner.vue')),
    meta: { requiresAuth: true },
  },
  {
    path: '/groups',
    name: 'MyGroups',
    component: lazyLoad(() => import('@/features/groups/views/MyGroups.vue')),
    meta: { requiresAuth: true },
  },

  // ═══════════════════════════════════════════════════════════════════
  // Master exams
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/master-exams',
    name: 'MasterExamsList',
    component: lazyLoad(() => import('@/features/masterExams/views/MasterExamList.vue')),
    meta: { requiresAuth: true },
  },
  {
    path: '/master-exams/new',
    name: 'MasterExamCreate',
    component: lazyLoad(() => import('@/features/masterExams/views/MasterExamEditor.vue')),
    meta: { requiresAuth: true, capability: 'master_exams.create' },
  },
  {
    path: '/master-exams/drafts',
    name: 'MasterExamDrafts',
    component: lazyLoad(() => import('@/features/masterExams/views/MasterExamDrafts.vue')),
    meta: { requiresAuth: true, capability: 'master_exams.drafts_library' },
  },
  {
    path: '/master-exams/:id/edit',
    name: 'MasterExamEdit',
    component: lazyLoad(() => import('@/features/masterExams/views/MasterExamEditor.vue')),
    props: true,
    meta: {
      requiresAuth: true,
      capability: ['master_exams.manage_own', 'master_exams.manage_any'],
    },
  },
  {
    path: '/master-exams/:id/attempt',
    name: 'MasterExamAttempt',
    component: lazyLoad(() => import('@/features/masterExams/views/MasterExamRunner.vue')),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/master-exams/:id/result',
    name: 'MasterExamMyResult',
    component: lazyLoad(() => import('@/features/masterExams/views/MasterExamMyResult.vue')),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/master-exams/:id/results',
    name: 'MasterExamResults',
    component: lazyLoad(() => import('@/features/masterExams/views/MasterExamResults.vue')),
    props: true,
    meta: {
      requiresAuth: true,
      capability: [
        'master_exams.view_results_own',
        'master_exams.view_results_any',
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 404
  // ═══════════════════════════════════════════════════════════════════
  {
    path: '/404',
    name: 'NotFound',
    component: lazyLoad(() => import('@/features/errors/NotFound.vue')),
  },
  { path: '/:pathMatch(.*)*', redirect: '/404' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior,
})

setupGuards(router)

export default router
