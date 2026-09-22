// frontend/src/utils/formatCellValue.js
//
// i18n note: this utility has no access to a reactive `t()` at setup
// time (it is used in non-component contexts and is intentionally
// pure). Callers may supply pre-resolved `nullValue` strings, and are
// encouraged to do so:
//
//     formatCellValue(user.expires_at, {
//       nullValue: t('common.noData'),
//     })
//
// When a caller does NOT supply it, the default is resolved from the
// global i18n instance so the fallback text follows the active
// locale instead of being hardcoded Arabic. Passing an explicit
// string (including the em-dash `'—'`) still overrides the default.
//
// NOTE on the removed `indefinite` option: the previous implementation
// carried an `indefinite` sentinel keyed on the value `-1`, but no
// caller ever produced `-1` (the only caller passes a DateTime), and
// the fallback label it produced was the "no data" string rather than
// an "indefinite/unlimited" one. The branch was dead code and the
// name was misleading; both have been removed. If a future caller
// needs an "unlimited" label, reintroduce it under a name that
// describes what it actually does, keyed on an explicit sentinel the
// producer documents.

import { i18n } from '@/i18n'
import { formatDate, formatDateTime } from '@/utils/formatters'

export function formatCellValue(
  value,
  {
    nullValue = null,
    zeroValue = 0,
    type = 'text',
  } = {}
) {
  const t = i18n.global.t
  const resolvedNull = nullValue !== null && nullValue !== undefined
    ? nullValue
    : t('common.noData')

  if (value === null || value === undefined) return resolvedNull
  if (value === 0 && zeroValue !== 0) return zeroValue

  if (type === 'date') return formatDate(value)
  if (type === 'datetime') return formatDateTime(value)

  return value
}