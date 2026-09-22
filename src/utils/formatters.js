// frontend/src/utils/formatters.js
//
// Locale-aware date and number formatters for non-component contexts.
//
// i18n note: this module is a plain utility — it cannot use
// `useI18n()` because it is called from stores, services, and other
// utilities. Instead it reads the active locale from the global i18n
// instance on every call. Under Composition mode
// `i18n.global.locale` is a ref, so the value read here is always the
// current one.
//
// The composable `useLocaleFormatters()` (i18n/helpers/format.js)
// exposes the same functions with reactive locale binding for
// component use. New code inside .vue files should prefer that
// composable so the call site is explicit about its locale
// dependency; this module remains for utilities and stores that
// cannot call composables.
//
// SHARED HELPERS (this file's contribution to the DRY pass)
// ---------------------------------------------------------
// `resolveIntlLocale` and `buildDateOptions` live in
// `i18n/helpers/format.js` and are imported here. Before this change,
// both modules carried their own copy of the `INTL_LOCALE` map and
// of the "force Gregorian for ar-SA" branch. Adding a third locale
// would have required editing two maps and two branches; now it
// requires editing one. The two modules' public behaviours are
// unchanged — this file still uses `ar-SA` as its fallback (as it
// always did) and the composable still uses `en-US` (as it always
// did); only the shared building blocks are shared.
//
// `truncate` and `daysUntilExpiry` are locale-independent and are
// unchanged.

import { i18n } from '@/i18n'
import { resolveIntlLocale, buildDateOptions } from '@/i18n/helpers/format'

function currentIntlLocale() {
  const raw = i18n?.global?.locale?.value
  // Preserves this module's historical fallback of `ar-SA`. The
  // shared map in `i18n/helpers/format.js` is the single place the
  // `ar`/`en` mapping is written down.
  return resolveIntlLocale(raw, 'ar-SA')
}

export function formatNumber(value, fractionDigits = 0) {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return Number(value).toLocaleString(currentIntlLocale(), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function formatDate(date, format = 'short') {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const locale = currentIntlLocale()
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  if (format === 'long') {
    // The previous version of this branch also set `hour` and
    // `minute` on the options object before calling
    // `toLocaleDateString`, which ignores time fields. Those two
    // keys were a no-op; they have been removed so the intent
    // ("produce a date-only string, with a long month name") is
    // obvious to the next reader. No behavior change.
    options.month = 'long'
  }
  return d.toLocaleDateString(locale, buildDateOptions(locale, options))
}

export function formatLongDate(date) {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  const locale = currentIntlLocale()
  return d.toLocaleDateString(
    locale,
    buildDateOptions(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  )
}

export function formatDateTime(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  const locale = currentIntlLocale()
  return d.toLocaleString(
    locale,
    buildDateOptions(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  )
}

export function truncate(str, maxLength = 100) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  const sliced = str.slice(0, maxLength)
  const lastSpace = Math.max(sliced.lastIndexOf(' '), sliced.lastIndexOf('\n'))
  if (lastSpace > maxLength * 0.6) return sliced.slice(0, lastSpace) + '…'
  return sliced + '…'
}

export function daysUntilExpiry(expiresAt) {
  if (!expiresAt) return null
  const diff = new Date(expiresAt) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}