// frontend/tests/unit/composables/useCrudActions.test.js
//
// Contract tests for the useCrudActions wrapper.
//
// WHY THIS FILE MATTERS MORE THAN THE OTHER COMPOSABLE TESTS
// ---------------------------------------------------------
// `useCrudActions.wrap()` is called by every store action in the
// codebase. Its responsibilities are:
//
//   • Loading-state bookkeeping (status / error) on the caller's
//     store, so a component can render a spinner while a request is
//     in flight.
//   • Success-toast suppression when the caller wants silent success.
//   • Error-toast suppression when the caller handles errors itself
//     (used by every "background refresh" call, e.g. fetchStreak).
//   • Response caching with a TTL and a bounded LRU.
//   • Prefix-based cache invalidation on write.
//   • `onSuccess` isolation — an `onSuccess` handler that throws
//     must NOT fail the caller, poison the cache, or otherwise
//     change the return value.
//
// A regression in any of those is invisible until a user sees a
// missing spinner, a missing toast, or a stale cached list. This
// file pins the contract.

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { notifyMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
}))

vi.mock('@/composables/useNotify', () => ({
  useNotify: () => ({ notify: notifyMock }),
}))

import {
  useCrudActions,
  clearCrudCache,
  invalidateCacheByPrefix,
} from '@/composables/useCrudActions'

// Plain object store — `_patchState` accepts either a Pinia store
// (via `$patch`) or a plain object (via `[key] = value`). A plain
// object is enough for these tests and keeps them independent of
// Pinia.
function makeStore() {
  return { status: 'idle', error: null }
}

beforeEach(() => {
  vi.clearAllMocks()
  // The cache is module-level, so tests must not leak into each
  // other. `clearCrudCache` is the documented way to reset it.
  clearCrudCache()
})

// ── Success path ───────────────────────────────────────────────────

describe('useCrudActions — success path', () => {
  it('sets status to loading then success', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    const seen = []
    const promise = wrap(async () => {
      seen.push(store.status)
      return { ok: true }
    })
    const result = await promise
    expect(result).toEqual({ ok: true })
    expect(store.status).toBe('success')
    expect(seen[0]).toBe('loading')
  })

  it('clears any stale error on entry', async () => {
    const store = makeStore()
    store.error = 'stale'
    const { wrap } = useCrudActions(store)
    await wrap(async () => ({}))
    expect(store.error).toBeNull()
  })

  it('calls onSuccess with the result', async () => {
    const store = makeStore()
    const onSuccess = vi.fn()
    const { wrap } = useCrudActions(store)
    await wrap(async () => ({ id: 1 }), { onSuccess })
    expect(onSuccess).toHaveBeenCalledWith({ id: 1 })
  })

  it('emits a success toast when successMsgKey is set', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    await wrap(async () => ({}), { successMsgKey: 'notifications.saved' })
    expect(notifyMock).toHaveBeenCalledTimes(1)
    const [msg, type] = notifyMock.mock.calls[0]
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
    expect(type).toBe('success')
  })

  it('does not emit a toast when no success message is configured', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    await wrap(async () => ({}))
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('passes interpolation params to the toast message', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    await wrap(async () => ({}), {
      successMsgKey: 'notifications.questionBulkVerified',
      successMsgParams: { count: 3 },
    })
    const [msg] = notifyMock.mock.calls[0]
    expect(msg).toContain('3')
  })
})

// ── Error path ─────────────────────────────────────────────────────

describe('useCrudActions — error path', () => {
  it('sets status to error and stores the message', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    await wrap(async () => { throw { message: 'boom', code: 500 } })
    expect(store.status).toBe('error')
    expect(store.error).toBe('boom')
  })

  it('returns null on error', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    const result = await wrap(async () => { throw { message: 'x' } })
    expect(result).toBeNull()
  })

  it('emits an error toast by default', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    await wrap(async () => { throw { message: 'offline' } })
    expect(notifyMock).toHaveBeenCalledTimes(1)
    const [msg, type] = notifyMock.mock.calls[0]
    expect(msg).toBe('offline')
    expect(type).toBe('error')
  })

  it('suppresses the error toast when requested', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    await wrap(async () => { throw { message: 'offline' } }, {
      suppressErrorToast: true,
    })
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('falls back to the i18n fallback key when the error has no message', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    await wrap(async () => { throw {} }, {
      errorMsgFallbackKey: 'notifications.questionsLoadFailed',
    })
    expect(store.error).toBeTruthy()
    expect(typeof store.error).toBe('string')
  })

  it('calls onError with the raw error', async () => {
    const store = makeStore()
    const onError = vi.fn()
    const err = { message: 'x', code: 500 }
    const { wrap } = useCrudActions(store)
    await wrap(async () => { throw err }, { onError })
    expect(onError).toHaveBeenCalledWith(err)
  })
})

// ── Custom status/error keys ───────────────────────────────────────

describe('useCrudActions — custom status/error keys', () => {
  it('writes to the requested keys', async () => {
    const store = {
      status: 'idle',
      error: null,
      subStatus: 'idle',
      subError: null,
    }
    const { wrap } = useCrudActions(store, {
      statusKey: 'subStatus',
      errorKey: 'subError',
    })
    await wrap(async () => ({}))
    expect(store.subStatus).toBe('success')
    expect(store.status).toBe('idle')  // untouched
  })
})

// ── Caching ────────────────────────────────────────────────────────

describe('useCrudActions — caching', () => {
  it('does not cache without a cacheKey', async () => {
    const store = makeStore()
    const callback = vi.fn(async () => ({ id: 1 }))
    const { wrap } = useCrudActions(store)
    await wrap(callback)
    await wrap(callback)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('caches with a cacheKey and returns the cached value on the second call', async () => {
    const store = makeStore()
    const callback = vi.fn(async () => ({ id: 1 }))
    const { wrap } = useCrudActions(store)
    await wrap(callback, { cacheKey: 'k1' })
    await wrap(callback, { cacheKey: 'k1' })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('replays onSuccess for a cache hit', async () => {
    const store = makeStore()
    const onSuccess = vi.fn()
    const { wrap } = useCrudActions(store)
    await wrap(async () => ({ id: 1 }), { cacheKey: 'k2' })
    await wrap(async () => ({ id: 2 }), { cacheKey: 'k2', onSuccess })
    expect(onSuccess).toHaveBeenCalledWith({ id: 1 })
  })

  it('deep-clones the cached value so the caller cannot mutate the cache', async () => {
    const store = makeStore()
    const { wrap } = useCrudActions(store)
    const first = await wrap(async () => ({ items: [1, 2] }), { cacheKey: 'k3' })
    first.items.push(3)
    const second = await wrap(async () => ({ items: ['miss'] }), { cacheKey: 'k3' })
    expect(second.items).toEqual([1, 2])
  })

  it('clearCrudCache wipes every cached entry', async () => {
    const store = makeStore()
    const callback = vi.fn(async () => ({ id: 1 }))
    const { wrap } = useCrudActions(store)
    await wrap(callback, { cacheKey: 'k4' })
    clearCrudCache()
    await wrap(callback, { cacheKey: 'k4' })
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('invalidateCacheByPrefix drops keys that match the prefix', async () => {
    const store = makeStore()
    const callbackA = vi.fn(async () => ({ id: 1 }))
    const callbackB = vi.fn(async () => ({ id: 2 }))
    const { wrap } = useCrudActions(store)
    await wrap(callbackA, { cacheKey: 'questions_a' })
    await wrap(callbackB, { cacheKey: 'other_b' })
    invalidateCacheByPrefix('questions_')

    await wrap(callbackA, { cacheKey: 'questions_a' })
    await wrap(callbackB, { cacheKey: 'other_b' })

    expect(callbackA).toHaveBeenCalledTimes(2)  // was invalidated
    expect(callbackB).toHaveBeenCalledTimes(1)  // still cached
  })

  it('invalidateOnSuccess drops the prefix before the write goes out', async () => {
    const store = makeStore()
    const readCallback = vi.fn(async () => ({ items: [] }))
    const writeCallback = vi.fn(async () => ({}))
    const { wrap } = useCrudActions(store)

    // Prime the cache under the `questions_` prefix.
    await wrap(readCallback, { cacheKey: 'questions_page1' })

    // Perform a write that invalidates the prefix.
    await wrap(writeCallback, { invalidateOnSuccess: 'questions_' })

    // The next read must hit the callback, not the cache.
    await wrap(readCallback, { cacheKey: 'questions_page1' })

    expect(readCallback).toHaveBeenCalledTimes(2)
  })

  it('accepts an array of prefixes in invalidateOnSuccess', async () => {
    const store = makeStore()
    const cbA = vi.fn(async () => ({}))
    const cbB = vi.fn(async () => ({}))
    const cbWrite = vi.fn(async () => ({}))
    const { wrap } = useCrudActions(store)

    await wrap(cbA, { cacheKey: 'aaa_1' })
    await wrap(cbB, { cacheKey: 'bbb_1' })
    await wrap(cbWrite, { invalidateOnSuccess: ['aaa_', 'bbb_'] })

    await wrap(cbA, { cacheKey: 'aaa_1' })
    await wrap(cbB, { cacheKey: 'bbb_1' })

    expect(cbA).toHaveBeenCalledTimes(2)
    expect(cbB).toHaveBeenCalledTimes(2)
  })
})

// ── onSuccess isolation ────────────────────────────────────────────

describe('useCrudActions — onSuccess isolation', () => {
  it('swallows a throw from onSuccess and still returns the result', async () => {
    const store = makeStore()
    // The composable logs the failure via console.error; silence it
    // so the test output stays clean. The assertion below is the
    // real contract.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { wrap } = useCrudActions(store)
      const result = await wrap(
        async () => ({ id: 1 }),
        { onSuccess: () => { throw new Error('handler bug') } },
      )
      expect(result).toEqual({ id: 1 })
      expect(store.status).toBe('success')
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('still writes the cache even when onSuccess throws', async () => {
    const store = makeStore()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const callback = vi.fn(async () => ({ id: 1 }))
      const { wrap } = useCrudActions(store)

      await wrap(callback, {
        cacheKey: 'k5',
        onSuccess: () => { throw new Error('nope') },
      })
      await wrap(callback, { cacheKey: 'k5' })

      expect(callback).toHaveBeenCalledTimes(1)
    } finally {
      errorSpy.mockRestore()
    }
  })
})