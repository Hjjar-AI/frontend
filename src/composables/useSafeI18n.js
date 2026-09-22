// frontend/src/composables/useSafeI18n.js
//
// Safe wrapper around vue-i18n's `t()`.
//
// WHY THIS EXISTS
// ---------------
// vue-i18n's message compiler throws a bare `SyntaxError` whose
// `.message` is a numeric internal code when a message value contains
// an unescaped reserved character. The reserved set is:
//
//   @      linked message
//   |      plural separator
//   { }    interpolation
//
// The thrown value has no useful description — the code number alone
// ("SyntaxError: 17") is what reaches the console. If any single
// message in the catalog is malformed, every page that renders that
// message fails, and ErrorBoundary turns the whole page into the
// fallback.
//
// Every t() call in a component that uses this composable goes
// through the try/catch below. On a thrown compile error, we log the
// offending key and return the key itself, so a single bad catalog
// entry degrades to a visible placeholder instead of blanking the
// page.
//
// This pattern was originally duplicated verbatim in About.vue and
// TestSetup.vue. Extracting it here means a future change to the
// recovery policy (e.g. "return an empty string instead of the key")
// lands in one file.
//
// The correct long-term fix is to escape the offending character in
// the catalog — see
// https://vue-i18n.intlify.dev/guide/essentials/syntax#literal-interpolation
// This composable exists so a catalog bug does not become a page
// crash while you find it.
//
// USAGE
// -----
//   import { useSafeI18n } from '@/composables/useSafeI18n'
//   const { t, locale } = useSafeI18n('About')
//
// The first argument is a human-readable component label used in the
// console warning. Pass the component's name so the log points at the
// file that rendered the bad key.

import { useI18n } from 'vue-i18n'

export function useSafeI18n(componentLabel = 'component') {
  const { t: rawT, locale } = useI18n()

  function t(key, params) {
    try {
      return rawT(key, params)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `[${componentLabel}] t(${JSON.stringify(key)}) threw:`,
        err,
        '— likely an unescaped @, |, {, or } in the message value.',
      )
      return key
    }
  }

  return { t, locale }
}