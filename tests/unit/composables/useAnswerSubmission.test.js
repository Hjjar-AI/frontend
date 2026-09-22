// frontend/tests/unit/composables/useAnswerSubmission.test.js
//
// Tests for the submission serialiser.
//
// WHY THE TAIL PATTERN MATTERS
// ----------------------------
// The composable keeps a promise chain:
//
//     const task = tail.then(() => store.submitAnswer(...))
//     tail = task.catch(() => {})
//     return task
//
// The `.catch()` reassignment is the load-bearing line. Without it
// (`tail = task`), a single rejected submit would poison every
// subsequent submit for the rest of the session: the caller's
// rejected promise would become the `tail`, and any new `task =
// tail.then(...)` would fire the next submit only after that
// rejection propagated — which the caller already handled, leaving
// the chain permanently in an error state.
//
// This file pins the recovery: after a failed submit, the next
// submit still fires.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAnswerSubmission } from '@/composables/useAnswerSubmission'

beforeEach(() => {
  setActivePinia(createPinia())
})

function makeStore(impl) {
  return {
    isSubmitLoading: false,
    submitAnswer: vi.fn(impl),
  }
}

describe('useAnswerSubmission', () => {
  it('forwards the arguments to store.submitAnswer', async () => {
    const store = makeStore(async () => 'ok')
    const { submitAnswer } = useAnswerSubmission(store)
    await submitAnswer(1, 'next', null, true, null)
    expect(store.submitAnswer).toHaveBeenCalledWith(1, 'next', null, true, null)
  })

  it('returns the result of store.submitAnswer', async () => {
    const store = makeStore(async () => ({ success: true }))
    const { submitAnswer } = useAnswerSubmission(store)
    const result = await submitAnswer(1)
    expect(result).toEqual({ success: true })
  })

  it('serializes concurrent calls: the second waits for the first', async () => {
    const order = []
    let resolveFirst
    const store = makeStore(async (n) => {
      if (n === 1) {
        order.push('start1')
        await new Promise((r) => { resolveFirst = r })
        order.push('end1')
      } else {
        order.push('start2')
        order.push('end2')
      }
      return n
    })
    const { submitAnswer } = useAnswerSubmission(store)

    const p1 = submitAnswer(1)
    const p2 = submitAnswer(2)

    // The second submit has not started yet.
    await Promise.resolve()
    expect(order).toEqual(['start1'])

    resolveFirst()
    await Promise.all([p1, p2])
    expect(order).toEqual(['start1', 'end1', 'start2', 'end2'])
  })

  it('allows a subsequent submit after a rejection', async () => {
    // This is the recovery contract. Without the `tail = task.catch(...)`
    // line, this test would time out.
    let callCount = 0
    const store = makeStore(async () => {
      callCount++
      if (callCount === 1) throw new Error('boom')
      return 'second ok'
    })
    const { submitAnswer } = useAnswerSubmission(store)

    await expect(submitAnswer(1)).rejects.toThrow('boom')

    // The second call must not be blocked by the rejection.
    const result = await submitAnswer(2)
    expect(result).toBe('second ok')
    expect(callCount).toBe(2)
  })

  it('delivers the rejection to the caller of the failed submit, not the next one', async () => {
    const store = makeStore(async () => { throw new Error('boom') })
    const { submitAnswer } = useAnswerSubmission(store)

    const p = submitAnswer(1)
    await expect(p).rejects.toThrow('boom')
  })

  it('does not swallow the rejection by returning a resolved promise', async () => {
    const store = makeStore(async () => { throw new Error('specific-error') })
    const { submitAnswer } = useAnswerSubmission(store)

    // The exact error must reach the caller — a generic "submission
    // failed" would lose the distinction between a network error
    // and a TIME_EXPIRED that should route away.
    await expect(submitAnswer(1)).rejects.toThrow('specific-error')
  })
})