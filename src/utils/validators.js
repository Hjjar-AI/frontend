// frontend/src/utils/validators.js
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
// `message` is produced by `i18n.global.t(reasonKey, params)` at call
// time, matching the pattern already used by
// `utils/questionValidators.js`. Callers that read `.message` get the
// correct locale text without any change; callers that prefer
// `.reasonKey` continue to work.
//
// The validators are pure with respect to their inputs; the only
// external dependency is the active locale, read from the global i18n
// instance. `MIN_PASSWORD_LENGTH` mirrors the backend's
// MinimumLengthValidator default — keep it in sync.

import { i18n } from '@/i18n'

export const MIN_PASSWORD_LENGTH = 6

function t(key, params) {
  return i18n.global.t(key, params || {})
}

export function validatePassword(password) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    const reasonKey = 'validation.passwordMin'
    const params = { min: MIN_PASSWORD_LENGTH }
    return {
      valid: false,
      message: t(reasonKey, params),
      reasonKey,
      params,
    }
  }
  return { valid: true, message: '', reasonKey: null, params: null }
}

export function validateLoginPassword(password) {
  if (!password) {
    const reasonKey = 'validation.passwordRequired'
    return {
      valid: false,
      message: t(reasonKey),
      reasonKey,
      params: null,
    }
  }
  return { valid: true, message: '', reasonKey: null, params: null }
}

export function validateUsername(username) {
  if (!username || username.length < 3) {
    const reasonKey = 'validation.usernameMin'
    return {
      valid: false,
      message: t(reasonKey),
      reasonKey,
      params: null,
    }
  }
  if (!/^[a-zA-Z0-9_\u0600-\u06FF]+$/.test(username)) {
    const reasonKey = 'validation.usernameChars'
    return {
      valid: false,
      message: t(reasonKey),
      reasonKey,
      params: null,
    }
  }
  return { valid: true, message: '', reasonKey: null, params: null }
}