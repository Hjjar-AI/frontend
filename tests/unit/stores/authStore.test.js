// frontend/tests/unit/stores/authStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    changePassword: vi.fn(),
  },
}))

vi.mock('@/services/api/csrfTokenStore', () => ({
  clearCsrfToken: vi.fn(),
  getCsrfToken: vi.fn(),
  getCsrfPromise: vi.fn(),
  setCsrfPromise: vi.fn(),
  setCsrfToken: vi.fn(),
}))

vi.mock('@/stores/resetAllStores', () => ({
  resetAllStores: vi.fn(),
}))

import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('authStore — setUser', () => {
  it('stores the user object', () => {
    const store = useAuthStore()
    store.setUser({ id: 1, username: 'alice' })
    expect(store.user).toEqual({ id: 1, username: 'alice' })
  })
})

describe('authStore — getters', () => {
  it('isAuthenticated tracks the presence of user', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    store.user = { id: 1 }
    expect(store.isAuthenticated).toBe(true)
  })

  it('fullName falls back to username and then to the i18n guest label', () => {
    const store = useAuthStore()
    store.user = { full_name: 'Alice Smith', username: 'alice' }
    expect(store.fullName).toBe('Alice Smith')
    store.user = { username: 'alice' }
    expect(store.fullName).toBe('alice')
    store.user = null
    // The guest fallback is a translated string, so we only assert it
    // is a non-empty string — the exact value is locale-dependent.
    expect(typeof store.fullName).toBe('string')
    expect(store.fullName.length).toBeGreaterThan(0)
  })

  it('can returns true for a capability the user holds', () => {
    const store = useAuthStore()
    store.user = { capabilities: ['a.b', 'c.d'] }
    expect(store.can('a.b')).toBe(true)
    expect(store.can('c.d')).toBe(true)
  })

  it('can returns false for an unknown capability', () => {
    const store = useAuthStore()
    store.user = { capabilities: ['a.b'] }
    expect(store.can('x.y')).toBe(false)
  })

  it('can returns false when capabilities are missing', () => {
    const store = useAuthStore()
    store.user = {}
    expect(store.can('a.b')).toBe(false)
  })

  it('can returns false for a falsy capability argument', () => {
    const store = useAuthStore()
    store.user = { capabilities: ['a.b'] }
    expect(store.can('')).toBe(false)
    expect(store.can(null)).toBe(false)
  })

  it('canAny returns true if the user holds any of the arguments', () => {
    const store = useAuthStore()
    store.user = { capabilities: ['a.b'] }
    expect(store.canAny('x.y', 'a.b')).toBe(true)
    expect(store.canAny('x.y', 'z.w')).toBe(false)
    expect(store.canAny()).toBe(false)
  })
})

describe('authStore — expiry getters', () => {
  it('isExpired is false when user has no expires_at', () => {
    const store = useAuthStore()
    store.user = { capabilities: [] }
    expect(store.isExpired).toBe(false)
  })

  it('isExpired is true when expires_at is in the past', () => {
    const store = useAuthStore()
    store.user = {
      expires_at: '2020-01-01T00:00:00Z',
      capabilities: [],
    }
    expect(store.isExpired).toBe(true)
  })

  it('isExpired is false when the user holds system.bypass_expiry', () => {
    const store = useAuthStore()
    store.user = {
      expires_at: '2020-01-01T00:00:00Z',
      capabilities: ['system.bypass_expiry'],
    }
    expect(store.isExpired).toBe(false)
  })

  it('isExpiringSoon is true inside the 7-day window', () => {
    const soon = new Date(Date.now() + 3 * 86400_000).toISOString()
    const store = useAuthStore()
    store.user = { expires_at: soon, capabilities: [] }
    expect(store.isExpiringSoon).toBe(true)
  })

  it('isExpiringSoon ignores a bypass holder', () => {
    const soon = new Date(Date.now() + 3 * 86400_000).toISOString()
    const store = useAuthStore()
    store.user = {
      expires_at: soon,
      capabilities: ['system.bypass_expiry'],
    }
    expect(store.isExpiringSoon).toBe(false)
  })

  it('daysUntilExpiry returns null when there is no expiry', () => {
    const store = useAuthStore()
    store.user = { capabilities: [] }
    expect(store.daysUntilExpiry).toBeNull()
  })
})

describe('authStore — login', () => {
  it('sets the user from the response', async () => {
    authService.login.mockResolvedValueOnce({
      user: { id: 1, username: 'alice' },
    })
    const store = useAuthStore()
    await store.login('alice', 'pw')
    expect(store.user).toEqual({ id: 1, username: 'alice' })
  })

  it('returns null when the service rejects', async () => {
    authService.login.mockRejectedValueOnce({
      message: 'bad creds',
      code: 401,
    })
    const store = useAuthStore()
    const result = await store.login('alice', 'bad')
    expect(result).toBeNull()
    expect(store.user).toBeNull()
  })
})

describe('authStore — logout', () => {
  it('clears the user even when the service rejects', async () => {
    authService.logout.mockRejectedValueOnce(new Error('offline'))
    const store = useAuthStore()
    store.user = { id: 1 }
    await store.logout()
    expect(store.user).toBeNull()
  })

  it('clears the user on a normal response', async () => {
    authService.logout.mockResolvedValueOnce({})
    const store = useAuthStore()
    store.user = { id: 1 }
    await store.logout()
    expect(store.user).toBeNull()
  })
})

describe('authStore — restoreSession', () => {
  it('returns true immediately when a user is already present', async () => {
    const store = useAuthStore()
    store.user = { id: 1 }
    const result = await store.restoreSession()
    expect(result).toBe(true)
    expect(authService.me).not.toHaveBeenCalled()
  })

  it('fetches /auth/me/ and stores the response', async () => {
    authService.me.mockResolvedValueOnce({ id: 42, username: 'bob' })
    const store = useAuthStore()
    await store.restoreSession()
    expect(authService.me).toHaveBeenCalledTimes(1)
    expect(store.user).toEqual({ id: 42, username: 'bob' })
  })

  it('leaves the user null on failure', async () => {
    authService.me.mockRejectedValueOnce({ message: 'unauthorized', code: 401 })
    const store = useAuthStore()
    await store.restoreSession()
    expect(store.user).toBeNull()
  })
})

describe('authStore — changePassword', () => {
  it('clears must_change_password on success', async () => {
    authService.changePassword.mockResolvedValueOnce({})
    const store = useAuthStore()
    store.user = { id: 1, must_change_password: true }
    await store.changePassword('old', 'newpass123')
    expect(store.user.must_change_password).toBe(false)
  })
})