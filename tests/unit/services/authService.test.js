// frontend/tests/unit/services/authService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from '@/services/api/client'
import { authService } from '@/services/authService'

beforeEach(() => { vi.clearAllMocks() })

describe('authService contract', () => {
  it('login posts username and password to /auth/login/', async () => {
    await authService.login('alice', 'hunter2')
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login/', {
      username: 'alice',
      password: 'hunter2',
    })
  })

  it('logout POSTs to /auth/logout/ with no body', async () => {
    await authService.logout()
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout/')
  })

  it('me GETs /auth/me/', async () => {
    await authService.me()
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me/')
  })

  it('changePassword sends snake_case keys the backend serializer expects', async () => {
    await authService.changePassword('old-pw', 'new-pw-123')
    expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password/', {
      current_password: 'old-pw',
      new_password: 'new-pw-123',
    })
  })
})