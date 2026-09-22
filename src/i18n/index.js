// frontend/src/i18n/index.js
import { createI18n } from 'vue-i18n'
import ar from './locales/ar/index.js'
import en from './locales/en/index.js'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, applyLocaleToDOM } from './helpers/direction'

// The locale to use at first boot. Read from localStorage so the
// LanguageSwitcher's choice survives reloads.
function readInitialLocale() {
  try {
    const saved = localStorage.getItem('locale')
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved
  } catch {
    // private mode / storage disabled — fall through
  }
  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,

  locale: readInitialLocale(),
  fallbackLocale: 'en',

  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,

  messages: { ar, en },
})

export function setLocale(next) {
  if (!SUPPORTED_LOCALES.includes(next)) return i18n.global.locale.value
  if (i18n.global.locale.value === next) {
    applyLocaleToDOM(next)
    return next
  }
  i18n.global.locale.value = next
  applyLocaleToDOM(next)
  try {
    localStorage.setItem('locale', next)
  } catch {
    // ignore
  }
  return next
}