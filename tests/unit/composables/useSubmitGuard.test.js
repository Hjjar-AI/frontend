// frontend/tests/unit/composables/useSubmitGuard.test.js
import { describe, it, expect, vi } from 'vitest'
import { useSubmitGuard } from '@/composables/useSubmitGuard'

describe('useSubmitGuard', () => {
  it('starts idle', () => {
    const { isSubmitting } = useSubmitGuard()
    expect(isSubmitting.value).toBe(false)
  })

  it('runs the callback and returns its result', async () => {
    const { guard } = useSubmitGuard()
    const fn = vi.fn().mockResolvedValue({ id: 1 })
    const result = await guard(fn)
    expect(result).toEqual({ id: 1 })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('sets isSubmitting during the call and clears it after', async () => {
    const { guard, isSubmitting } = useSubmitGuard()
    let seenWhileRunning = null
    const fn = async () => {
      seenWhileRunning = isSubmitting.value
      return 'ok'
    }
    await guard(fn)
    expect(seenWhileRunning).toBe(true)
    expect(isSubmitting.value).toBe(false)
  })

  it('ignores a second call while one is in flight', async () => {
    const { guard } = useSubmitGuard()
    let resolveFirst
    const first = () => new Promise((r) => { resolveFirst = r })
    const second = vi.fn().mockResolvedValue('second')

    const p1 = guard(first)
    const p2 = guard(second)

    // The second call returns immediately with undefined, without
    // invoking its callback.
    await expect(p2).resolves.toBeUndefined()
    expect(second).not.toHaveBeenCalled()

    resolveFirst('first')
    await expect(p1).resolves.toBe('first')
  })

  it('propagates the error to the caller and resets isSubmitting', async () => {
    const { guard, isSubmitting } = useSubmitGuard()
    const fn = vi.fn().mockRejectedValue(new Error('boom'))

    await expect(guard(fn)).rejects.toThrow('boom')
    expect(isSubmitting.value).toBe(false)
  })

  it('allows a retry after a failed call', async () => {
    const { guard } = useSubmitGuard()
    await expect(
      guard(() => Promise.reject(new Error('x'))),
    ).rejects.toThrow()
    const ok = await guard(() => Promise.resolve('second try'))
    expect(ok).toBe('second try')
  })

  it('the returned guard is stable across calls', async () => {
    const { guard } = useSubmitGuard()
    const a = guard
    const b = guard
    expect(a).toBe(b)
  })
})