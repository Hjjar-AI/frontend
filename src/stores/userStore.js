// frontend/src/stores/userStore.js
import { defineStore } from 'pinia'
import { adminService } from '@/services/adminService'
import { useCrudActions } from '@/composables/useCrudActions'
import { useDialog } from '@/composables/useDialog'
import { useNotify } from '@/composables/useNotify'
import { i18n } from '@/i18n'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useUserStore = defineStore('adminUsers', {
  state: () =>
    standardState({
      byId: {},
      ids: [],
      currentItem: null,
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
    }),
  getters: {
    ...standardGetters,
    items: (state) => state.ids.map((id) => state.byId[id]),
  },
  actions: {
    async fetchList(params = {}) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => adminService.listUsers(params), {
        onSuccess: (response) => {
          const items = response.items || []
          const newById = { ...this.byId }
          for (const item of items) newById[item.id] = { ...newById[item.id], ...item }
          this.byId = newById
          this.ids = items.map((i) => i.id)
          if (response.total !== undefined) {
            this.pagination = {
              page: response.page || 1,
              per_page: response.per_page || 20,
              total: response.total || 0,
              total_pages: response.total_pages || 1,
            }
          }
        },
        errorMsgFallbackKey: 'notifications.usersLoadFailed',
      })
    },

    async create(data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => adminService.createUser(data), {
        successMsgKey: 'notifications.userCreated',
        onSuccess: (user) => {
          const newById = { ...this.byId }
          newById[user.id] = { ...(newById[user.id] || {}), ...user }
          this.byId = newById
          this.ids = [user.id, ...this.ids]
          this.pagination.total += 1
        },
        errorMsgFallbackKey: 'notifications.userCreateFailed',
      })
    },

    async update(id, data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => adminService.updateUser(id, data), {
        successMsgKey: 'notifications.userUpdated',
        onSuccess: (user) => {
          const newById = { ...this.byId }
          newById[id] = { ...(newById[id] || {}), ...user }
          this.byId = newById
          if (this.currentItem?.id === id) {
            this.currentItem = { ...this.currentItem, ...user }
          }
        },
        errorMsgFallbackKey: 'notifications.userUpdateFailed',
      })
    },

    async remove(id, adminPassword) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => adminService.deleteUser(id, adminPassword), {
        successMsgKey: 'notifications.userDeleted',
        onSuccess: () => {
          const newById = { ...this.byId }
          delete newById[id]
          this.byId = newById
          this.ids = this.ids.filter((i) => i !== id)
          this.pagination.total = Math.max(0, this.pagination.total - 1)
        },
        errorMsgFallbackKey: 'notifications.userDeleteFailed',
      })
    },

    // ────────────────────────────────────────────────────────────────
    // toggleActive (with silent option, second-review item 5, part 1/2)
    //
    // The previous signature was `toggleActive(id, adminPassword)`
    // and it always emitted a per-user success toast. That is the
    // right behaviour for a single click from the user card. It is
    // the WRONG behaviour for a bulk operation: `Users.vue`'s
    // `bulkToggle()` loops over `selectedIds` and calls this method
    // once per id, which produced N individual toasts followed by a
    // summary toast — N+1 notifications for one admin action.
    //
    // The new `options.silent` flag lets a bulk caller suppress the
    // per-user toast so its own summary can be the single
    // notification for the operation. The default is `false`, which
    // preserves the current single-user behaviour with no change
    // required from existing callers (`confirmToggle` in this same
    // file, and any future inline toggle).
    //
    // The `silent` flag only suppresses the SUCCESS toast. On error
    // `useCrudActions` still fires its own error toast — an admin
    // who is toggling twenty users needs to know immediately which
    // one failed, not just see a count at the end.
    // ────────────────────────────────────────────────────────────────
    async toggleActive(id, adminPassword, options = {}) {
      const { silent = false } = options
      const { wrap } = useCrudActions(this)
      return await wrap(() => adminService.toggleUser(id, adminPassword), {
        onSuccess: (res) => {
          const user = this.byId[id]
          const nowActive =
            typeof res?.is_active === 'boolean' ? res.is_active : user ? !user.is_active : true
          if (user) user.is_active = nowActive
          if (!silent) {
            const key = nowActive ? 'notifications.userActivated' : 'notifications.userDeactivated'
            useNotify().notify(i18n.global.t(key), 'success')
          }
        },
        errorMsgFallbackKey: 'notifications.userToggleFailed',
      })
    },

    async resetPassword(id, adminPassword, newPassword) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => adminService.resetPasswordWithAdmin(id, adminPassword, newPassword), {
        // Caller (Users.vue) shows the temp_password inline before
        // toasting; no auto toast here to avoid a duplicate.
        errorMsgFallbackKey: 'notifications.userResetPasswordFailed',
      })
    },

    async confirmDelete(user) {
      const { confirm, prompt } = useDialog()

      const ok = await confirm(
        i18n.global.t('admin.users.confirmDelete', { username: user.username }),
      )
      if (!ok) return false

      // `prompt` resolves to the input string, or null if the user
      // cancelled. An empty string is also treated as a cancellation
      // — the backend rejects an empty password with 403, and
      // surfacing a distinct "you didn't type anything" state adds no
      // value over aborting.
      const adminPassword = await prompt(i18n.global.t('admin.users.confirmDeletePassword'), '')
      if (!adminPassword) return false

      const result = await this.remove(user.id, adminPassword)
      return result !== false && result !== null
    },

    async confirmToggle(user) {
      const { confirm, prompt } = useDialog()
      const key = user.is_active ? 'admin.users.confirmToggleOff' : 'admin.users.confirmToggleOn'
      const ok = await confirm(i18n.global.t(key, { username: user.username }))
      if (!ok) return false

      const adminPassword = await prompt(
        i18n.global.t('admin.users.formAdminPasswordPlaceholder'),
        '',
      )
      if (!adminPassword) return false

      // Single-user path: the per-user toast fires (silent defaults
      // to false), matching the previous behaviour exactly.
      const result = await this.toggleActive(user.id, adminPassword)
      return result !== false && result !== null
    },

    reset: makeReset({
      byId: {},
      ids: [],
      currentItem: null,
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
      status: 'idle',
      error: null,
    }),
  },
})