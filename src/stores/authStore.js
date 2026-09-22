// frontend/src/stores/authStore.js
import { defineStore } from 'pinia'
import { authService } from '@/services/authService'
import { useCrudActions } from '@/composables/useCrudActions'
import { useNotify } from '@/composables/useNotify'
import { resetAllStores } from '@/stores/resetAllStores'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'
import { clearCsrfToken } from '@/services/api/csrfTokenStore'
import { i18n } from '@/i18n'

export const useAuthStore = defineStore('auth', {
  state: () => standardState({ user: null }),

  getters: {
    ...standardGetters,

    isAuthenticated: (state) => !!state.user,

    fullName: (state) =>
      state.user?.full_name
      || state.user?.username
      || i18n.global.t('auth.guestUser'),

    role: (state) => state.user?.role || 'member',

    // ── Capability API ──────────────────────────────────────────────
    //
    // `can(cap)` is the single source of truth for what the current
    // user is allowed to do. It reads the flat capability list that
    // /auth/me/ ships on the user payload — the server does all role
    // resolution, per-user override merging, and admin bypass.
    can: (state) => (capability) => {
      if (!capability) return false
      const caps = state.user?.capabilities
      if (!Array.isArray(caps)) return false
      return caps.includes(capability)
    },

    canAny: (state) => (...capabilities) => {
      const caps = state.user?.capabilities
      if (!Array.isArray(caps) || caps.length === 0) return false
      return capabilities.some((c) => caps.includes(c))
    },

    // ── Subscription / expiry ───────────────────────────────────────
    //
    // Every expiry-derived getter below short-circuits on the
    // 'system.bypass_expiry' capability. Admin always holds it (via
    // the resolve_for_user admin short-circuit); a deployment may
    // grant it to any role or user through the permissions panel.
    //
    // The server enforces the same rule in User.is_expired and
    // User.renew_if_eligible. Keeping the client-side check in sync
    // means a user who will never be logged out does not see a
    // banner telling them their account is about to expire.

    expiresAt: (state) => state.user?.expires_at || null,

    // Convenience flag, evaluated once so the two derived getters
    // below do not repeat the array lookup.
    _bypassesExpiry: (state) => {
      const caps = state.user?.capabilities
      return Array.isArray(caps) && caps.includes('system.bypass_expiry')
    },

    daysUntilExpiry: (state) => {
      if (!state.user?.expires_at) return null
      const diff = new Date(state.user.expires_at) - new Date()
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    },


    isExpiringSoon() {
      if (this._bypassesExpiry) return false
      const days = this.daysUntilExpiry
      if (days === null) return false
      return days <= 7 && days > 0
    },

    isExpired() {
      if (this._bypassesExpiry) return false
      const days = this.daysUntilExpiry
      if (days === null) return false
      return days <= 0
    },

    mustChangePassword: (state) => !!state.user?.must_change_password,
  },

  actions: {
    setUser(user) {
      this.user = user
    },

    clearSession() {
      this.setUser(null)
      resetAllStores()
      clearCsrfToken()
    },

    async login(username, password) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => authService.login(username, password), {
        successMsgKey: 'notifications.authLoginSuccess',
        errorMsgFallbackKey: 'notifications.loginFailed',
        onSuccess: (response) => {
          this.setUser(response.user)
          clearCsrfToken()
        },
      })
    },

    async logout() {
      const { notify } = useNotify()

      try {
        await authService.logout()
      } catch (err) {
        console.warn('Logout request failed, but clearing local state:', err)
      } finally {
        this.clearSession()
        notify(i18n.global.t('notifications.authLogoutSuccess'), 'info')
      }
    },

    async restoreSession() {
      if (this.user) return true

      const { wrap } = useCrudActions(this)
      return await wrap(() => authService.me(), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.sessionRestoreFailed',
        suppressErrorToast: true,
        onSuccess: (user) => this.setUser(user),
      })
    },

    async changePassword(currentPassword, newPassword) {
      const { wrap } = useCrudActions(this)
      const result = await wrap(
        () => authService.changePassword(currentPassword, newPassword),
        {
          successMsgKey: 'notifications.authPasswordChanged',
          errorMsgFallbackKey: 'notifications.passwordChangeFailed',
        }
      )
      if (result && this.user) {
        this.user.must_change_password = false
      }
      return result
    },

    reset: makeReset({ user: null, status: 'idle', error: null }),
  },
})
