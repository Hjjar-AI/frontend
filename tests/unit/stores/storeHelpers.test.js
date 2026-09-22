// frontend/tests/unit/stores/storeHelpers.test.js
import { describe, it, expect } from 'vitest'
import {
  standardState,
  standardGetters,
  subResourceState,
  subResourceGetters,
  makeReset,
} from '@/stores/storeHelpers'

describe('standardState', () => {
  it('seeds status and error and merges the caller extras', () => {
    const state = standardState({ user: null })
    expect(state).toEqual({ status: 'idle', error: null, user: null })
  })

  it('caller keys override the seeds', () => {
    const state = standardState({ status: 'ready' })
    expect(state.status).toBe('ready')
  })
})

describe('standardGetters.isLoading', () => {
  it('is true only when status is loading', () => {
    const g = standardGetters.isLoading
    expect(g({ status: 'loading' })).toBe(true)
    expect(g({ status: 'idle' })).toBe(false)
    expect(g({ status: 'success' })).toBe(false)
    expect(g({ status: 'error' })).toBe(false)
  })
})

describe('subResourceState', () => {
  it('produces the status/error pair for the given name', () => {
    const fragment = subResourceState('unverified')
    expect(fragment).toEqual({
      unverifiedStatus: 'idle',
      unverifiedError: null,
    })
  })
})

describe('subResourceGetters', () => {
  it('generates camel-cased isLoading and HasError getters', () => {
    const getters = subResourceGetters('unverified')
    expect(getters).toHaveProperty('isUnverifiedLoading')
    expect(getters).toHaveProperty('unverifiedHasError')
  })

  it('isLoading reads the status field', () => {
    const g = subResourceGetters('unverified').isUnverifiedLoading
    expect(g({ unverifiedStatus: 'loading' })).toBe(true)
    expect(g({ unverifiedStatus: 'idle' })).toBe(false)
  })

  it('HasError requires both error status and a message', () => {
    const g = subResourceGetters('unverified').unverifiedHasError
    expect(g({ unverifiedStatus: 'error', unverifiedError: 'x' })).toBe(true)
    expect(g({ unverifiedStatus: 'error', unverifiedError: null })).toBe(false)
    expect(g({ unverifiedStatus: 'idle', unverifiedError: 'x' })).toBe(false)
  })
})

describe('makeReset', () => {
  it('assigns each key in the defaults onto the instance', () => {
    const reset = makeReset({ a: 1, b: null })
    const target = { a: 99, b: 'stale', keep: 'yes' }
    reset.call(target)
    expect(target.a).toBe(1)
    expect(target.b).toBeNull()
    // `makeReset` uses Object.assign, so keys not in defaults are
    // left untouched. This is the documented behavior.
    expect(target.keep).toBe('yes')
  })
})