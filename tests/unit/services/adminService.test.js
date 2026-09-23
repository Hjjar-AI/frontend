// frontend/tests/unit/services/adminService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from '@/services/api/client'
import { adminService } from '@/services/adminService'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('adminService — users', () => {
  it('listUsers GETs /auth/admin/users/ with params', async () => {
    await adminService.listUsers({ page: 2, per_page: 50 })
    expect(apiClient.get).toHaveBeenCalledWith('/auth/admin/users/', {
      params: { page: 2, per_page: 50 },
    })
  })

  it('getUser GETs the detail URL', async () => {
    await adminService.getUser(7)
    expect(apiClient.get).toHaveBeenCalledWith('/auth/admin/users/7/')
  })

  it('createUser POSTs the payload', async () => {
    const data = { username: 'a', password: 'b', role: 'member' }
    await adminService.createUser(data)
    expect(apiClient.post).toHaveBeenCalledWith('/auth/admin/users/', data)
  })

  it('updateUser PUTs the payload to the detail URL', async () => {
    await adminService.updateUser(7, { full_name: 'X' })
    expect(apiClient.put).toHaveBeenCalledWith('/auth/admin/users/7/', { full_name: 'X' })
  })

  it('toggleUser POSTs admin_password under the snake_case key', async () => {
    await adminService.toggleUser(7, 'pw')
    expect(apiClient.post).toHaveBeenCalledWith('/auth/admin/users/7/toggle/', {
      admin_password: 'pw',
    })
  })

  it('resetPasswordWithAdmin POSTs both passwords', async () => {
    await adminService.resetPasswordWithAdmin(7, 'adminpw', 'newpw')
    expect(apiClient.post).toHaveBeenCalledWith('/auth/admin/users/7/reset-password/', {
      admin_password: 'adminpw',
      new_password: 'newpw',
    })
  })

  it('deleteUser sends admin_password in the DELETE body', async () => {
    await adminService.deleteUser(7, 'pw')
    expect(apiClient.delete).toHaveBeenCalledWith('/auth/admin/users/7/', {
      data: { admin_password: 'pw' },
    })
  })
})

describe('adminService — settings and stats', () => {
  it('getSettings GETs /admin/settings/', async () => {
    await adminService.getSettings()
    expect(apiClient.get).toHaveBeenCalledWith('/admin/settings/')
  })

  it('updateSettings POSTs to /admin/settings/', async () => {
    const payload = { default_expiry_days: '60' }
    await adminService.updateSettings(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/admin/settings/', payload)
  })

  it('getVerificationStats GETs /analytics/verification-stats/', async () => {
    await adminService.getVerificationStats()
    expect(apiClient.get).toHaveBeenCalledWith('/analytics/verification-stats/')
  })

  it('getActiveUsers GETs /auth/admin/active-users/', async () => {
    await adminService.getActiveUsers()
    expect(apiClient.get).toHaveBeenCalledWith('/auth/admin/active-users/')
  })
})

describe('adminService — database', () => {
  it('getDatabaseInfo GETs /database/info/', async () => {
    await adminService.getDatabaseInfo()
    expect(apiClient.get).toHaveBeenCalledWith('/database/info/')
  })

  it('createBackup POSTs /database/backup/', async () => {
    await adminService.createBackup()
    expect(apiClient.post).toHaveBeenCalledWith('/database/backup/')
  })

  it('listBackups GETs /database/backups/', async () => {
    await adminService.listBackups()
    expect(apiClient.get).toHaveBeenCalledWith('/database/backups/')
  })

  it('restoreBackup POSTs backup_name and admin_password', async () => {
    await adminService.restoreBackup('b.sql', 'pw')
    expect(apiClient.post).toHaveBeenCalledWith('/database/restore/', {
      backup_name: 'b.sql',
      admin_password: 'pw',
    })
  })

  it('clearDatabase POSTs admin_password', async () => {
    await adminService.clearDatabase('pw')
    expect(apiClient.post).toHaveBeenCalledWith('/database/clear/', {
      admin_password: 'pw',
    })
  })

  it('importDatabase sends the file as multipart FormData', async () => {
    const file = new File(['x'], 'data.xlsx')
    await adminService.importDatabase(file)
    const [url, body] = apiClient.post.mock.calls[0]
    expect(url).toBe('/database/import/')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file')).toBe(file)
  })

  it('importTelegram sends the file as multipart FormData', async () => {
    const file = new File(['{}'], 'result.json', { type: 'application/json' })
    await adminService.importTelegram(file)
    const [url, body] = apiClient.post.mock.calls[0]
    expect(url).toBe('/database/import/telegram/')
    expect(body.get('file')).toBe(file)
  })

  it('exportPdf posts structured options and preserves the binary response', async () => {
    const options = {
      locale: 'en',
      front_matter: {
        enabled: true,
        heading: 'About us',
        fields: [{ label: 'Edition', value: '2026' }],
      },
    }
    await adminService.exportPdf(options)

    expect(apiClient.post).toHaveBeenCalledWith(expect.stringContaining('/export/pdf/'), options, {
      responseType: 'blob',
      rawResponse: true,
    })
  })

  it('exportPdf can target the verified-only endpoint', async () => {
    await adminService.exportPdf({}, { verifiedOnly: true })

    expect(apiClient.post.mock.calls[0][0]).toContain('/export/pdf/verified/')
  })
})

describe('adminService — state envelope', () => {
  it('exportStateUrl defaults to include_images=true and no verified_only', () => {
    const url = adminService.exportStateUrl()
    expect(url).toContain('/database/export/state/')
    expect(url).not.toContain('include_images=false')
    expect(url).not.toContain('verified_only=true')
  })

  it('exportStateUrl with includeImages=false sets the flag', () => {
    const url = adminService.exportStateUrl(false)
    expect(url).toContain('include_images=false')
  })

  it('exportStateUrl with verifiedOnly=true sets the flag', () => {
    const url = adminService.exportStateUrl(true, true)
    expect(url).toContain('verified_only=true')
  })

  it('exportState requests a binary response with explicit flags', async () => {
    await adminService.exportState(false, true)

    expect(apiClient.get).toHaveBeenCalledWith('/database/export/state/', {
      params: { include_images: 'false', verified_only: 'true' },
      responseType: 'blob',
      rawResponse: true,
    })
  })

  it('exportState requests the full XLSX container when selected', async () => {
    await adminService.exportState(true, false, 'xlsx')

    expect(apiClient.get).toHaveBeenCalledWith('/database/export/state/', {
      params: { format: 'xlsx' },
      responseType: 'blob',
      rawResponse: true,
    })
  })

  it('exportStateUrl includes the XLSX format flag', () => {
    expect(adminService.exportStateUrl(true, false, 'xlsx')).toContain('format=xlsx')
  })

  it('exportState forwards selection filters to portable packages', async () => {
    await adminService.exportState(true, false, 'json', {
      difficulty: 'hard',
      category_ids: '4,7',
    })

    expect(apiClient.get).toHaveBeenCalledWith('/database/export/state/', {
      params: { difficulty: 'hard', category_ids: '4,7' },
      responseType: 'blob',
      rawResponse: true,
    })
  })

  it('importState sends the required FormData fields', async () => {
    const file = new File(['{}'], 'state.json', { type: 'application/json' })
    await adminService.importState(file, 'merge', {})
    const [url, body] = apiClient.post.mock.calls[0]
    expect(url).toBe('/database/import/state/')
    expect(body.get('file')).toBe(file)
    expect(body.get('mode')).toBe('merge')
    expect(body.get('dry_run')).toBe('false')
    expect(body.get('analyze')).toBe('false')
  })

  it('importState forwards dryRun, analyze, mapping and adminPassword', async () => {
    const file = new File(['{}'], 'state.json')
    await adminService.importState(file, 'replace', {
      dryRun: true,
      analyze: true,
      mapping: { Ali: { action: 'stub' } },
      adminPassword: 'secret',
    })
    const [, body] = apiClient.post.mock.calls[0]
    expect(body.get('mode')).toBe('replace')
    expect(body.get('dry_run')).toBe('true')
    expect(body.get('analyze')).toBe('true')
    expect(JSON.parse(body.get('mapping'))).toEqual({ Ali: { action: 'stub' } })
    expect(body.get('admin_password')).toBe('secret')
  })

  it('importState forwards the conflict policy and per-question resolutions', async () => {
    const file = new File(['{}'], 'package.json')
    const resolutions = { 'question-uuid': 'use_imported' }
    await adminService.importState(file, 'merge', {
      conflictStrategy: 'review',
      conflictResolutions: resolutions,
    })

    const [, body] = apiClient.post.mock.calls[0]
    expect(body.get('conflict_strategy')).toBe('review')
    expect(JSON.parse(body.get('conflict_resolutions'))).toEqual(resolutions)
  })

  it('loads and flags data-quality issues', async () => {
    await adminService.getDataQualityReport()
    await adminService.flagDataQualityIssues()

    expect(apiClient.get).toHaveBeenCalledWith('/database/data-quality/')
    expect(apiClient.post).toHaveBeenCalledWith('/database/data-quality/')
  })
})

describe('adminService — flags and maintenance', () => {
  it('flagQuestion POSTs reason', async () => {
    await adminService.flagQuestion(42, 'wrong answer')
    expect(apiClient.post).toHaveBeenCalledWith('/questions/42/flag/', {
      reason: 'wrong answer',
    })
  })

  it('listPendingFlags GETs with pagination params', async () => {
    await adminService.listPendingFlags(2, 25)
    expect(apiClient.get).toHaveBeenCalledWith('/questions/admin/flags/', {
      params: { page: 2, per_page: 25 },
    })
  })

  it('resolveFlag POSTs to the resolve URL', async () => {
    await adminService.resolveFlag(9)
    expect(apiClient.post).toHaveBeenCalledWith('/questions/admin/flags/9/resolve/')
  })

  it('refreshAuthorRanks POSTs /admin/refresh-author-ranks/', async () => {
    await adminService.refreshAuthorRanks()
    expect(apiClient.post).toHaveBeenCalledWith('/admin/refresh-author-ranks/')
  })

  it('seedSampleQuestions POSTs /admin/seed-sample-questions/', async () => {
    await adminService.seedSampleQuestions()
    expect(apiClient.post).toHaveBeenCalledWith('/admin/seed-sample-questions/')
  })
})
