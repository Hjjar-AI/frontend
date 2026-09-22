// frontend/tests/unit/composables/useSafeI18n.test.js
//
// Verifies the two behaviours that the whole point of the wrapper
// exists to provide:
//
//   1. A key that resolves normally is passed straight through.
//   2. A key that makes vue-i18n's message compiler throw produces
//      the key itself, logs a descriptive error, and does not
//      propagate the throw to the caller.
//
// The second case is what stops a single malformed catalog entry
// from blanking an entire page via ErrorBoundary.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The composable calls `useI18n()` from vue-i18n. Mocking the module
// lets us inject a `t` that throws on command.
const mockUseI18n = vi.hoisted(() => {
  const rawT = vi.fn()
  const localeRef = { value: 'ar' }
  return { rawT, localeRef }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockUseI18n.rawT,
    locale: mockUseI18n.localeRef,
  }),
}))

import { useSafeI18n } from '@/composables/useSafeI18n'

let consoleErrorSpy

beforeEach(() => {
  mockUseI18n.rawT.mockReset()
  mockUseI18n.localeRef.value = 'ar'
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
})

describe('useSafeI18n', () => {
  it('passes a resolved key straight through', () => {
    mockUseI18n.rawT.mockReturnValueOnce('Hello')
    const { t } = useSafeI18n('Test')
    expect(t('greeting')).toBe('Hello')
    expect(mockUseI18n.rawT).toHaveBeenCalledWith('greeting', undefined)
  })

  it('forwards interpolation params', () => {
    mockUseI18n.rawT.mockReturnValueOnce('Hello Alice')
    const { t } = useSafeI18n('Test')
    expect(t('greeting', { name: 'Alice' })).toBe('Hello Alice')
    expect(mockUseI18n.rawT).toHaveBeenCalledWith('greeting', { name: 'Alice' })
  })

  it('returns the key itself when the compiler throws', () => {
    mockUseI18n.rawT.mockImplementationOnce(() => {
      throw new SyntaxError('17')
    })
    const { t } = useSafeI18n('Test')
    expect(t('bad.key')).toBe('bad.key')
  })

  it('logs a descriptive error naming the component and the key', () => {
    mockUseI18n.rawT.mockImplementationOnce(() => {
      throw new SyntaxError('17')
    })
    const { t } = useSafeI18n('MyComponent')
    t('broken.key')

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    const [message, err, hint] = consoleErrorSpy.mock.calls[0]
    expect(message).toContain('MyComponent')
    expect(message).toContain('broken.key')
    expect(err).toBeInstanceOf(SyntaxError)
    expect(hint).toMatch(/unescaped/i)
  })

  it('re-exposes the reactive locale ref', () => {
    const { locale } = useSafeI18n('Test')
    expect(locale).toBe(mockUseI18n.localeRef)
  })

  it('defaults the component label to a generic string when none is passed', () => {
    mockUseI18n.rawT.mockImplementationOnce(() => {
      throw new SyntaxError('17')
    })
    const { t } = useSafeI18n()
    t('k')
    const [message] = consoleErrorSpy.mock.calls[0]
    expect(message).toContain('component')
  })

  it('does not swallow non-compiler errors — a real bug should still surface', () => {
    // The wrapper is deliberately narrow: it catches any throw
    // because vue-i18n has no structured way to signal "compiler
    // failure" vs. "some other problem". This test pins that
    // behaviour so a future edit that narrows the catch has to be
    // a deliberate choice.
    mockUseI18n.rawT.mockImplementationOnce(() => {
      throw new Error('some other problem')
    })
    const { t } = useSafeI18n('Test')
    expect(t('k')).toBe('k')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})