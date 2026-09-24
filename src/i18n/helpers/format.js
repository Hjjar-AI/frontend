// frontend/src/i18n/helpers/format.js
//
// Locale-aware date and number formatters for component use, plus the
// two building blocks that `utils/formatters.js` delegates to.
//
// `buildDateOptions` and `resolveIntlLocale` are exported so that
// `utils/formatters.js` — which cannot call `useI18n()` because it is
// invoked from stores and services — can share the same calendar
// handling. Before this, both modules carried their own copy of the
// "force Gregorian for ar-SA" branch, and a change to one had no
// effect on the other.

import { useI18n } from 'vue-i18n'

export const INTL_LOCALE = {
  ar: 'ar-SA',
  en: 'en-US',
}

export const EMPTY_FORMATTED_VALUE = '—'

export function formatNumberForLocale(locale, value, fractionDigits = 0) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return EMPTY_FORMATTED_VALUE
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value))
}

export function formatPercentForLocale(locale, value, fractionDigits = 0, valueIsRatio = false) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return EMPTY_FORMATTED_VALUE
  }
  const ratio = valueIsRatio ? Number(value) : Number(value) / 100
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(ratio)
}

export function resolveIntlLocale(appLocale, fallback) {
  return INTL_LOCALE[appLocale] || fallback
}

// Wrap a locale-appropriate `toLocaleDateString` / `toLocaleString`
// options object with the calendar override.
//
// WHY THE OVERRIDE IS NEEDED
// --------------------------
// Some browsers render `ar-SA` dates using the Umm al-Qura (Hijri)
// calendar by default. That disagrees with every `<input type="date">`
// in the app and with the Gregorian dates the backend sends, so a
// Hijri rendering would show a user a date that does not match the
// one the form will submit. Forcing `calendar: 'gregory'` keeps the
// display and the wire format aligned.
//
// This function is the single place the override is written down.
// Everything else — the component-side formatters below and the
// store-side delegates in `utils/formatters.js` — builds its options
// object and passes it through here.
export function buildDateOptions(intlLocale, extra = {}) {
  const opts = { ...extra }
  if (intlLocale === 'ar-SA') {
    opts.calendar = 'gregory'
  }
  return opts
}

export function useLocaleFormatters() {
  const { locale } = useI18n()

  const intlLocale = () => resolveIntlLocale(locale.value, 'en-US')

  function formatNumber(value, fractionDigits = 0) {
    return formatNumberForLocale(intlLocale(), value, fractionDigits)
  }

  function formatPercent(value, fractionDigits = 0, valueIsRatio = false) {
    return formatPercentForLocale(intlLocale(), value, fractionDigits, valueIsRatio)
  }

  function formatDate(date, options = {}) {
    if (!date) return EMPTY_FORMATTED_VALUE
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return EMPTY_FORMATTED_VALUE
    const resolved = intlLocale()
    return d.toLocaleDateString(
      resolved,
      buildDateOptions(resolved, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...options,
      }),
    )
  }

  function formatDateTime(date) {
    if (!date) return '—'
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    const resolved = intlLocale()
    return d.toLocaleString(
      resolved,
      buildDateOptions(resolved, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }

  return { formatNumber, formatPercent, formatDate, formatDateTime }
}
