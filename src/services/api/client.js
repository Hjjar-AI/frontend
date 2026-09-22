// frontend/src/services/api/client.js
import axios from 'axios'
import { API_BASE, ENDPOINTS } from './endpoints'
import { normalizeError } from './errorHandler'
import { i18n } from '@/i18n'
import {
  getCsrfToken,
  getCsrfPromise,
  getCsrfGeneration,
  setCsrfPromise,
  setCsrfToken,
  clearCsrfToken,
} from './csrfTokenStore'

const client = axios.create({
  baseURL: API_BASE + '/',
  withCredentials: true,
})

const pendingRequests = new Map()
let sessionExpiryPromise = null

async function fetchCsrfToken() {
  try {
    const response = await client.get(ENDPOINTS.AUTH.CSRF, { skipCsrf: true })
    return response.token
  } catch (err) {
    console.warn('Failed to fetch CSRF token:', err)
    return null
  }
}

function ensureCsrfToken() {
  const cached = getCsrfToken()
  if (cached) return Promise.resolve(cached)

  const pending = getCsrfPromise()
  if (pending) return pending

  const generation = getCsrfGeneration()
  const promise = fetchCsrfToken()
    .then(token => {
      if (!setCsrfToken(token, generation)) {
        // This fetch began before the token was invalidated. Never
        // return its stale result to the waiting mutation. If a new
        // generation already has a fetch in flight, join it;
        // otherwise let the request continue without a token so a
        // CSRF rejection can enter the bounded recovery path below.
        const currentPromise = getCsrfPromise()
        return currentPromise && currentPromise !== promise
          ? currentPromise
          : getCsrfToken()
      }
      return token
    })
    .catch(err => {
      setCsrfToken(null, generation)
      throw err
    })
  setCsrfPromise(promise, generation)
  return promise
}

// ── Request identity ──────────────────────────────────────────────
//
// `getRequestKey` builds the key used by the in-flight-mutation map
// to cancel a duplicate of the same request. Its purpose is to stop
// a double-clicked submit from issuing two mutations; it is not a
// content hash and does not need to distinguish payloads byte for
// byte.
//
// The previous implementation collapsed every binary body to
// `[binary:FormData]` / `[binary:Blob]` / `[binary:ArrayBuffer]`.
// That works for the double-click case (identical file, identical
// key) but is wrong for any OTHER pair of concurrent FormData POSTs
// to the same URL: the second call cancelled the first even though
// the two payloads were distinct. The concrete failure was a
// scripted batch importing two different backup files back-to-back
// — the second import cancelled the first.
//
// `describeFormData` produces a bounded, content-aware identity for
// a FormData instance. For each entry it records:
//   • the field name,
//   • for a File/Blob value: the file name and byte size,
//   • for any other value: up to 100 characters of its string form.
//
// Scalars are truncated so a very large text field cannot make the
// cache key arbitrarily long. The file-name+size pair in the same
// key makes collisions on truncated scalars effectively impossible
// in practice.
function describeFormData(formData) {
  const parts = []
  try {
    for (const [key, value] of formData.entries()) {
      if (value && typeof value === 'object' && typeof value.size === 'number') {
        // File or Blob.
        const name = typeof value.name === 'string' ? value.name : ''
        parts.push(`${key}\u0001${name}\u0001${value.size}`)
      } else {
        parts.push(`${key}\u0001${String(value).slice(0, 100)}`)
      }
    }
  } catch {
    // `entries()` is standard everywhere this app targets. The
    // defensive branch keeps the key well-formed rather than
    // throwing inside the request interceptor if some environment
    // ever hands us an exotic FormData-like object.
    return '[formdata:unknown]'
  }
  return `[formdata:${parts.join('\u0002')}]`
}

function getRequestKey(config) {
  let bodyKey = ''
  if (config.data) {
    if (config.data instanceof FormData) {
      bodyKey = describeFormData(config.data)
    } else if (config.data instanceof Blob) {
      bodyKey = `[blob:${config.data.size}:${config.data.type || ''}]`
    } else if (config.data instanceof ArrayBuffer) {
      bodyKey = `[arraybuffer:${config.data.byteLength}]`
    } else {
      try {
        bodyKey = JSON.stringify(config.data)
      } catch {
        bodyKey = '[unserializable]'
      }
    }
  }
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}:${bodyKey}`
}

function isMutationMethod(method) {
  return ['post', 'put', 'delete', 'patch'].includes((method || '').toLowerCase())
}

function clearPendingEntry(config) {
  if (!config || !isMutationMethod(config.method)) return
  const key = getRequestKey(config)
  const entry = pendingRequests.get(key)
  if (entry && entry.token === config.cancelToken) {
    pendingRequests.delete(key)
  }
}

// Whether a 403 is a CSRF rejection (as opposed to a real permission
// denial). Both arrive with HTTP 403; only the CSRF one has
// `detail: "CSRF Failed: ..."` in the response body, which
// normalizeError() surfaces on `err.message`.
//
// Prior to this narrowing, ANY 403 triggered the CSRF-retry path.
// A capability rejection cost a second round-trip for no benefit,
// and a persistent 403 doubled its own latency.
function isCsrfRejection(err) {
  if (err?.code !== 403) return false
  const msg = typeof err.message === 'string' ? err.message : ''
  return msg.toLowerCase().includes('csrf')
}

function isLoginRequest(config) {
  return config?.url === ENDPOINTS.AUTH.LOGIN
}

function expireSessionAndRedirect() {
  if (sessionExpiryPromise) return sessionExpiryPromise

  // Drop the token immediately. Loading the auth store and router is
  // intentionally dynamic to keep client -> authStore -> authService
  // -> client from becoming a static import cycle.
  clearCsrfToken()

  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`

  sessionExpiryPromise = Promise.all([
    import('@/stores/authStore'),
    import('@/router'),
  ])
    .then(async ([{ useAuthStore }, { default: router }]) => {
      const authStore = useAuthStore()
      authStore.clearSession()

      if (router.currentRoute.value.name !== 'Login') {
        await router.replace({
          name: 'Login',
          query: { redirect },
        })
      }
    })
    .catch(() => {
      const loginUrl = new URL('/login', window.location.origin)
      loginUrl.searchParams.set('redirect', redirect)
      window.location.replace(loginUrl.toString())
    })
    .finally(() => {
      sessionExpiryPromise = null
    })

  return sessionExpiryPromise
}

client.interceptors.request.use(async (config) => {
  // Accept-Language drives Django's LocaleMiddleware, which selects
  // the language DRF uses for its own built-in error messages
  // ("This field is required", "Authentication credentials were not
  // provided", ...). The active locale is the i18n singleton's
  // current value; it is always defined by the time a request fires
  // because main.js mounts the app only after i18n is initialized.
  config.headers['Accept-Language'] = i18n.global.locale.value

  if (!config.skipCsrf && isMutationMethod(config.method)) {
    try {
      const token = await ensureCsrfToken()
      if (token) {
        config.headers['X-CSRFToken'] = token
      }
    } catch (e) {
      console.warn('Unable to obtain CSRF token, request may fail:', e)
    }
  }

  if (isMutationMethod(config.method)) {
    const key = getRequestKey(config)
    if (pendingRequests.has(key)) {
      const entry = pendingRequests.get(key)
      entry.cancel()
      pendingRequests.delete(key)
    }
    const source = axios.CancelToken.source()
    config.cancelToken = source.token
    pendingRequests.set(key, { token: source.token, cancel: source.cancel })
  }

  return config
}, (error) => Promise.reject(error))

client.interceptors.response.use(
  (response) => {
    clearPendingEntry(response.config)

    const body = response.data
    if (body && typeof body === 'object' && 'code' in body && 'message' in body) {
      if ('details' in body) {
        return Promise.reject({ message: body.message, code: body.code, details: body.details ?? null })
      }
      if ('data' in body) {
        if (body.data === null || body.data === undefined) {
          return { message: body.message }
        }
        return body.data
      }
    }
    return body
  },
  async (error) => {
    clearPendingEntry(error.config)

    if (axios.isCancel(error)) {
      return Promise.reject({
        message: i18n.global.t('errors.requestCancelled'),
        code: 'CANCEL',
        details: null,
      })
    }

    if (error.response?.status === 401 && !isLoginRequest(error.config)) {
      await expireSessionAndRedirect()
      return Promise.reject({
        message: i18n.global.t('errors.sessionExpired'),
        code: 401,
      })
    }

    const normalized = normalizeError(error)
    return Promise.reject(normalized)
  }
)

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

async function request(config, retryOptions = {}) {
  const { maxRetries = 1, retryDelay = 1000 } = retryOptions
  const method = (config.method || 'GET').toUpperCase()
  const isIdempotent = IDEMPOTENT_METHODS.has(method)

  let attempt = 0
  let csrfRecoveryRemaining = isIdempotent ? 0 : 1

  while (true) {
    try {
      return await client(config)
    } catch (err) {
      // CSRF recovery — narrow to CSRF-specific 403s only. A
      // capability rejection must not pay this cost.
      if (csrfRecoveryRemaining > 0 && isCsrfRejection(err)) {
        csrfRecoveryRemaining -= 1
        clearCsrfToken()
        continue
      }

      const isTransient = err?.code === 'NETWORK' ||
        (typeof err?.code === 'number' && err.code >= 500)

      if (
        err?.code === 'CANCEL' ||
        !isIdempotent ||
        !isTransient ||
        attempt >= maxRetries
      ) {
        throw err
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      attempt += 1
    }
  }
}

export const apiClient = {
  get: (url, config = {}, retry = {}) => request({ method: 'GET', url, ...config }, retry),
  post: (url, data, config = {}, retry = {}) => request({ method: 'POST', url, data, ...config }, retry),
  put: (url, data, config = {}, retry = {}) => request({ method: 'PUT', url, data, ...config }, retry),
  delete: (url, config = {}, retry = {}) => request({ method: 'DELETE', url, ...config }, retry),
}

export async function fetchCsrfTokenDirect() {
  return fetchCsrfToken()
}
