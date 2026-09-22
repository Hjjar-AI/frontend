// frontend/tests/unit/services/small-services.test.js
//
// Contract tests for the services whose surface is small enough
// that one file per service would be more overhead than value.
// Each service gets its own `describe` block, so a failure is still
// attributed to the right module.
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from '@/services/api/client'
import { blueprintService } from '@/services/blueprintService'
import { tagService } from '@/services/tagService'
import { categoryService } from '@/services/categoryService'
import { bookmarkService } from '@/services/bookmarkService'
import { flagService } from '@/services/flagService'
import { testHistoryService } from '@/services/testHistoryService'
import { wrongAnswerService } from '@/services/wrongAnswerService'
import { permissionService } from '@/services/permissionService'

beforeEach(() => { vi.clearAllMocks() })

describe('blueprintService', () => {
  it('list GETs /exam/blueprints/', async () => {
    await blueprintService.list()
    expect(apiClient.get).toHaveBeenCalledWith('/exam/blueprints/')
  })

  it('get GETs the detail URL', async () => {
    await blueprintService.get(3)
    expect(apiClient.get).toHaveBeenCalledWith('/exam/blueprints/3/')
  })

  it('create POSTs the payload', async () => {
    await blueprintService.create({ name: 'BP' })
    expect(apiClient.post).toHaveBeenCalledWith('/exam/blueprints/', { name: 'BP' })
  })

  it('update PUTs the payload', async () => {
    await blueprintService.update(3, { name: 'X' })
    expect(apiClient.put).toHaveBeenCalledWith('/exam/blueprints/3/', { name: 'X' })
  })

  it('delete DELETEs the detail URL', async () => {
    await blueprintService.delete(3)
    expect(apiClient.delete).toHaveBeenCalledWith('/exam/blueprints/3/')
  })
})

describe('tagService', () => {
  it('list GETs /questions/tags/', async () => {
    await tagService.list()
    expect(apiClient.get).toHaveBeenCalledWith('/questions/tags/')
  })

  it('renameTag POSTs new_name and URL-encodes the old name', async () => {
    await tagService.renameTag('old tag', 'new tag')
    expect(apiClient.post).toHaveBeenCalledWith(
      '/questions/admin/tags/old%20tag/rename/',
      { new_name: 'new tag' },
    )
  })

  it('deleteTag DELETEs the encoded name URL', async () => {
    await tagService.deleteTag('old tag')
    expect(apiClient.delete).toHaveBeenCalledWith(
      '/questions/admin/tags/old%20tag/delete/',
    )
  })

  it('mergeTags POSTs source_tags and target_tag', async () => {
    await tagService.mergeTags(['a', 'b'], 'c')
    expect(apiClient.post).toHaveBeenCalledWith('/questions/admin/tags/merge/', {
      source_tags: ['a', 'b'],
      target_tag: 'c',
    })
  })
})

describe('categoryService', () => {
  it('list GETs /questions/categories/', async () => {
    await categoryService.list({ per_page: 500 })
    expect(apiClient.get).toHaveBeenCalledWith('/questions/categories/', {
      params: { per_page: 500 },
    })
  })

  it('create POSTs to the create URL', async () => {
    await categoryService.create({ name: 'X' })
    expect(apiClient.post).toHaveBeenCalledWith('/questions/categories/create/', {
      name: 'X',
    })
  })

  it('update PUTs to the update URL', async () => {
    await categoryService.update(4, { name: 'Y' })
    expect(apiClient.put).toHaveBeenCalledWith(
      '/questions/categories/4/update/',
      { name: 'Y' },
    )
  })

  it('delete DELETEs the delete URL', async () => {
    await categoryService.delete(4)
    expect(apiClient.delete).toHaveBeenCalledWith(
      '/questions/categories/4/delete/',
    )
  })
})

describe('bookmarkService', () => {
  it('list GETs /questions/bookmarks/', async () => {
    await bookmarkService.list()
    expect(apiClient.get).toHaveBeenCalledWith('/questions/bookmarks/')
  })

  it('toggle POSTs the per-question URL', async () => {
    await bookmarkService.toggle(42)
    expect(apiClient.post).toHaveBeenCalledWith('/questions/42/bookmark/')
  })

  it('count GETs /questions/bookmarks/count/', async () => {
    await bookmarkService.count()
    expect(apiClient.get).toHaveBeenCalledWith('/questions/bookmarks/count/')
  })
})

describe('flagService', () => {
  it('flagQuestion POSTs the reason', async () => {
    await flagService.flagQuestion(42, 'wrong')
    expect(apiClient.post).toHaveBeenCalledWith('/questions/42/flag/', {
      reason: 'wrong',
    })
  })

  it('listPendingFlags GETs with pagination', async () => {
    await flagService.listPendingFlags(2, 25)
    expect(apiClient.get).toHaveBeenCalledWith('/questions/admin/flags/', {
      params: { page: 2, per_page: 25 },
    })
  })

  it('resolveFlag POSTs the resolve URL', async () => {
    await flagService.resolveFlag(9)
    expect(apiClient.post).toHaveBeenCalledWith('/questions/admin/flags/9/resolve/')
  })
})

describe('testHistoryService', () => {
  it('fetchHistory GETs /history/ with params', async () => {
    await testHistoryService.fetchHistory({ page: 2, per_page: 20, user_id: 7 })
    expect(apiClient.get).toHaveBeenCalledWith('/history/', {
      params: { page: 2, per_page: 20, user_id: 7 },
    })
  })

  it('fetchHistory forwards an empty params object', async () => {
    await testHistoryService.fetchHistory()
    expect(apiClient.get).toHaveBeenCalledWith('/history/', { params: {} })
  })
})

describe('wrongAnswerService', () => {
  it('listMistakes GETs the mistakes URL with params', async () => {
    await wrongAnswerService.listMistakes({ page: 1 })
    expect(apiClient.get).toHaveBeenCalledWith('/questions/mistakes/', {
      params: { page: 1 },
    })
  })

  it('listFragile GETs the fragile URL with params', async () => {
    await wrongAnswerService.listFragile({ page: 1 })
    expect(apiClient.get).toHaveBeenCalledWith('/questions/fragile/', {
      params: { page: 1 },
    })
  })

  it('summary GETs the attempt-summary URL', async () => {
    await wrongAnswerService.summary()
    expect(apiClient.get).toHaveBeenCalledWith('/questions/attempt-summary/')
  })

  it('dueCount GETs the SRS-due URL', async () => {
    await wrongAnswerService.dueCount()
    expect(apiClient.get).toHaveBeenCalledWith('/questions/srs-due-count/')
  })
})

describe('permissionService', () => {
  it('listRoles GETs /auth/admin/permissions/', async () => {
    await permissionService.listRoles()
    expect(apiClient.get).toHaveBeenCalledWith('/auth/admin/permissions/')
  })

  it('updateRole PUTs role and capabilities', async () => {
    await permissionService.updateRole('moderator', ['a.b', 'c.d'])
    expect(apiClient.put).toHaveBeenCalledWith('/auth/admin/permissions/', {
      role: 'moderator',
      capabilities: ['a.b', 'c.d'],
    })
  })

  it('getUserCapabilities GETs the nested user URL', async () => {
    await permissionService.getUserCapabilities(7)
    expect(apiClient.get).toHaveBeenCalledWith(
      '/auth/admin/permissions/users/7/',
    )
  })

  it('updateUserCapabilities PUTs the overrides dict', async () => {
    await permissionService.updateUserCapabilities(7, { 'a.b': true })
    expect(apiClient.put).toHaveBeenCalledWith(
      '/auth/admin/permissions/users/7/',
      { capabilities: { 'a.b': true } },
    )
  })
})