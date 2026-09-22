// frontend/src/utils/questionValidators.js
//
// MIGRATION STRATEGY (i18n)
//
// Each validator returns `{ valid, reasonKey, params, message }`:
//
//   • `valid`     — the boolean callers branch on.
//   • `reasonKey` — an i18n key the caller can pass to `t()`.
//   • `params`    — interpolation values for the key.
//   • `message`   — a pre-resolved string in the CURRENT locale.
//
// `message` is now produced by `i18n.global.t(reasonKey, params)` at
// call time, so a caller that reads `.message` (e.g. the existing
// QuestionForm.vue flow) gets the correct locale text without any
// change. Callers that migrate to `.reasonKey` continue to work too.
//
// The validators are pure with respect to their inputs; the only
// external dependency is the current locale, read from the global
// i18n instance.

import { i18n } from '@/i18n'
import { FALLBACK_MAX_CHOICES } from '@/utils/constants'

function t(key, params) {
  return i18n.global.t(key, params || {})
}

export const MIN_CHOICES = 2

/**
 * Remove blank choices and remap the one-based correct-answer index.
 *
 * Question forms allow temporarily empty rows. Before a question is sent to
 * the API those rows must be removed without changing which remaining choice
 * is correct. Keeping that transformation here prevents the regular question
 * form and the two master-exam draft forms from drifting apart.
 */
export function normalizeQuestionChoices(choices, correctAnswer) {
  const normalizedChoices = []
  let normalizedCorrectAnswer = null

  choices.forEach((choice, index) => {
    const normalized = typeof choice === 'string' ? choice.trim() : ''
    if (!normalized) return

    normalizedChoices.push(normalized)
    if (index + 1 === correctAnswer) {
      normalizedCorrectAnswer = normalizedChoices.length
    }
  })

  return {
    choices: normalizedChoices,
    correctAnswer: normalizedCorrectAnswer,
  }
}

export function validateChoices(
  choices,
  minChoices = MIN_CHOICES,
  maxChoices = FALLBACK_MAX_CHOICES,
) {
  const filled = choices.filter((choice) => choice && choice.trim())

  if (filled.length < minChoices) {
    return {
      valid: false,
      reasonKey: 'validation.minChoices',
      params: { min: minChoices },
      message: t('validation.minChoices', { min: minChoices }),
    }
  }

  if (filled.length > maxChoices) {
    return {
      valid: false,
      reasonKey: 'validation.maxChoices',
      params: { max: maxChoices },
      message: t('validation.maxChoices', { max: maxChoices }),
    }
  }

  // Case-insensitive duplicate check (backend rejects these too).
  const seen = new Set()
  for (const c of filled) {
    const lower = c.trim().toLowerCase()
    if (seen.has(lower)) {
      return {
        valid: false,
        reasonKey: 'validation.duplicateChoice',
        params: { choice: c.trim() },
        message: t('validation.duplicateChoice', { choice: c.trim() }),
      }
    }
    seen.add(lower)
  }

  return { valid: true, reasonKey: null, params: null, message: '' }
}

export function validateCorrectAnswer(correctAnswer, choices, maxChoices = FALLBACK_MAX_CHOICES) {
  const selected = choices[correctAnswer - 1]
  if (!selected || !selected.trim()) {
    return {
      valid: false,
      reasonKey: 'validation.correctAnswerEmpty',
      params: null,
      message: t('validation.correctAnswerEmpty'),
    }
  }

  const filled = choices.filter((choice) => choice && choice.trim())
  const ceiling = Math.min(filled.length, maxChoices)

  if (correctAnswer < 1 || correctAnswer > ceiling) {
    return {
      valid: false,
      reasonKey: 'validation.correctAnswerRange',
      params: { max: ceiling },
      message: t('validation.correctAnswerRange', { max: ceiling }),
    }
  }

  return { valid: true, reasonKey: null, params: null, message: '' }
}
