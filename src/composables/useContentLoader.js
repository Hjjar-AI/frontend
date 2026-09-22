// frontend/src/composables/useContentLoader.js
//
// Lazy per-locale content loader for the Manual and Privacy Policy
// pages.
//
// WHAT IT DOES
// ------------
// Wraps the pattern both pages had grown independently:
//
//   • a `content` ref that starts null and receives the loaded module
//   • a `loadError` ref that distinguishes "still loading" from
//     "load failed" so the template's placeholder can say which
//   • a monotonic `loadToken` counter so an out-of-order load (the
//     user switches locale twice quickly, the first import resolves
//     second) cannot overwrite a newer result with a stale one
//   • a `watch(locale, load)` that re-fetches when the user changes
//     language
//   • an initial load at setup time
//
// The slug is the first argument and matches the module namespace in
// `i18n/content/loader.js` — 'privacy' or 'manual'.
//
// WHY NOT PUT THIS IN i18n/content/loader.js
// ------------------------------------------
// The loader module is a pure data layer — it imports JSON-shaped
// modules and returns them. The reactive refs, the token counter, and
// the locale watcher are view concerns, so they live here.
//
// USAGE
// -----
//   import { useContentLoader } from '@/composables/useContentLoader'
//   const { content, loadError } = useContentLoader('privacy')
//
// The caller renders a loading placeholder while `content.value` is
// null and picks between "loading" and "failed" copy based on
// `loadError.value`.

import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadContent } from '@/i18n/content/loader'

export function useContentLoader(slug) {
  const { locale } = useI18n()

  const content = ref(null)
  const loadError = ref(false)

  // Monotonic token. Every call to load() bumps this; the resolving
  // branch checks it before writing into `content`. An out-of-order
  // import (user switches locale twice quickly) cannot overwrite a
  // newer result with a stale one.
  let loadToken = 0

  async function load() {
    const token = ++loadToken
    loadError.value = false
    try {
      const mod = await loadContent(slug, locale.value)
      if (token !== loadToken) return
      content.value = mod
    } catch (err) {
      if (token !== loadToken) return
      // eslint-disable-next-line no-console
      console.error(`Failed to load content '${slug}':`, err)
      loadError.value = true
    }
  }

  // The watcher is not `{ immediate: true }` because the explicit
  // call below is the first load. Combining the two would double-run
  // the import on mount; keeping them separate makes the boot path
  // obvious in a stack trace.
  watch(locale, load)
  load()

  return { content, loadError }
}