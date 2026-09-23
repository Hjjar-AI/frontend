// frontend/tests/unit/services/client.test.js
//
// Tests for the HTTP client.
//
// THE MOCK
// --------
// `client.js` calls `axios.create()` at module load and registers
// interceptors. The mock replaces `axios.create` with a factory
// that returns a callable instance which runs request interceptors,
// calls the test-supplied raw impl, and runs response interceptors.
//
// PIPELINE SHAPE
// --------------
//   • Request interceptor `onFulfilled` → runs for every request.
//   • Raw impl → resolves or rejects.
//   • Raw rejection → routed to the first `onRejected` handler.
//   • Raw resolution → runs every response interceptor's
//     `onFulfilled` in order.
//   • A rejection FROM a response `onFulfilled` propagates directly
//     to the caller. It is NOT routed to `onRejected` — that is
//     what the real axios does, and it is why the "envelope with
//     details" test rejects with the exact shape returned by the
//     interceptor, not with the shape that `normalizeError` would
//     produce.
//
// The mock now sets up `config.headers` on every request because
// the real axios always provides it and the request interceptor
// writes to it unconditionally.

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  requestInterceptors: [],
  responseInterceptors: [],
  rawAxiosImpl: vi.fn(),
  createOptions: [],
  cancelSourceSpy: vi.fn(),
}))

vi.mock('axios', () => {
  const createInstance = (opts) => {
    mocks.createOptions.push(opts)

    const instance = async (config) => {
      let cfg = { ...config, headers: config.headers ? { ...config.headers } : {} }

      for (const { onFulfilled } of mocks.requestInterceptors) {
        if (onFulfilled) cfg = await onFulfilled(cfg)
      }

      let response
      try {
        response = await mocks.rawAxiosImpl(cfg)
      } catch (err) {
        for (const { onRejected } of mocks.responseInterceptors) {
          if (onRejected) return onRejected(err)
        }
        throw err
      }

      let result = response
      for (const { onFulfilled } of mocks.responseInterceptors) {
        if (onFulfilled) result = await onFulfilled(result)
      }
      return result
    }

    instance.get = (url, config = {}) => instance({ method: 'GET', url, ...config })
    instance.post = (url, data, config = {}) => instance({ method: 'POST', url, data, ...config })
    instance.put = (url, data, config = {}) => instance({ method: 'PUT', url, data, ...config })
    instance.delete = (url, config = {}) => instance({ method: 'DELETE', url, ...config })

    instance.interceptors = {
      request: {
        use: (onFulfilled, onRejected) => {
          mocks.requestInterceptors.push({ onFulfilled, onRejected })
        },
      },
      response: {
        use: (onFulfilled, onRejected) => {
          mocks.responseInterceptors.push({ onFulfilled, onRejected })
        },
      },
    }
    return instance
  }

  return {
    default: {
      create: createInstance,
      CancelToken: {
        source: () => {
          mocks.cancelSourceSpy()
          return { token: Symbol('cancel-token'), cancel: vi.fn() }
        },
      },
      isCancel: (e) => e?.__isCancel === true,
    },
  }
})

vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      t: (key) => `[${key}]`,
      locale: { value: 'ar' },
    },
  },
}))

const routerPush = vi.fn()
vi.mock('@/router', () => ({
  default: { push: routerPush },
}))

vi.mock('@/services/api/errorHandler', () => ({
  normalizeError: (e) => ({
    message: e?.response?.data?.message || 'normalized-error',
    code: e?.response?.status || 'NETWORK',
    details: null,
  }),
}))

import { apiClient, fetchCsrfTokenDirect } from '@/services/api/client'
import { clearCsrfToken } from '@/services/api/csrfTokenStore'

function defaultRawImpl(config) {
  if (config.url === '/auth/csrf/') {
    return Promise.resolve({ data: { token: 'csrf-abc' }, config, status: 200 })
  }
  return Promise.resolve({
    data: { code: 200, message: 'ok', data: { value: 1 } },
    config,
    status: 200,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  clearCsrfToken()

  mocks.rawAxiosImpl.mockReset()
  mocks.rawAxiosImpl.mockImplementation(defaultRawImpl)
})

// ── Instance creation ─────────────────────────────────────────────

describe('client — axios instance setup', () => {
  it('creates the instance with the API base URL and credentials', () => {
    expect(mocks.createOptions.length).toBeGreaterThan(0)
    const opts = mocks.createOptions[0]
    expect(opts.baseURL).toBeDefined()
    expect(opts.withCredentials).toBe(true)
  })
})

// ── Request interceptor: Accept-Language ──────────────────────────

describe('client — request interceptor: Accept-Language', () => {
  it('adds Accept-Language from the active i18n locale', async () => {
    await apiClient.get('/foo/')
    const cfg = mocks.rawAxiosImpl.mock.calls[0][0]
    expect(cfg.headers['Accept-Language']).toBe('ar')
  })
})

// ── Request interceptor: CSRF ─────────────────────────────────────

describe('client — request interceptor: CSRF for mutations', () => {
  it('does not attach X-CSRFToken to a GET', async () => {
    await apiClient.get('/foo/')
    const cfg = mocks.rawAxiosImpl.mock.calls[0][0]
    expect(cfg.headers['X-CSRFToken']).toBeUndefined()
    const csrfCalls = mocks.rawAxiosImpl.mock.calls.filter(([c]) => c.url === '/auth/csrf/')
    expect(csrfCalls).toHaveLength(0)
  })

  it('fetches a CSRF token and attaches it to a POST', async () => {
    await apiClient.post('/foo/', { bar: 1 })
    const csrfCall = mocks.rawAxiosImpl.mock.calls.find(([c]) => c.url === '/auth/csrf/')
    expect(csrfCall).toBeDefined()
    const postCall = mocks.rawAxiosImpl.mock.calls.find(([c]) => c.url === '/foo/')
    expect(postCall[0].headers['X-CSRFToken']).toBe('csrf-abc')
  })

  it('attaches X-CSRFToken to PUT and DELETE', async () => {
    await apiClient.put('/foo/', {})
    await apiClient.delete('/foo/')
    const putCall = mocks.rawAxiosImpl.mock.calls.find(([c]) => c.method === 'PUT')
    const delCall = mocks.rawAxiosImpl.mock.calls.find(([c]) => c.method === 'DELETE')
    expect(putCall[0].headers['X-CSRFToken']).toBe('csrf-abc')
    expect(delCall[0].headers['X-CSRFToken']).toBe('csrf-abc')
  })

  it('caches the CSRF token across mutations within a session', async () => {
    await apiClient.post('/foo/', {})
    await apiClient.post('/bar/', {})
    const csrfCalls = mocks.rawAxiosImpl.mock.calls.filter(([c]) => c.url === '/auth/csrf/')
    expect(csrfCalls).toHaveLength(1)
  })

  it('deduplicates concurrent CSRF fetches via the shared promise', async () => {
    await Promise.all([apiClient.post('/a/', {}), apiClient.post('/b/', {})])
    const csrfCalls = mocks.rawAxiosImpl.mock.calls.filter(([c]) => c.url === '/auth/csrf/')
    expect(csrfCalls).toHaveLength(1)
  })

  it('skips the CSRF fetch when skipCsrf is set on the config', async () => {
    await apiClient.get('/foo/', { skipCsrf: true })
    const csrfCalls = mocks.rawAxiosImpl.mock.calls.filter(([c]) => c.url === '/auth/csrf/')
    expect(csrfCalls).toHaveLength(0)
  })
})

// ── Response interceptor: envelope unwrapping ─────────────────────

describe('client — response interceptor: envelope unwrapping', () => {
  it('unwraps {code, message, data} to just the data', async () => {
    mocks.rawAxiosImpl.mockImplementation(() =>
      Promise.resolve({
        data: { code: 200, message: 'ok', data: { id: 42 } },
        config: { url: '/x/', method: 'GET' },
      }),
    )
    const result = await apiClient.get('/x/')
    expect(result).toEqual({ id: 42 })
  })

  it('rejects with {message, code, details} when the envelope has details', async () => {
    mocks.rawAxiosImpl.mockImplementation(() =>
      Promise.resolve({
        data: {
          code: 400,
          message: 'bad input',
          details: { field: ['required'] },
        },
        config: { url: '/x/', method: 'GET' },
      }),
    )
    await expect(apiClient.get('/x/')).rejects.toEqual({
      message: 'bad input',
      code: 400,
      details: { field: ['required'] },
    })
  })

  it('returns {message} when the envelope has data: null', async () => {
    mocks.rawAxiosImpl.mockImplementation(() =>
      Promise.resolve({
        data: { code: 200, message: 'done', data: null },
        config: { url: '/x/', method: 'GET' },
      }),
    )
    const result = await apiClient.get('/x/')
    expect(result).toEqual({ message: 'done' })
  })

  it('passes through a bare object with no envelope keys', async () => {
    mocks.rawAxiosImpl.mockImplementation(() =>
      Promise.resolve({
        data: { raw: 'value' },
        config: { url: '/x/', method: 'GET' },
      }),
    )
    const result = await apiClient.get('/x/')
    expect(result).toEqual({ raw: 'value' })
  })

  it('passes through a JSON array', async () => {
    mocks.rawAxiosImpl.mockImplementation(() =>
      Promise.resolve({
        data: [{ a: 1 }, { a: 2 }],
        config: { url: '/x/', method: 'GET' },
      }),
    )
    const result = await apiClient.get('/x/')
    expect(result).toEqual([{ a: 1 }, { a: 2 }])
  })

  it('returns the full response when rawResponse is requested', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    mocks.rawAxiosImpl.mockImplementation((config) =>
      Promise.resolve({ data: blob, headers: { test: 'header' }, config }),
    )

    const result = await apiClient.post('/pdf/', {}, { rawResponse: true })

    expect(result.data).toBe(blob)
    expect(result.headers.test).toBe('header')
  })
})

// ── Error handling ────────────────────────────────────────────────

describe('client — 401 handling', () => {
  it('pushes to Login when a 401 comes back', async () => {
    mocks.rawAxiosImpl.mockImplementation(() =>
      Promise.reject({
        response: { status: 401, data: {} },
        config: { url: '/x/', method: 'GET' },
      }),
    )
    await expect(apiClient.get('/x/')).rejects.toMatchObject({ code: 401 })
    // The router push is scheduled inside a dynamic import; give
    // the import a macrotask to resolve.
    await new Promise((r) => setTimeout(r, 0))
    expect(routerPush).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: expect.any(String) },
    })
  })

  it('does not push when already on /login', async () => {
    const originalPath = window.location.pathname
    try {
      window.history.pushState({}, '', '/login')
      mocks.rawAxiosImpl.mockImplementation(() =>
        Promise.reject({
          response: { status: 401, data: {} },
          config: { url: '/x/', method: 'GET' },
        }),
      )
      await expect(apiClient.get('/x/')).rejects.toMatchObject({ code: 401 })
      await new Promise((r) => setTimeout(r, 0))
      expect(routerPush).not.toHaveBeenCalled()
    } finally {
      window.history.pushState({}, '', originalPath)
    }
  })
})

describe('client — network errors', () => {
  it('rejects with the normalized shape', async () => {
    // `apiClient.get` accepts retry options as its third argument.
    // Without them, the retry logic waits the default `retryDelay`
    // (1000 ms) before giving up — which added one full second to
    // the suite for a test that has nothing to do with retry.
    // Passing `retryDelay: 1` keeps the retry path exercised while
    // removing the artificial wait.
    mocks.rawAxiosImpl.mockImplementation(() =>
      Promise.reject({ request: {}, config: { url: '/x/', method: 'GET' } }),
    )
    await expect(
      apiClient.get('/x/', {}, { retryDelay: 1 }),
    ).rejects.toBeTruthy()
  })
})

describe('client — cancellations', () => {
  it('rejects with code CANCEL when axios reports a cancel', async () => {
    mocks.rawAxiosImpl.mockImplementation(() =>
      Promise.reject({ __isCancel: true, config: { url: '/x/', method: 'GET' } }),
    )
    await expect(apiClient.get('/x/')).rejects.toMatchObject({ code: 'CANCEL' })
  })
})

// ── Retry ─────────────────────────────────────────────────────────

describe('client — retry policy', () => {
  it('retries a GET once on a 500', async () => {
    let call = 0
    mocks.rawAxiosImpl.mockImplementation((config) => {
      if (config.url === '/auth/csrf/') {
        return Promise.resolve({ data: { token: 't' }, config })
      }
      call++
      if (call === 1) {
        return Promise.reject({
          response: { status: 500, data: { message: 'boom' } },
          config,
        })
      }
      return Promise.resolve({
        data: { code: 200, message: 'ok', data: 'second' },
        config,
      })
    })
    const result = await apiClient.get('/x/', {}, { retryDelay: 1 })
    expect(result).toBe('second')
    expect(mocks.rawAxiosImpl.mock.calls.filter(([c]) => c.url === '/x/').length).toBe(2)
  })

  it('does not retry a POST on a 500', async () => {
    mocks.rawAxiosImpl.mockImplementation((config) => {
      if (config.url === '/auth/csrf/') {
        return Promise.resolve({ data: { token: 't' }, config })
      }
      return Promise.reject({
        response: { status: 500, data: { message: 'boom' } },
        config,
      })
    })
    await expect(apiClient.post('/x/', {}, {}, { retryDelay: 1 })).rejects.toBeTruthy()
    expect(mocks.rawAxiosImpl.mock.calls.filter(([c]) => c.url === '/x/').length).toBe(1)
  })
})

// ── fetchCsrfTokenDirect ──────────────────────────────────────────

describe('fetchCsrfTokenDirect', () => {
  it('returns the token from the CSRF endpoint', async () => {
    const token = await fetchCsrfTokenDirect()
    expect(token).toBe('csrf-abc')
  })

  it('returns null on failure', async () => {
    mocks.rawAxiosImpl.mockImplementation(() => Promise.reject(new Error('down')))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const token = await fetchCsrfTokenDirect()
      expect(token).toBeNull()
    } finally {
      warnSpy.mockRestore()
    }
  })
})

describe('client — binary response errors', () => {
  it('decodes a JSON error blob before normalization', async () => {
    mocks.rawAxiosImpl.mockImplementation((config) => {
      if (config.url === '/auth/csrf/') {
        return Promise.resolve({ data: { token: 't' }, config })
      }
      return Promise.reject({
        response: {
          status: 400,
          data: new Blob(
            [JSON.stringify({ message: 'No questions matched' })],
            { type: 'application/json' },
          ),
        },
        config,
      })
    })

    await expect(
      apiClient.post('/pdf/', {}, { responseType: 'blob', rawResponse: true }),
    ).rejects.toMatchObject({ message: 'No questions matched', code: 400 })
  })
})
