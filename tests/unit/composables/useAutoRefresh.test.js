// frontend/tests/unit/composables/useAutoRefresh.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

import { useAutoRefresh } from '@/composables/useAutoRefresh'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function makeWrapper(fetchFn, intervalMs, immediate = false) {
  return mount(defineComponent({
    setup() { return useAutoRefresh(fetchFn, intervalMs, immediate) },
    render() { return h('div') },
  }))
}

describe('useAutoRefresh — interval firing', () => {
  it('fires the fetch function on the interval', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true })
    const w = makeWrapper(fetchFn, 1000)
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(fetchFn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(fetchFn).toHaveBeenCalledTimes(2)
    w.unmount()
  })

  it('calls refresh immediately when immediate is true', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true })
    const w = makeWrapper(fetchFn, 1000, true)
    await nextTick()
    expect(fetchFn).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('does not call refresh immediately when immediate is false', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true })
    const w = makeWrapper(fetchFn, 1000, false)
    await nextTick()
    expect(fetchFn).not.toHaveBeenCalled()
    w.unmount()
  })
})

describe('useAutoRefresh — lastUpdated', () => {
  it('sets lastUpdated after a successful refresh', async () => {

    const fetchFn = vi.fn().mockResolvedValue({ ok: true })
    const w = makeWrapper(fetchFn, 1000, false)
    await w.vm.refresh()
    expect(w.vm.lastUpdated).toBeInstanceOf(Date)
    w.unmount()
  })
})

describe('useAutoRefresh — error handling', () => {
  it('does not throw when a fetch rejects', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const w = makeWrapper(fetchFn, 1000, true)
      await nextTick()
      await nextTick()
      expect(fetchFn).toHaveBeenCalled()
      w.unmount()
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('stops the interval after MAX_CONSECUTIVE_ERRORS failures', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = makeWrapper(fetchFn, 10, true)
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(50_000)
        await nextTick()
      }
      const callsAfterStop = fetchFn.mock.calls.length
      vi.advanceTimersByTime(1_000_000)
      await nextTick()
      expect(fetchFn.mock.calls.length).toBe(callsAfterStop)
      w.unmount()
    } finally {
      errorSpy.mockRestore()
      warnSpy.mockRestore()
    }
  })

  it('resets the backoff after a successful refresh', async () => {
    let fail = true
    const fetchFn = vi.fn(async () => {
      if (fail) throw new Error('boom')
      return { ok: true }
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const w = makeWrapper(fetchFn, 1000, true)
      await nextTick()
      vi.advanceTimersByTime(10_000)
      await nextTick()
      fail = false
      vi.advanceTimersByTime(100_000)
      await nextTick()
      const before = fetchFn.mock.calls.length
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(fetchFn.mock.calls.length).toBeGreaterThan(before)
      w.unmount()
    } finally {
      errorSpy.mockRestore()
    }
  })
})

describe('useAutoRefresh — visibility gating', () => {
  it('stops refreshing when the document goes hidden', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true })
    const w = makeWrapper(fetchFn, 1000, false)

    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))

    const before = fetchFn.mock.calls.length
    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(fetchFn.mock.calls.length).toBe(before)

    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(fetchFn.mock.calls.length).toBeGreaterThan(before)
    w.unmount()
  })
})

describe('useAutoRefresh — unmount', () => {
  it('clears the interval on unmount', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true })
    const w = makeWrapper(fetchFn, 1000, false)
    w.unmount()
    vi.advanceTimersByTime(10_000)
    expect(fetchFn).not.toHaveBeenCalled()
  })
})