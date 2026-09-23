// frontend/src/utils/fileValidation.js
//
// Shared file-type and file-size validator for upload surfaces.
//
// WHAT THIS REPLACES
// ------------------
// Three surfaces had three different checks:
//
//   • DropZone.vue          — validated drops only; a file picked
//                             through the browser's file dialog
//                             skipped the check entirely and relied
//                             on the `accept` attribute, which the
//                             browser treats as a hint.
//   • SimpleImportTab.vue   — extension check + size check, but only
//                             in the picked-file handler.
//   • StateImport.vue       — JSON/XLSX extension check only, no size check.
//
// The three accept-list formats already differed between the
// callers: DropZone takes a comma-separated `accept` string
// (".json,image/*,application/json"); the two admin surfaces take
// arrays of extensions ([".json"]). The helper below accepts the
// array form and treats each entry with the same three-way match the
// existing DropZone already implemented — extension, MIME wildcard,
// exact MIME — so a caller that was passing ".json" and a caller
// that was passing "image/*" both keep working without a translation
// step.
//
// RETURN SHAPE
// ------------
//   { ok: true,  reason: null, params: null }
//   { ok: false, reason: <code>, params: {...} }
//
// The helper does NOT translate. Each caller owns its own i18n keys
// and message wording, and two of the three callers already use
// different keys for the same underlying failure (badType vs.
// badTelegramType). Passing the reason code and params back lets
// each caller keep its own message.

export const FILE_VALIDATION_REASONS = {
  WRONG_TYPE: 'wrong-type',
  TOO_LARGE: 'too-large',
}

/**
 * The lowercased extension with its leading dot, or the raw
 * lowercased filename when there is no dot.
 *
 * Used both internally and by callers that want to include the
 * offending extension in an error message.
 */
export function extensionOf(filename) {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > -1
    ? filename.slice(lastDot).toLowerCase()
    : filename.toLowerCase()
}

/**
 * Validate a file against an accept list and an optional size limit.
 *
 * @param {File} file
 * @param {Object} options
 * @param {string[]} [options.allowedExtensions=[]]
 *        Accept list. Each entry is one of:
 *          • ".json"             — extension match, case-insensitive
 *          • "image/*"           — MIME wildcard match
 *          • "application/json"  — exact MIME match
 *        An empty list disables the type check.
 * @param {number} [options.maxSizeMb]
 *        Size limit in megabytes. Omit to disable the size check.
 * @returns {{ ok: boolean, reason: string|null, params: Object|null }}
 */
export function validateFile(file, options = {}) {
  const { allowedExtensions = [], maxSizeMb = null } = options

  if (!file) {
    return {
      ok: false,
      reason: FILE_VALIDATION_REASONS.WRONG_TYPE,
      params: { ext: '' },
    }
  }

  const lower = file.name.toLowerCase()
  const fileMime = (file.type || '').toLowerCase()
  const ext = extensionOf(file.name)

  if (allowedExtensions.length > 0) {
    const accepted = allowedExtensions.some((allowed) => {
      const a = allowed.toLowerCase()
      if (a.startsWith('.')) {
        return lower.endsWith(a)
      }
      if (a.endsWith('/*')) {
        return fileMime.startsWith(a.replace('/*', '/'))
      }
      return fileMime === a
    })

    if (!accepted) {
      return {
        ok: false,
        reason: FILE_VALIDATION_REASONS.WRONG_TYPE,
        params: { ext },
      }
    }
  }

  if (maxSizeMb != null) {
    const limit = maxSizeMb * 1024 * 1024
    if (file.size > limit) {
      return {
        ok: false,
        reason: FILE_VALIDATION_REASONS.TOO_LARGE,
        params: { size: file.size, max: maxSizeMb },
      }
    }
  }

  return { ok: true, reason: null, params: null }
}
