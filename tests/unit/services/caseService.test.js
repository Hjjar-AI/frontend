// frontend/tests/unit/services/caseService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from '@/services/api/client'
import { caseService } from '@/services/caseService'

beforeEach(() => { vi.clearAllMocks() })

describe('caseService contract', () => {
  it('list GETs /questions/cases/ with params', async () => {
    await caseService.list({ search: 'dep', limit: 20 })
    expect(apiClient.get).toHaveBeenCalledWith('/questions/cases/', {
      params: { search: 'dep', limit: 20 },
    })
  })

  it('list defaults to no params', async () => {
    await caseService.list()
    expect(apiClient.get).toHaveBeenCalledWith('/questions/cases/', { params: {} })
  })

  it('get GETs the case detail URL', async () => {
    await caseService.get('case-depression-01')
    expect(apiClient.get).toHaveBeenCalledWith(
      '/questions/cases/case-depression-01/',
    )
  })

  it('get URL-encodes the case key', async () => {
    await caseService.get('case with spaces')
    expect(apiClient.get).toHaveBeenCalledWith(
      '/questions/cases/case%20with%20spaces/',
    )
  })

  it('updateTitle PUTs the title', async () => {
    await caseService.updateTitle('case-x', 'New title')
    expect(apiClient.put).toHaveBeenCalledWith('/questions/cases/case-x/', {
      title: 'New title',
    })
  })

  it('updateStem POSTs to the singular case-stem URL', async () => {
    // The URL is singular `case/.../stem/` — see the note in
    // endpoints.js. This is the backend's registered path.
    await caseService.updateStem('case-x', 'new vignette')
    expect(apiClient.post).toHaveBeenCalledWith('/questions/case/case-x/stem/', {
      case_stem: 'new vignette',
    })
  })

  it('delete DELETEs the case detail URL', async () => {
    await caseService.delete('case-x')
    expect(apiClient.delete).toHaveBeenCalledWith('/questions/cases/case-x/')
  })
})