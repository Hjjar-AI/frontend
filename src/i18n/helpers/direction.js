// frontend/src/i18n/helpers/direction.js
//
// Maps a locale to its text direction and applies it — plus `lang` —
// to the <html> element. Called once at boot and again on every
// language change from the LanguageSwitcher.

export const LOCALE_META = {
  ar: { dir: 'rtl', label: 'العربية' },
  en: { dir: 'ltr', label: 'English' },
}

export const SUPPORTED_LOCALES = Object.keys(LOCALE_META)
export const DEFAULT_LOCALE = 'ar'

export function getDirection(locale) {
  return LOCALE_META[locale]?.dir || 'ltr'
}

export function applyLocaleToDOM(locale) {
  if (typeof document === 'undefined') return
  const meta = LOCALE_META[locale] || LOCALE_META[DEFAULT_LOCALE]
  const html = document.documentElement
  html.setAttribute('lang', locale)
  html.setAttribute('dir', meta.dir)
  html.setAttribute('data-locale', locale)

  // Notify reactive consumers that the direction has changed.
  // `CustomEvent` is available in every browser this app targets; the
  // try/catch is a belt-and-braces guard for exotic test harnesses
  // that stub `window` without stubbing `CustomEvent`.
  if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
    try {
      window.dispatchEvent(
        new CustomEvent('app:locale-changed', {
          detail: { locale, dir: meta.dir },
        }),
      )
    } catch {
      // Environment does not support CustomEvent — the composable
      // will still read the correct value on next mount.
    }
  }
}