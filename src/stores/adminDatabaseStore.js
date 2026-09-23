// frontend/src/stores/adminDatabaseStore.js
import { defineStore } from 'pinia'
import { adminService } from '@/services/adminService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useAdminDatabaseStore = defineStore('adminDatabase', {
  state: () => standardState({ databaseInfo: null, backups: [] }),
  getters: {
    ...standardGetters,
  },
  actions: {
    async fetchDatabaseInfo() {
      return await useCrudActions(this).wrap(() => adminService.getDatabaseInfo(), {
        errorMsgFallbackKey: 'notifications.dbInfoLoadFailed',
        onSuccess: (info) => {
          this.databaseInfo = info
        },
      })
    },

    async createBackup() {
      return await useCrudActions(this).wrap(() => adminService.createBackup(), {
        successMsgKey: 'notifications.backupCreated',
        errorMsgFallbackKey: 'notifications.backupCreateFailed',
      })
    },

    async fetchBackups() {
      return await useCrudActions(this).wrap(() => adminService.listBackups(), {
        errorMsgFallbackKey: 'notifications.backupsLoadFailed',
        onSuccess: (res) => {
          this.backups = res.items || []
        },
      })
    },

    async restoreBackup(name, adminPassword) {
      return await useCrudActions(this).wrap(
        () => adminService.restoreBackup(name, adminPassword),
        {
          successMsgKey: 'notifications.backupRestored',
          errorMsgFallbackKey: 'notifications.backupRestoreFailed',
        },
      )
    },

    async clearDatabase(adminPassword) {
      return await useCrudActions(this).wrap(() => adminService.clearDatabase(adminPassword), {
        successMsgKey: 'notifications.databaseCleared',
        errorMsgFallbackKey: 'notifications.databaseClearFailed',
      })
    },

    async importDatabase(file) {
      return await useCrudActions(this).wrap(() => adminService.importDatabase(file), {
        errorMsgFallbackKey: 'admin.import.failed',
        suppressErrorToast: true,
      })
    },

    async importTelegram(file) {
      return await useCrudActions(this).wrap(() => adminService.importTelegram(file), {
        errorMsgFallbackKey: 'admin.import.failed',
        suppressErrorToast: true,
      })
    },

    async importState(file, mode = 'merge', options = {}) {
      return await useCrudActions(this).wrap(() => adminService.importState(file, mode, options), {
        errorMsgFallbackKey: 'admin.import.stateFailed',
        suppressErrorToast: true,
      })
    },

    exportStateUrl(includeImages = true, verifiedOnly = false) {
      return adminService.exportStateUrl(includeImages, verifiedOnly)
    },

    exportState(includeImages = true, verifiedOnly = false) {
      return adminService.exportState(includeImages, verifiedOnly)
    },

    exportUrl(format, options = {}) {
      return adminService.exportUrl(format, options)
    },

    exportPdf(options = {}, requestOptions = {}) {
      return adminService.exportPdf(options, requestOptions)
    },

    reset: makeReset({ databaseInfo: null, backups: [], status: 'idle', error: null }),
  },
})
