// frontend/src/services/storageService.js
//
// Thin wrapper over localStorage.
//
// Every method swallows its own errors. localStorage throws in
// several environments this app is expected to run in — Safari
// private mode, a browser with site data disabled, an embedded
// webview with a quota of zero — and the app must not crash just
// because a preference could not be persisted. Callers receive a
// null / no-op result and continue.
export const storageService = {
  getItem(key) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch {
      // ignore write errors (quota, private mode, ...)
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  },

  removeByPrefix(prefix) {
    try {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(prefix)) keys.push(k)
      }
      keys.forEach(k => localStorage.removeItem(k))
    } catch {
      // ignore
    }
  },
}