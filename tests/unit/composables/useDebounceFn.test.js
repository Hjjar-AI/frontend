// frontend/tests/unit/composables/useDebounceFn.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import { useDebounceFn } from '@/composables/useDebounceFn'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

function makeWrapper(fn, delay) {
  return mount(defineComponent({
    setup() { return useDebounceFn(fn, delay) },
    render() { return h('div') },
  }))
}

describe('useDebounceFn', () => {
  it('does not call the function before the delay elapses', () => {
    const fn = vi.fn()
    const w = makeWrapper(fn, 300)
    w.vm.debounced('a')
    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    w.unmount()
  })

  it('calls the function after the delay', () => {
    const fn = vi.fn()
    const w = makeWrapper(fn, 300)
    w.vm.debounced('a')
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledWith('a')
    w.unmount()
  })

  it('collapses a rapid burst into a single trailing call', () => {
    const fn = vi.fn()
    const w = makeWrapper(fn, 300)
    w.vm.debounced('a')
    vi.advanceTimersByTime(100)
    w.vm.debounced('b')
    vi.advanceTimersByTime(100)
    w.vm.debounced('c')
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
    w.unmount()
  })

  it('forwards multiple arguments', () => {
    const fn = vi.fn()
    const w = makeWrapper(fn, 100)
    w.vm.debounced('x', 2, { y: true })
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('x', 2, { y: true })
    w.unmount()
  })

  it('cancel() prevents a pending call from firing', () => {
    const fn = vi.fn()
    const w = makeWrapper(fn, 300)
    w.vm.debounced('a')
    w.vm.cancel()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
    w.unmount()
  })

  it('cancel is a no-op when nothing is pending', () => {
    const fn = vi.fn()
    const w = makeWrapper(fn, 300)
    expect(() => w.vm.cancel()).not.toThrow()
    w.unmount()
  })

  it('cancels a pending call on unmount', () => {
    const fn = vi.fn()
    const w = makeWrapper(fn, 300)
    w.vm.debounced('a')
    w.unmount()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })
})