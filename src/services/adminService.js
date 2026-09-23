// frontend/src/services/adminService.js
import { apiClient } from '@/services/api/client'
import { API_BASE, ENDPOINTS } from '@/services/api/endpoints'

export const adminService = {
  // ── Users ───────────────────────────────────────────────────────
  async listUsers(params = {}) {
    return apiClient.get(ENDPOINTS.ADMIN.USERS, { params })
  },
  async getUser(id) {
    return apiClient.get(ENDPOINTS.ADMIN.USER(id))
  },
  async createUser(data) {
    return apiClient.post(ENDPOINTS.ADMIN.USERS, data)
  },
  async updateUser(id, data) {
    return apiClient.put(ENDPOINTS.ADMIN.USER(id), data)
  },

  async toggleUser(id, adminPassword) {
    return apiClient.post(ENDPOINTS.ADMIN.USER_TOGGLE(id), {
      admin_password: adminPassword,
    })
  },
  async resetPasswordWithAdmin(id, adminPassword, newPassword) {
    return apiClient.post(ENDPOINTS.ADMIN.USER_RESET_PASSWORD(id), {
      admin_password: adminPassword,
      new_password: newPassword,
    })
  },

  async deleteUser(id, adminPassword) {
    return apiClient.delete(ENDPOINTS.ADMIN.USER(id), {
      data: { admin_password: adminPassword },
    })
  },

  // ── Settings ────────────────────────────────────────────────────
  async getSettings() {
    return apiClient.get(ENDPOINTS.ADMIN.SETTINGS)
  },
  async updateSettings(data) {
    return apiClient.post(ENDPOINTS.ADMIN.SETTINGS, data)
  },

  // ── Analytics / stats ───────────────────────────────────────────
  async getVerificationStats() {
    return apiClient.get(ENDPOINTS.ADMIN.VERIFICATION_STATS)
  },

  // ── Database ────────────────────────────────────────────────────
  async getDatabaseInfo() {
    return apiClient.get(ENDPOINTS.DATABASE.INFO)
  },
  async createBackup() {
    return apiClient.post(ENDPOINTS.DATABASE.BACKUP)
  },
  async listBackups() {
    return apiClient.get(ENDPOINTS.DATABASE.BACKUPS)
  },
  async restoreBackup(backupName, adminPassword) {
    return apiClient.post(ENDPOINTS.DATABASE.RESTORE, {
      backup_name: backupName,
      admin_password: adminPassword,
    })
  },
  async clearDatabase(adminPassword) {
    return apiClient.post(ENDPOINTS.DATABASE.CLEAR, {
      admin_password: adminPassword,
    })
  },
  async importDatabase(file) {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(ENDPOINTS.DATABASE.IMPORT, formData)
  },
  async importTelegram(file) {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(ENDPOINTS.DATABASE.IMPORT_TELEGRAM, formData)
  },

  // ── Portable question-bank package ─────────────────────────────
  //
  // exportStateUrl returns a URL string rather than performing the
  // download. The endpoint responds with a FileResponse, which
  // apiClient would try to parse as JSON; issuing the request as a
  // direct browser navigation lets the browser handle the file
  // download natively and avoids buffering a potentially large
  // body in memory.
  //
  // `API_BASE` is already trailing-slash-normalised in endpoints.js,
  // so this no longer carries its own copy of the strip. A deploy
  // that sets `VITE_API_BASE_URL` with a trailing slash no longer
  // produces a `//` between the base and the route.
  exportStateUrl(includeImages = true, verifiedOnly = false, format = 'json', filters = {}) {
    const params = new URLSearchParams(filters)
    if (!includeImages) params.set('include_images', 'false')
    if (verifiedOnly) params.set('verified_only', 'true')
    if (format === 'xlsx') params.set('format', 'xlsx')
    const qs = params.toString()
    return `${API_BASE}${ENDPOINTS.DATABASE.EXPORT_STATE}${qs ? '?' + qs : ''}`
  },

  async exportState(includeImages = true, verifiedOnly = false, format = 'json', filters = {}) {
    const params = { ...filters }
    if (!includeImages) params.include_images = 'false'
    if (verifiedOnly) params.verified_only = 'true'
    if (format === 'xlsx') params.format = 'xlsx'
    return apiClient.get(ENDPOINTS.DATABASE.EXPORT_STATE, {
      params,
      responseType: 'blob',
      rawResponse: true,
    })
  },

  exportUrl(format, { verifiedOnly = false } = {}) {
    const endpoint = verifiedOnly
      ? ENDPOINTS.DATABASE.EXPORT_VERIFIED(format)
      : ENDPOINTS.DATABASE.EXPORT(format)
    return `${API_BASE}${endpoint}`
  },

  async exportPdf(options = {}, { verifiedOnly = false } = {}) {
    const endpoint = verifiedOnly
      ? ENDPOINTS.DATABASE.EXPORT_VERIFIED('pdf')
      : ENDPOINTS.DATABASE.EXPORT('pdf')
    return apiClient.post(endpoint, options, {
      responseType: 'blob',
      rawResponse: true,
    })
  },

  async importState(file, mode = 'merge', opts = {}) {
    const {
      dryRun = false,
      analyze = false,
      mapping = null,
      adminPassword = '',
      conflictStrategy = null,
      conflictResolutions = null,
    } = opts

    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', mode)
    formData.append('dry_run', dryRun ? 'true' : 'false')
    formData.append('analyze', analyze ? 'true' : 'false')

    if (mapping && Object.keys(mapping).length > 0) {
      formData.append('mapping', JSON.stringify(mapping))
    }
    if (adminPassword) {
      formData.append('admin_password', adminPassword)
    }
    if (conflictStrategy) {
      formData.append('conflict_strategy', conflictStrategy)
    }
    if (conflictResolutions && Object.keys(conflictResolutions).length > 0) {
      formData.append('conflict_resolutions', JSON.stringify(conflictResolutions))
    }

    return apiClient.post(ENDPOINTS.DATABASE.IMPORT_STATE, formData)
  },

  async getDataQualityReport() {
    return apiClient.get(ENDPOINTS.DATABASE.DATA_QUALITY)
  },

  async flagDataQualityIssues() {
    return apiClient.post(ENDPOINTS.DATABASE.DATA_QUALITY)
  },

  // ── Active users ────────────────────────────────────────────────
  async getActiveUsers() {
    return apiClient.get(ENDPOINTS.ADMIN.ACTIVE_USERS)
  },

  async refreshAuthorRanks() {
    return apiClient.post(ENDPOINTS.ADMIN.REFRESH_AUTHOR_RANKS)
  },

  async seedSampleQuestions() {
    return apiClient.post(ENDPOINTS.ADMIN.SEED_SAMPLE_QUESTIONS)
  },
}
