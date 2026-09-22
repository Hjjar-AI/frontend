// frontend/src/services/api/csrfTokenStore.js
//
// Module-scoped CSRF token state, extracted from api/client.js so that
// non-HTTP modules can read/write the token without pulling in axios or
// the router.
//
// Motivation: stores/authStore.js needs to push a rotated CSRF token
// after login (Django rotates it on every successful login()) and to
// drop the cached token on logout. Importing it directly from
// api/client.js created a static cycle:
//
//     authStore → api/client → router → guards → authStore
//
// It happened to be benign — every use of an authStore export was
// deferred to a runtime navigation event, well after all modules had
// finished evaluating — but any future top-level use of an authStore
// export while api/client.js was still evaluating would throw a TDZ
// error with a non-obvious trace. This module is a leaf: it imports
// nothing, so every consumer can safely import it.
//
// The `csrfPromise` (the shared in-flight token fetch, used to
// deduplicate concurrent fetches) is co-located with `csrfToken`.
// `csrfGeneration` makes invalidation real rather than just dropping
// the promise reference: a fetch captures the current generation and
// may only publish its result while that generation is still current.
// A late response from before login/logout/token recovery therefore
// cannot restore a stale token.

let csrfToken = null
let csrfPromise = null
let csrfGeneration = 0

export function getCsrfToken() {
  return csrfToken
}

export function getCsrfPromise() {
  return csrfPromise
}

export function getCsrfGeneration() {
  return csrfGeneration
}

export function setCsrfPromise(promise, generation = csrfGeneration) {
  if (generation !== csrfGeneration) return false
  csrfPromise = promise
  return true
}

export function setCsrfToken(token, generation = csrfGeneration) {
  if (generation !== csrfGeneration) return false
  csrfToken = token || null
  csrfPromise = null
  return true
}

export function clearCsrfToken() {
  csrfGeneration += 1
  csrfToken = null
  csrfPromise = null
}
