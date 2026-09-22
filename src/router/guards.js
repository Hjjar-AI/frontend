// frontend/src/router/guards.js
import { useAuthStore } from '@/stores/authStore'
import { clearCrudCache } from '@/composables/useCrudActions'

let isNavigating = null
let navTimeout = null

export function setupGuards(router) {
  // ── Progress-bar flag (nav indicator) ─────────────────────────────
  router.beforeEach((to, from, next) => {
    if (navTimeout) {
      clearTimeout(navTimeout)
      navTimeout = null
    }
    if (isNavigating !== null) isNavigating.value = true
    next()
  })

  router.afterEach(() => {
    if (navTimeout) {
      clearTimeout(navTimeout)
      navTimeout = null
    }
    navTimeout = setTimeout(() => {
      if (isNavigating !== null) isNavigating.value = false
      navTimeout = null
    }, 100)
  })

  // ── Auth / capability guard ───────────────────────────────────────
  //
  // Route meta keys understood here:
  //
  //   guest: true             — login page and similar. Redirects to
  //                              Dashboard if already authenticated.
  //   requiresAuth: true      — must have a session.
  //   capability: 'x.y'       — must hold this capability.
  //   capability: ['x', 'y']  — must hold at least one of these.
  //
  // The capability check runs after the session-restore step, so a
  // hard refresh on a capability-gated route restores the user
  // first and only then decides whether they can stay.
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // --- Guest route (login) ---
    if (to.meta.guest) {
      if (authStore.isAuthenticated) {
        return next({ name: 'Dashboard' })
      }
      return next()
    }

    // --- Auth required ---
    if (to.meta.requiresAuth) {
      if (!authStore.isAuthenticated) {
        const restored = await authStore.restoreSession()
        if (!restored) {
          return next({ name: 'Login', query: { redirect: to.fullPath } })
        }
      }

      if (
        authStore.mustChangePassword &&
        to.name !== 'ChangePassword' &&
        to.name !== 'Login'
      ) {
        return next({ name: 'ChangePassword' })
      }

      if (
        authStore.isExpired &&
        to.name !== 'Login' &&
        to.name !== 'ChangePassword'
      ) {
        await authStore.logout()
        return next({
          name: 'Login',
          query: { redirect: to.fullPath, expired: '1' },
        })
      }
    }

    // --- Capability gate ---
    //
    // If the route declares no capability meta, this block is a
    // no-op.
    //
    // `capability` may be a single string or an array of strings.
    // An array is satisfied by holding ANY of the listed
    // capabilities. This mirrors the intent of the backend's
    // HasCapability class (single capability) plus the composite
    // checks used by views like MasterExamDetailView, which accepts
    // any of {manage_own, manage_any}.
    if (to.meta.capability) {
      const required = Array.isArray(to.meta.capability)
        ? to.meta.capability
        : [to.meta.capability]

      const permitted = required.some((cap) => authStore.can(cap))
      if (!permitted) {
        // A user without the capability for this route should land
        // somewhere useful, not on a blank 404. Dashboard is the
        // safest default — every authenticated user can reach it.
        return next({ name: 'Dashboard' })
      }
    }

    next()
  })

  router.afterEach((to) => {
    if (to.name === 'Login') {
      clearCrudCache()
    }
  })
}

export function setNavigatingRef(ref) {
  isNavigating = ref
}