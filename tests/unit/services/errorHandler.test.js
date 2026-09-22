// frontend/tests/unit/services/errorHandler.test.js
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      t: (key) => `[${key}]`,
    },
  },
}))

import { normalizeError } from '@/services/api/errorHandler'

describe('normalizeError — response present', () => {
  it('reads message from body.message', () => {
    const result = normalizeError({
      response: { status: 400, data: { message: 'bad input' } },
    })
    expect(result).toEqual({
      message: 'bad input',
      code: 400,
      details: null,
    })
  })

  it('reads message from body.error when body.message is absent', () => {
    const result = normalizeError({
      response: { status: 400, data: { error: 'oops' } },
    })
    expect(result.message).toBe('oops')
  })

  it('reads message from body.data.message', () => {
    const result = normalizeError({
      response: { status: 400, data: { data: { message: 'nested' } } },
    })
    expect(result.message).toBe('nested')
  })

  it('falls back to a translated serverError string', () => {
    const result = normalizeError({
      response: { status: 500, data: {} },
    })
    expect(result.message).toMatch(/errors\.serverError|serverError/)
  })

  it('reads details from body.data.details', () => {
    const result = normalizeError({
      response: {
        status: 400,
        data: { data: { details: { field: ['required'] } } },
      },
    })
    expect(result.details).toEqual({ field: ['required'] })
  })

  it('reads details from body.details as a fallback', () => {
    const result = normalizeError({
      response: {
        status: 400,
        data: { details: { field: ['required'] } },
      },
    })
    expect(result.details).toEqual({ field: ['required'] })
  })

  it('handles a response with no data object', () => {
    const result = normalizeError({ response: { status: 500 } })
    expect(result.code).toBe(500)
    expect(result.details).toBeNull()
  })
})

describe('normalizeError — network error', () => {
  it('returns code NETWORK when there is a request but no response', () => {
    const result = normalizeError({ request: {} })
    expect(result.code).toBe('NETWORK')
    expect(result.details).toBeNull()
  })
})

describe('normalizeError — plain error', () => {
  it('returns code UNKNOWN for an error with a message but no response or request', () => {
    const result = normalizeError(new Error('something broke'))
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toBe('something broke')
  })

  it('uses a translated fallback for an error with no message', () => {
    const result = normalizeError({})
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toMatch(/unexpectedError|common\.unexpectedError/)
  })

  it('handles null input', () => {
    const result = normalizeError(null)
    expect(result.code).toBe('UNKNOWN')
  })
})