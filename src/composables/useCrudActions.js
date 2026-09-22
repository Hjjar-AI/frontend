// frontend/src/composables/useCrudActions.js
import { useNotify } from './useNotify'
import { i18n } from '@/i18n'

// Module-level cache shared across all useCrudActions instances.
//
// The cache is bounded in two ways and only two ways:
//
//   • Lazy expiry-on-read — when `wrap` finds a cached entry whose
//     TTL has elapsed, it deletes it inline and falls through to the
//     live fetch. (See the first branch inside `wrap`.)
//
//   • LRU-at-cap eviction — when a write pushes `cache.size` to
//     `MAX_CACHE_SIZE`, the oldest inserted key is removed before
//     the new entry is inserted.
//
// A third path used to exist: a periodic full-cache sweep every
// `SWEEP_INTERVAL` writes that iterated every entry and dropped the
// expired ones. It was removed because the two paths above already
// cover both cases that matter (a stale entry that is read again,
// and a full cache), and the sweep was O(cache size) per 100 writes
// — 100 iterations of work per write on average — spent entirely on
// cleaning up entries no caller had asked about.
const cache = new Map()
const DEFAULT_CACHE_TTL = 3000
const MAX_CACHE_SIZE = 10000

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function deepClone(value) {
  if (value === null || typeof value !== 'object') return value
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // fall through to JSON
    }
  }
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    // fall through to shallow
  }
  if (Array.isArray(value)) return [...value]
  if (isPlainObject(value)) return { ...value }
  return value
}

export function clearCrudCache() {
  cache.clear()
}

export function invalidateCacheByPrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

function resolveSuccessMessage(opts) {
  if (opts.successMsgKey) {
    return i18n.global.t(opts.successMsgKey, opts.successMsgParams || {})
  }
  return opts.successMsg || null
}

export function useCrudActions(store, options = {}) {
  const { notify } = useNotify()

  const statusKey = resolveStateKey(store, options.statusKey || 'status', 'status')
  const errorKey = resolveStateKey(store, options.errorKey || 'error', 'error')

  async function wrap(callback, opts = {}) {
    const {
      successMsg = null,
      successMsgKey = null,
      successMsgParams = null,

      errorMsgFallback = null,
      errorMsgFallbackKey = null,
      onSuccess = null,
      onError = null,
      cacheKey = null,
      cacheTtlMs = DEFAULT_CACHE_TTL,
      suppressErrorToast = false,
      invalidateOnSuccess = null,
    } = opts

    if (cacheKey && cache.has(cacheKey)) {
      const { data, timestamp, ttl } = cache.get(cacheKey)
      if (Date.now() - timestamp < ttl) {
        const cachedCopy = deepClone(data)
        _patchState(store, statusKey, 'success')
        _patchState(store, errorKey, null)
        if (onSuccess) {
          // Same contract as the success path below: a throw inside
          // the store's success handler must not affect the
          // wrapper's control flow, the cache, or the caller's
          // return value.
          await runOnSuccessSafely(onSuccess, cachedCopy)
        }
        return cachedCopy
      }
      // Stale entry: delete inline. This is the only path that
      // removes entries between the LRU-at-cap eviction and now,
      // and it runs exactly once per stale key.
      cache.delete(cacheKey)
    }

    _patchState(store, statusKey, 'loading')
    _patchState(store, errorKey, null)

    try {
      const result = await callback()

      _patchState(store, statusKey, 'success')

      if (invalidateOnSuccess) {
        const prefixes = Array.isArray(invalidateOnSuccess)
          ? invalidateOnSuccess
          : [invalidateOnSuccess]
        for (const p of prefixes) invalidateCacheByPrefix(p)
      }

      if (cacheKey) {
        if (cache.size >= MAX_CACHE_SIZE) {
          // Map preserves insertion order; the first key is the
          // oldest insertion. Note: an entry that was updated via
          // `.set()` on an existing key does NOT move to the end of
          // the insertion order — insertion order tracks first-seen,
          // not last-write. That means the eviction is FIFO-by-
          // insertion rather than strict LRU. It is a deliberate
          // tradeoff: strict LRU would require a doubly-linked list
          // or an ordered structure on every read, and the cache
          // hit rate under the FIFO policy is adequate for this
          // app's access pattern (each list view re-reads its own
          // pagination key, so hot keys are re-inserted on TTL
          // expiry and stay recent).
          const oldestKey = cache.keys().next().value
          cache.delete(oldestKey)
        }

        const dataToCache = deepClone(result)

        cache.set(cacheKey, {
          data: dataToCache,
          timestamp: Date.now(),
          ttl: cacheTtlMs,
        })
      }

      const resolvedMsg = resolveSuccessMessage({ successMsg, successMsgKey, successMsgParams })
      if (resolvedMsg) notify(resolvedMsg, 'success')

      if (onSuccess) {
        await runOnSuccessSafely(onSuccess, result)
      }

      return result
    } catch (err) {

      const msg = err?.message
        || (errorMsgFallbackKey
          ? i18n.global.t(errorMsgFallbackKey)
          : (errorMsgFallback || i18n.global.t('common.unexpectedError')))

      _patchState(store, statusKey, 'error')
      _patchState(store, errorKey, msg)

      if (!suppressErrorToast) {
        notify(msg, 'error')
      }
      if (onError) onError(err)
      return null
    }
  }

  return { wrap }
}

async function runOnSuccessSafely(onSuccess, result) {
  try {
    await onSuccess(result)
  } catch (successErr) {
    // eslint-disable-next-line no-console
    console.error('[useCrudActions] onSuccess handler threw:', successErr)
  }
}

function _patchState(store, key, value) {
  if (typeof store.$patch === 'function') {
    store.$patch({ [key]: value })
  } else {
    store[key] = value
  }
}

function resolveStateKey(store, requested, fallback) {
  const hasKey = (key) => {
    if (!store) return false
    if (store.$state && Object.prototype.hasOwnProperty.call(store.$state, key)) return true
    if (Object.prototype.hasOwnProperty.call(store, key)) return true
    return false
  }
  if (hasKey(requested)) return requested
  if (requested !== fallback) {
    // eslint-disable-next-line no-console
    console.warn(
      `[useCrudActions] statusKey/errorKey "${requested}" is not declared on store "${store?.$id}". ` +
      `Falling back to "${fallback}". Declare the key in the store's state if you need it.`
    )
  }
  return fallback
}