// frontend/src/stores/resetAllStores.js
//
// Called on logout (see authStore.logout) to return the app to a
// pristine, logged-out state.
//
// WHAT IS AND IS NOT CLEARED
// --------------------------
// Device-scoped preferences survive logout. The list is short and
// deliberate:
//
//   • `locale`  — the user's chosen UI language. Owned by
//                 i18n/index.js's setLocale() helper; not written
//                 by this module or by preferencesStore (see the
//                 comment in preferencesStore.reset()). Clearing it
//                 here would flip the next visitor to the fallback
//                 default before they have a chance to sign in.
//
//   • `theme`   — the user's chosen visual theme. Also a device
//                 preference, and — importantly — the value that the
//                 inline bootstrap script in index.html reads before
//                 first paint. Clearing the stored value without
//                 also updating `document.documentElement.dataset.theme`
//                 leaves the running DOM on the previous theme while
//                 the storage says "no preference", so the user sees
//                 a theme flash on the very next reload. The
//                 previous version of this module cleared `theme`
//                 and did not touch the DOM, which is exactly that
//                 bug.
//
// Everything else below is user-scoped and cleared. That includes:
//
//   • The CRUD response cache.
//   • `last_viewed_question_id_<userId>` and `recent_<userId>_*`
//     entries — keyed by user, so leaving them behind would leak
//     the previous user's viewing history to the next visitor on
//     the same browser.
//   • The test-session keys in sessionStorage (both legacy and
//     per-mode variants). A session belongs to the user that
//     started it.
//   • Per-user preference overrides (`pref_*`). These are user
//     choices, not device choices — unlike `theme` and `locale`,
//     they are not read before login and they are not device
//     identity. Clearing them on logout is the established pattern.
//
// Do NOT add `theme` or `locale` back to this list without also
// deciding how the DOM and the boot-time scripts should react — see
// the two bullets above.

import { getActivePinia } from 'pinia'
import { clearCrudCache } from '@/composables/useCrudActions'
import { storageService } from '@/services/storageService'

export function resetAllStores() {
  clearCrudCache()

  // ── User-scoped keys in localStorage ────────────────────────────
  // These carry the current user's id in the key itself, so they
  // would otherwise survive to the next visitor on a shared browser.
  storageService.removeByPrefix('last_viewed_question_id_')
  storageService.removeByPrefix('recent_')

  // ── Test session state in sessionStorage ────────────────────────
  // Two key namespaces: the legacy single-session pair and the
  // per-mode pair used by the current client. Both are cleared so
  // an upgrade path from the old client does not leave a stale
  // session id behind.
  try {
    const keysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (
        k &&
        (k === 'test_session_mode' ||
          k === 'test_session_id' ||
          k.startsWith('test_session_mode_') ||
          k.startsWith('test_session_id_'))
      ) {
        keysToRemove.push(k)
      }
    }
    for (const k of keysToRemove) {
      sessionStorage.removeItem(k)
    }
  } catch {
    // sessionStorage may be unavailable (private mode, storage
    // disabled). Nothing else in the function depends on it.
  }

  // ── Per-user preference overrides ───────────────────────────────
  // These are user-scoped (default per-page count, default
  // difficulty, auto-advance, sound). Not cleared: `theme`, `locale`
  // — see the module header.
  storageService.removeItem('pref_perPage')
  storageService.removeItem('pref_difficulty')
  storageService.removeItem('pref_autoAdvance')
  storageService.removeItem('pref_sound')

  // ── Pinia stores ────────────────────────────────────────────────
  const pinia = getActivePinia()
  if (!pinia) return

  for (const storeId in pinia.state.value) {
    const store = pinia._s.get(storeId)
    if (store && typeof store.reset === 'function') {
      store.reset()
    }
  }
}