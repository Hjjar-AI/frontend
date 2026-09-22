// frontend/tests/unit/router/guards.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

import { setupGuards } from '@/router/guards'
import { useAuthStore } from '@/stores/authStore'

// Build a minimal router with the shape the guards actually read:
// routes with `meta.guest`, `meta.requiresAuth`, and `meta.capability`.
// Using a small dedicated route table (rather than importing the
// production one) keeps this test independent of every feature file
// and every store the production routes would pull in.
function buildTestRouter() {
  const routes = [
    { path: '/login', name: 'Login', component: { template: '<div />' }, meta: { guest: true } },
    { path: '/change-password', name: 'ChangePassword', component: { template: '<div />' }, meta: { requiresAuth: true } },
    { path: '/', name: 'Dashboard', component: { template: '<div />' }, meta: { requiresAuth: true } },
    { path: '/public', name: 'Public', component: { template: '<div />' } },
    {
      path: '/admin/users',
      name: 'AdminUsers',
      component: { template: '<div />' },
      meta: { requiresAuth: true, capability: 'admin.users' },
    },
    {
      path: '/admin/blueprints',
      name: 'AdminBlueprints',
      component: { template: '<div />' },
      meta: { requiresAuth: true, capability: 'admin.blueprints' },
    },
    {
      path: '/master-exams/:id/edit',
      name: 'MasterExamEdit',
      component: { template: '<div />' },
      meta: {
        requiresAuth: true,
        capability: ['master_exams.manage_own', 'master_exams.manage_any'],
      },
    },
  ]
  const router = createRouter({ history: createMemoryHistory(), routes })
  setupGuards(router)
  return router
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
})

describe('router guards — guest route', () => {
  it('lets an unauthenticated caller reach /login', async () => {
    const router = buildTestRouter()
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('redirects an authenticated caller away from /login to Dashboard', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = { id: 1, capabilities: [] }
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })
})

describe('router guards — requiresAuth', () => {
  it('redirects an unauthenticated caller to /login with a redirect query', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'restoreSession').mockResolvedValue(false)

    await router.push('/admin/users')
    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.redirect).toBe('/admin/users')
  })

  it('allows a caller whose session restores successfully', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'restoreSession').mockImplementation(async () => {
      authStore.user = { id: 1, capabilities: ['admin.users'] }
      return true
    })

    await router.push('/admin/users')
    expect(router.currentRoute.value.name).toBe('AdminUsers')
  })

  it('routes a must-change-password caller to ChangePassword', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = { id: 1, must_change_password: true, capabilities: [] }

    await router.push('/')
    expect(router.currentRoute.value.name).toBe('ChangePassword')
  })

  it('does not redirect a must-change-password caller already on ChangePassword', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = { id: 1, must_change_password: true, capabilities: [] }

    await router.push('/change-password')
    expect(router.currentRoute.value.name).toBe('ChangePassword')
  })

  it('logs out and redirects an expired caller to /login', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = {
      id: 1,
      capabilities: [],
      expires_at: '2020-01-01T00:00:00Z',
    }
    vi.spyOn(authStore, 'logout').mockImplementation(async () => {
      authStore.user = null
    })

    await router.push('/')
    expect(authStore.logout).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.expired).toBe('1')
  })
})

describe('router guards — capability gate', () => {
  it('redirects a user without the capability to Dashboard', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = { id: 1, capabilities: ['something.else'] }

    await router.push('/admin/users')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('allows a user holding the exact capability', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = { id: 1, capabilities: ['admin.users'] }

    await router.push('/admin/users')
    expect(router.currentRoute.value.name).toBe('AdminUsers')
  })

  it('passes an array meta when the caller holds any member', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = { id: 1, capabilities: ['master_exams.manage_own'] }

    await router.push('/master-exams/3/edit')
    expect(router.currentRoute.value.name).toBe('MasterExamEdit')
  })

  it('passes an array meta when the caller holds a different member', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = { id: 1, capabilities: ['master_exams.manage_any'] }

    await router.push('/master-exams/3/edit')
    expect(router.currentRoute.value.name).toBe('MasterExamEdit')
  })

  it('rejects an array meta when the caller holds none of the members', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = { id: 1, capabilities: ['admin.users'] }

    await router.push('/master-exams/3/edit')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('allows a route with no capability meta for any authenticated user', async () => {
    const router = buildTestRouter()
    const authStore = useAuthStore()
    authStore.user = { id: 1, capabilities: [] }

    await router.push('/')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('leaves a public route with no auth or capability meta alone', async () => {
    const router = buildTestRouter()
    await router.push('/public')
    expect(router.currentRoute.value.name).toBe('Public')
  })
})