import { defineStore } from 'pinia'
import { permissionService } from '@/services/permissionService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

function normalizeRoles(roles = {}) {
  return Object.fromEntries(
    Object.entries(roles).map(([role, capabilities]) => [role, [...(capabilities || [])].sort()]),
  )
}

export const usePermissionStore = defineStore('permissions', {
  state: () =>
    standardState({
      capabilityCatalog: [],
      capabilityGroups: [],
      roleCapabilities: {},
      userCapabilities: {},
    }),

  getters: {
    ...standardGetters,
  },

  actions: {
    async fetchCatalog() {
      return await useCrudActions(this).wrap(() => permissionService.listRoles(), {
        errorMsgFallbackKey: 'admin.permissions.loadRolesFailed',
        suppressErrorToast: true,
        onSuccess: (data) => {
          this.capabilityCatalog = data?.capabilities || []
          this.capabilityGroups = data?.groups || []
          this.roleCapabilities = normalizeRoles(data?.roles)
        },
      })
    },

    async updateRole(role, capabilities) {
      return await useCrudActions(this).wrap(
        () => permissionService.updateRole(role, capabilities),
        {
          errorMsgFallbackKey: 'admin.permissions.saveFailed',
          suppressErrorToast: true,
          onSuccess: () => {
            this.roleCapabilities = {
              ...this.roleCapabilities,
              [role]: [...capabilities].sort(),
            }
          },
        },
      )
    },

    async fetchUserCapabilities(userId) {
      return await useCrudActions(this).wrap(() => permissionService.getUserCapabilities(userId), {
        errorMsgFallbackKey: 'admin.permissions.loadUserFailed',
        suppressErrorToast: true,
        onSuccess: (data) => {
          this.userCapabilities = { ...this.userCapabilities, [userId]: data }
        },
      })
    },

    async updateUserCapabilities(userId, overrides) {
      return await useCrudActions(this).wrap(
        () => permissionService.updateUserCapabilities(userId, overrides),
        {
          errorMsgFallbackKey: 'admin.permissions.saveFailed',
          suppressErrorToast: true,
          onSuccess: (data) => {
            this.userCapabilities = {
              ...this.userCapabilities,
              [userId]: data || {
                ...(this.userCapabilities[userId] || {}),
                overrides: { ...overrides },
              },
            }
          },
        },
      )
    },

    reset: makeReset({
      capabilityCatalog: [],
      capabilityGroups: [],
      roleCapabilities: {},
      userCapabilities: {},
      status: 'idle',
      error: null,
    }),
  },
})
