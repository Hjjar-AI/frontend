// frontend/src/i18n/content/loader.js


import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/i18n/helpers/direction'

const cache = new Map()

const IMPORTERS = {
  'manual.ar': () => import('./manual.ar.js'),
  'manual.en': () => import('./manual.en.js'),
  'privacy.ar': () => import('./privacy.ar.js'),
  'privacy.en': () => import('./privacy.en.js'),
}

function resolveLocale(locale) {
  if (SUPPORTED_LOCALES.includes(locale)) return locale
  return DEFAULT_LOCALE
}


export async function loadContent(slug, locale) {
  const resolvedLocale = resolveLocale(locale)
  const key = `${slug}.${resolvedLocale}`
  if (cache.has(key)) return cache.get(key)

  const importer = IMPORTERS[key]
  if (importer) {
    const mod = await importer()
    const content = mod.default
    cache.set(key, content)
    return content
  }

  // Fall back to the default locale rather than throwing, so a
  // missing translation degrades to the base language instead of
  // producing an empty page.
  if (resolvedLocale !== DEFAULT_LOCALE) {
    const fallbackKey = `${slug}.${DEFAULT_LOCALE}`
    const fallbackImporter = IMPORTERS[fallbackKey]
    if (fallbackImporter) {
      const mod = await fallbackImporter()
      const content = mod.default
      cache.set(key, content)
      return content
    }
  }

  throw new Error(`Unknown content slug or locale: ${slug}.${resolvedLocale}`)
}

export function clearContentCache() {
  cache.clear()
}