// frontend/src/utils/clipboard.js
//
// Clipboard writer with a fallback for environments where the async
// Clipboard API is unavailable.
//
// WHY THE FALLBACK IS NEEDED
// --------------------------
// `navigator.clipboard` is exposed only in a secure context (HTTPS
// or localhost). The deployment may serve the app over plain HTTP
// during testing, and the previous version of this helper reported
// failure in that case even though the older `document.execCommand`
// path still works. TestResults.vue had already grown its own
// `execCommand` fallback to work around this; that fallback now
// lives here.
//
// The cascade is:
//
//   1. `navigator.clipboard.writeText(text)` — modern, async,
//      requires a secure context.
//   2. A temporary hidden `<textarea>` + `document.execCommand('copy')`
//      — deprecated but universally supported, including on
//      insecure origins.
//
// Callers receive a boolean success indicator. They own whatever
// notification they want to fire; the helper does not itself emit
// toasts, because different call sites use different i18n keys for
// the success and failure messages.

import { useNotify } from '@/composables/useNotify'
import { i18n } from '@/i18n'

/**
 * Copy text to the clipboard.
 *
 * @param {string} text
 * @returns {Promise<boolean>} true on success, false on any failure
 */
export async function copyTextToClipboard(text) {
  // Path 1 — async Clipboard API. Preferred when available.
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to the execCommand path. This can happen even
      // in a secure context: the user may have denied the
      // clipboard-write permission, or the API may reject for a
      // browser-specific reason.
    }
  }

  // Path 2 — execCommand fallback. Works on insecure origins and in
  // older browsers.
  return execCommandCopy(text)
}

function execCommandCopy(text) {
  if (typeof document === 'undefined') return false

  const textarea = document.createElement('textarea')
  textarea.value = text
  // Keep the element off-screen and avoid a visible flash. Using
  // `position: fixed` prevents the browser from scrolling to it.
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  // Read-only prevents the mobile keyboard from appearing on focus.
  textarea.setAttribute('readonly', '')
  document.body.appendChild(textarea)

  let ok = false
  try {
    textarea.select()
    // `execCommand` returns a boolean; some older browsers throw
    // instead.
    ok = document.execCommand('copy')
  } catch {
    ok = false
  } finally {
    document.body.removeChild(textarea)
  }

  return ok
}

/**
 * Copy text to the clipboard and fire a translated notification.
 *
 * Thin convenience wrapper for callers that only want "copy and
 * toast". Existing callers that import `copyToClipboard` continue
 * to work; the signature is (text, successKey?, errorKey?) with
 * both keys defaulted to the previous values.
 */
export async function copyToClipboard(
  text,
  successKey = 'notifications.copied',
  errorKey = 'notifications.copyFailed',
) {
  const { notify } = useNotify()
  const ok = await copyTextToClipboard(text)
  notify(i18n.global.t(ok ? successKey : errorKey), ok ? 'success' : 'error')
  return ok
}