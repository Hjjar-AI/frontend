// frontend/tests/unit/utils/validators.test.js
import { describe, it, expect } from 'vitest'
import {
  validatePassword,
  validateLoginPassword,
  validateUsername,
  MIN_PASSWORD_LENGTH,
} from '@/utils/validators'
import {
  validateChoices,
  validateCorrectAnswer,
  MIN_CHOICES,
} from '@/utils/questionValidators'

describe('validatePassword', () => {
  it('accepts a password at the minimum length', () => {
    const r = validatePassword('12345678')
    expect(r.valid).toBe(true)
    expect(r.message).toBe('')
    expect(r.reasonKey).toBeNull()
    expect(r.params).toBeNull()
  })

  it('rejects a short password with all four fields set', () => {
    const r = validatePassword('short')
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.passwordMin')
    expect(r.params).toEqual({ min: MIN_PASSWORD_LENGTH })
    expect(typeof r.message).toBe('string')
    expect(r.message.length).toBeGreaterThan(0)
  })

  it('rejects an empty password', () => {
    expect(validatePassword('').valid).toBe(false)
  })

  it('rejects null and undefined', () => {
    expect(validatePassword(null).valid).toBe(false)
    expect(validatePassword(undefined).valid).toBe(false)
  })
})

describe('validateLoginPassword', () => {
  it('accepts any non-empty string', () => {
    expect(validateLoginPassword('x').valid).toBe(true)
  })

  it('rejects an empty string', () => {
    const r = validateLoginPassword('')
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.passwordRequired')
  })
})

describe('validateUsername', () => {
  it('accepts a normal username', () => {
    expect(validateUsername('alice').valid).toBe(true)
  })

  it('accepts an Arabic username', () => {
    expect(validateUsername('محمد').valid).toBe(true)
  })

  it('accepts underscores and digits', () => {
    expect(validateUsername('a_b_1').valid).toBe(true)
  })

  it('rejects a username shorter than 3 characters', () => {
    const r = validateUsername('ab')
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.usernameMin')
  })

  it('rejects a username with forbidden characters', () => {
    const r = validateUsername('a b')
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.usernameChars')
  })

  it('rejects an empty username', () => {
    expect(validateUsername('').valid).toBe(false)
  })
})

describe('validateChoices', () => {
  it('accepts a valid list of two choices', () => {
    const r = validateChoices(['a', 'b'])
    expect(r.valid).toBe(true)
  })

  it('accepts up to the max_choices limit', () => {
    const r = validateChoices(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    expect(r.valid).toBe(true)
  })

  it('rejects fewer than the minimum', () => {
    const r = validateChoices(['a'])
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.minChoices')
    expect(r.params).toEqual({ min: MIN_CHOICES })
  })

  it('rejects more than the maximum', () => {
    const r = validateChoices(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'])
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.maxChoices')
  })

  it('ignores blank entries when counting', () => {
    const r = validateChoices(['a', 'b', '', '  ', ''])
    expect(r.valid).toBe(true)
  })

  it('rejects case-insensitive duplicate choices', () => {
    const r = validateChoices(['Answer', 'answer'])
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.duplicateChoice')
    expect(r.params).toEqual({ choice: 'answer' })
  })

  it('is not fooled by whitespace around duplicates', () => {
    const r = validateChoices(['a', '  a  '])
    expect(r.valid).toBe(false)
  })
})

describe('validateCorrectAnswer', () => {
  it('accepts a correct-answer index inside the filled range', () => {
    const r = validateCorrectAnswer(2, ['a', 'b', 'c'])
    expect(r.valid).toBe(true)
  })

  it('rejects an index of 0 with the correctAnswerEmpty error', () => {
    const r = validateCorrectAnswer(0, ['a', 'b'])
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.correctAnswerEmpty')
  })

  it('rejects an index beyond the filled range with the correctAnswerEmpty error', () => {
    const r = validateCorrectAnswer(5, ['a', 'b'])
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.correctAnswerEmpty')
  })

  it('rejects when the selected choice is blank', () => {
    const r = validateCorrectAnswer(3, ['a', 'b', ''])
    expect(r.valid).toBe(false)
    expect(r.reasonKey).toBe('validation.correctAnswerEmpty')
  })
})