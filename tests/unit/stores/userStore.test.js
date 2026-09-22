// frontend/tests/unit/stores/userStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/adminService', () => ({
  adminService: {
    listUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    toggleUser: vi.fn(),
    resetPasswordWithAdmin: vi.fn(),
  },
}))

const { notifyMock, confirmMock, promptMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
  confirmMock: vi.fn(),
  promptMock: vi.fn(),
}))

vi.mock('@/composables/useNotify', () => ({
  useNotify: () => ({ notify: notifyMock }),
}))

vi.mock('@/composables/useDialog', () => ({
  useDialog: () => ({ confirm: confirmMock, prompt: promptMock }),
}))

import { adminService } from '@/services/adminService'
import { useUserStore } from '@/stores/userStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('userStore — fetchList', () => {
  it('normalizes items into byId + ids', async () => {
    adminService.listUsers.mockResolvedValueOnce({
      items: [
        { id: 1, username: 'a' },
        { id: 2, username: 'b' },
      ],
      page: 1,
      per_page: 20,
      total: 2,
      total_pages: 1,
    })
    const store = useUserStore()
    await store.fetchList()
    expect(store.ids).toEqual([1, 2])
    expect(store.byId[1].username).toBe('a')
    expect(store.pagination.total).toBe(2)
  })
})

describe('userStore — create', () => {
  it('prepends the new user and increments the total', async () => {
    adminService.createUser.mockResolvedValueOnce({ id: 9, username: 'new' })
    const store = useUserStore()
    store.ids = [1]
    store.pagination.total = 1
    await store.create({ username: 'new' })
    expect(store.ids[0]).toBe(9)
    expect(store.pagination.total).toBe(2)
  })
})

describe('userStore — update', () => {
  it('replaces the row in byId and currentItem', async () => {
    adminService.updateUser.mockResolvedValueOnce({ id: 1, full_name: 'New Name' })
    const store = useUserStore()
    store.byId = { 1: { id: 1, full_name: 'Old' } }
    store.currentItem = { id: 1, full_name: 'Old' }
    await store.update(1, { full_name: 'New Name' })
    expect(store.byId[1].full_name).toBe('New Name')
    expect(store.currentItem.full_name).toBe('New Name')
  })
})

describe('userStore — remove', () => {
  it('sends the admin password and drops the row', async () => {
    adminService.deleteUser.mockResolvedValueOnce({})
    const store = useUserStore()
    store.byId = { 1: { id: 1 } }
    store.ids = [1]
    store.pagination.total = 1
    await store.remove(1, 'pw')
    expect(adminService.deleteUser).toHaveBeenCalledWith(1, 'pw')
    expect(store.byId[1]).toBeUndefined()
    expect(store.pagination.total).toBe(0)
  })
})

describe('userStore — toggleActive', () => {
  it('flips the local is_active flag from the response', async () => {
    adminService.toggleUser.mockResolvedValueOnce({ is_active: false })
    const store = useUserStore()
    store.byId = { 1: { id: 1, is_active: true } }
    await store.toggleActive(1, 'pw')
    expect(store.byId[1].is_active).toBe(false)
    expect(notifyMock).toHaveBeenCalled()
  })

  it('falls back to negating the local flag when the response omits is_active', async () => {
    adminService.toggleUser.mockResolvedValueOnce({})
    const store = useUserStore()
    store.byId = { 1: { id: 1, is_active: true } }
    await store.toggleActive(1, 'pw')
    expect(store.byId[1].is_active).toBe(false)
  })
})

describe('userStore — resetPassword', () => {
  it('delegates to the service with both passwords', async () => {
    adminService.resetPasswordWithAdmin.mockResolvedValueOnce({
      temp_password: 'abc123',
    })
    const store = useUserStore()
    const result = await store.resetPassword(1, 'adminpw', 'newpw')
    expect(adminService.resetPasswordWithAdmin).toHaveBeenCalledWith(1, 'adminpw', 'newpw')
    expect(result.temp_password).toBe('abc123')
  })
})

describe('userStore — confirmDelete', () => {
  it('does nothing when the confirm dialog is declined', async () => {
    confirmMock.mockResolvedValueOnce(false)
    const store = useUserStore()
    const result = await store.confirmDelete({ id: 1, username: 'x' })
    expect(result).toBe(false)
    expect(adminService.deleteUser).not.toHaveBeenCalled()
  })

  it('does nothing when the prompt is cancelled', async () => {
    confirmMock.mockResolvedValueOnce(true)
    promptMock.mockResolvedValueOnce(null)
    const store = useUserStore()
    const result = await store.confirmDelete({ id: 1, username: 'x' })
    expect(result).toBe(false)
    expect(adminService.deleteUser).not.toHaveBeenCalled()
  })

  it('does nothing when the prompt returns an empty string', async () => {
    confirmMock.mockResolvedValueOnce(true)
    promptMock.mockResolvedValueOnce('')
    const store = useUserStore()
    const result = await store.confirmDelete({ id: 1, username: 'x' })
    expect(result).toBe(false)
    expect(adminService.deleteUser).not.toHaveBeenCalled()
  })

  it('deletes when both the confirm and prompt succeed', async () => {
    confirmMock.mockResolvedValueOnce(true)
    promptMock.mockResolvedValueOnce('adminpw')
    adminService.deleteUser.mockResolvedValueOnce({})
    const store = useUserStore()
    store.byId = { 1: { id: 1 } }
    store.ids = [1]
    const result = await store.confirmDelete({ id: 1, username: 'x' })
    expect(result).toBe(true)
    expect(adminService.deleteUser).toHaveBeenCalledWith(1, 'adminpw')
  })
})

describe('userStore — confirmToggle', () => {
  it('does nothing when the confirm is declined', async () => {
    confirmMock.mockResolvedValueOnce(false)
    const store = useUserStore()
    const result = await store.confirmToggle({ id: 1, username: 'x', is_active: true })
    expect(result).toBe(false)
    expect(adminService.toggleUser).not.toHaveBeenCalled()
  })

  it('toggles when both the confirm and prompt succeed', async () => {
    confirmMock.mockResolvedValueOnce(true)
    promptMock.mockResolvedValueOnce('adminpw')
    adminService.toggleUser.mockResolvedValueOnce({ is_active: false })
    const store = useUserStore()
    store.byId = { 1: { id: 1, is_active: true } }
    const result = await store.confirmToggle({ id: 1, username: 'x', is_active: true })
    expect(result).toBe(true)
    expect(adminService.toggleUser).toHaveBeenCalledWith(1, 'adminpw')
  })
})

describe('userStore — reset', () => {
  it('returns every field to its default', () => {
    const store = useUserStore()
    store.byId = { 1: { id: 1 } }
    store.ids = [1]
    store.reset()
    expect(store.byId).toEqual({})
    expect(store.ids).toEqual([])
  })
})