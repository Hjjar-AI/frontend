// frontend/tests/unit/stores/toastStore.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useToastStore } from '@/stores/toastStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toastStore — addToast', () => {
  it('pushes a toast and returns a numeric id', () => {
    const store = useToastStore()
    const id = store.addToast('Hello', 'success')
    expect(typeof id).toBe('number')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].message).toBe('Hello')
    expect(store.toasts[0].type).toBe('success')
  })

  it('increments the id counter across calls', () => {
    const store = useToastStore()
    const id1 = store.addToast('A', 'info')
    const id2 = store.addToast('B', 'info')
    expect(id2).toBe(id1 + 1)
  })

  it('removes the toast after the duration elapses', () => {
    const store = useToastStore()
    store.addToast('Bye', 'info', 1000)
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1000)
    expect(store.toasts).toHaveLength(0)
  })

  it('does not schedule removal when duration is 0', () => {
    const store = useToastStore()
    store.addToast('Sticky', 'info', 0)
    vi.advanceTimersByTime(10_000)
    expect(store.toasts).toHaveLength(1)
  })

  it('preserves insertion order (newest last)', () => {
    const store = useToastStore()
    store.addToast('First', 'info', 0)
    store.addToast('Second', 'info', 0)
    expect(store.toasts.map(t => t.message)).toEqual(['First', 'Second'])
  })
})

describe('toastStore — removeToast', () => {
  it('removes the toast by id', () => {
    const store = useToastStore()
    const id = store.addToast('X', 'info', 0)
    store.addToast('Y', 'info', 0)
    store.removeToast(id)
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].message).toBe('Y')
  })

  it('is a no-op for an unknown id', () => {
    const store = useToastStore()
    store.addToast('X', 'info', 0)
    store.removeToast(9999)
    expect(store.toasts).toHaveLength(1)
  })

  it('is a no-op when the same id is removed twice', () => {
    const store = useToastStore()
    const id = store.addToast('X', 'info', 0)
    store.removeToast(id)
    store.removeToast(id)
    expect(store.toasts).toHaveLength(0)
  })
})

describe('toastStore — reset', () => {
  it('clears all toasts and resets the counter', () => {
    const store = useToastStore()
    store.addToast('X', 'info', 0)
    store.addToast('Y', 'info', 0)
    store.reset()
    expect(store.toasts).toEqual([])
    expect(store.nextId).toBe(1)
  })
})