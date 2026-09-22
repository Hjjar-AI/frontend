// frontend/tests/unit/router/routes.test.js
//
// Route table assertions.
//
// `guards.test.js` builds its own tiny router. That leaves the real
// route table — every URL's name, meta, and props — unverified.
// The assertions below pin the shape of every route.

import { describe, it, expect } from 'vitest'
import router from '@/router'

const routes = router.getRoutes()

function findByName(name) {
  return routes.find((r) => r.name === name)
}

// Vue Router normalizes the `props` route option. A static object
// `props: { mode: 'exam' }` is stored on the record as
// `props.default` (the record can carry one prop bundle per named
// view, so a single-view route gets a `default` key). The
// alternative — a bare `props` object with no `default` — is what
// older versions of the router exposed. The helper reads whichever
// shape is present so the assertion survives a router upgrade.
function propsOf(name) {
  const record = findByName(name)
  return record?.props?.default ?? record?.props
}

describe('router — guest route', () => {
  it('/login is the only guest route', () => {
    const guestRoutes = routes.filter((r) => r.meta?.guest)
    expect(guestRoutes.map((r) => r.name)).toEqual(['Login'])
  })

  it('Login has meta.guest === true', () => {
    expect(findByName('Login').meta.guest).toBe(true)
  })

  it('Login does not require auth', () => {
    expect(findByName('Login').meta.requiresAuth).toBeUndefined()
  })
})

describe('router — requiresAuth coverage', () => {
  it('every route except Login and PrivacyPolicy requires auth', () => {
    const exempt = new Set(['Login', 'PrivacyPolicy', 'NotFound', 'ChunkLoadError'])
    const unprotected = routes
      .filter((r) => r.name && !exempt.has(r.name))
      .filter((r) => !r.meta?.requiresAuth)
      .map((r) => r.name)
    expect(unprotected).toEqual([])
  })

  it('PrivacyPolicy is public', () => {
    expect(findByName('PrivacyPolicy').meta?.requiresAuth).toBeUndefined()
  })

  it('Dashboard requires auth', () => {
    expect(findByName('Dashboard').meta.requiresAuth).toBe(true)
  })
})

describe('router — capability-gated routes', () => {
  it.each([
    ['QuestionAdd', 'questions.create'],
    ['QuestionEdit', 'questions.edit_own'],
    ['ExamSetup', 'tests.start'],
    ['TestSetup', 'tests.start'],
    ['AdminUsers', 'admin.users'],
    ['AdminSettings', 'admin.settings'],
    ['VerificationStats', 'admin.verification_stats'],
    ['DatabaseInfo', 'admin.database'],
    ['AdminImport', 'admin.database'],
    ['AdminFlags', 'admin.flags'],
    ['ActiveUsers', 'admin.active_users'],
    ['AdminTags', 'questions.manage_tags'],
    ['AdminGroups', 'groups.admin'],
    ['AdminGroupDetail', 'groups.admin'],
    ['AdminBlueprints', 'admin.blueprints'],
    ['AdminHistory', 'tests.view_all_history'],
    ['AdminPermissions', 'admin.permissions'],
    ['Analytics', 'analytics.view_all'],
    ['MasterExamCreate', 'master_exams.create'],
    ['MasterExamDrafts', 'master_exams.drafts_library'],
  ])('%s requires capability %s', (name, capability) => {
    expect(findByName(name).meta.capability).toBe(capability)
  })

  it('MasterExamEdit accepts either manage capability', () => {
    const meta = findByName('MasterExamEdit').meta
    expect(Array.isArray(meta.capability)).toBe(true)
    expect(meta.capability).toContain('master_exams.manage_own')
    expect(meta.capability).toContain('master_exams.manage_any')
  })

  it('MasterExamResults accepts either view_results capability', () => {
    const meta = findByName('MasterExamResults').meta
    expect(Array.isArray(meta.capability)).toBe(true)
    expect(meta.capability).toContain('master_exams.view_results_own')
    expect(meta.capability).toContain('master_exams.view_results_any')
  })
})

describe('router — unguarded authenticated routes', () => {
  it.each([
    'Dashboard',
    'ChangePassword',
    'Profile',
    'QuestionsList',
    'ReviewQueue',
    'WrongAnswers',
    'FragileAnswers',
    'Bookmarks',
    'ExamQuestion',
    'StudyQuestion',
    'ExamResults',
    'StudyResults',
    'About',
    'History',
    'Categories',
    'Manual',
    'StudyPlanner',
    'MyGroups',
    'MasterExamsList',
    'MasterExamAttempt',
    'MasterExamMyResult',
    'Preferences',
  ])('%s is authenticated-only', (name) => {
    const meta = findByName(name).meta
    expect(meta.requiresAuth).toBe(true)
    expect(meta.capability).toBeUndefined()
  })
})

describe('router — mode-carrying routes', () => {
  it('ExamSetup carries mode=exam', () => {
    expect(propsOf('ExamSetup')?.mode).toBe('exam')
  })

  it('TestSetup carries mode=study', () => {
    expect(propsOf('TestSetup')?.mode).toBe('study')
  })

  it('ExamResults carries mode=exam', () => {
    expect(propsOf('ExamResults')?.mode).toBe('exam')
  })

  it('StudyResults carries mode=study', () => {
    expect(propsOf('StudyResults')?.mode).toBe('study')
  })

  it('History carries mode=own', () => {
    expect(propsOf('History')?.mode).toBe('own')
  })

  it('AdminHistory carries mode=all', () => {
    expect(propsOf('AdminHistory')?.mode).toBe('all')
  })
})

describe('router — path/name correspondence', () => {
  it('every named route has a path that starts with /', () => {
    for (const r of routes) {
      if (!r.name) continue
      expect(r.path.startsWith('/')).toBe(true)
    }
  })

  it('the wildcard fallback redirects to /404', () => {
    const fallback = routes.find((r) => r.path === '/:pathMatch(.*)*')
    expect(fallback.redirect).toBe('/404')
  })

  it('the /settings alias redirects to /preferences', () => {
    const alias = routes.find((r) => r.path === '/settings')
    expect(alias.redirect).toBe('/preferences')
  })
})

describe('router — transition meta', () => {
  it('question and results routes carry a transition hint', () => {
    expect(findByName('ExamQuestion').meta.transition).toBe('slide-forward')
    expect(findByName('StudyQuestion').meta.transition).toBe('slide-forward')
    expect(findByName('ExamResults').meta.transition).toBe('slide-backward')
    expect(findByName('StudyResults').meta.transition).toBe('slide-backward')
  })
})