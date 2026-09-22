// frontend/src/stores/storeHelpers.js
// Small helpers to keep Pinia stores consistent across the app.
//
// ═══════════════════════════════════════════════════════════════════
// LOADING-STATE CONTRACT (Priority item 13)
// ═══════════════════════════════════════════════════════════════════
//
// The codebase has two independent ways of tracking "this request is
// in flight". They are NOT interchangeable and must not both be used
// for the same operation.
//
//   1. Store-level (canonical for store actions)
//      `standardState()` seeds `status`/`error`; `standardGetters`
//      exposes `isLoading` derived from `status`. `useCrudActions(this)`
//      writes to those fields. Every action that lives on a Pinia store
//      uses this. Components that render a store action's loading state
//      read `store.isLoading` — never a local flag.
//
//   2. Composable-level (for operations that are NOT store actions)
//      `useAsyncState()` (see composables/composableHelpers.js) exposes
//      its own `status`/`isLoading`. This is for ad-hoc async work
//      inside a component that does not map to any store action.
//
// A composable that wraps a SINGLE store action must derive its
// `isLoading`/`isSubmitting` from the store (i.e. from `store.isLoading`
// or a boolean computed over `store.status`). It must not call
// `useAsyncState()` and then also read the store's loading flag.
//
// A composable that composes SEVERAL store actions (e.g. useTestPage's
// start/resume/discard) may use `useAsyncState()` for its own
// bookkeeping, but its boolean getters must be the only source the
// template consumes. Do not surface the raw status string to a
// Boolean-typed prop — Vue will coerce any non-empty string to `true`.
// ═══════════════════════════════════════════════════════════════════

export function standardState(initial = {}) {
  return Object.assign({
    status: 'idle',
    error: null,
  }, initial)
}

export const standardGetters = {
  isLoading: (state) => state.status === 'loading',
}

// Helper for stores that need to track a sub-resource's loading state
// without hijacking the top-level `status`. Usage:
//
//   state: () => standardState({
//     ...subResourceState('unverified'),
//     ...
//   }),
//   getters: {
//     ...standardGetters,
//     ...subResourceGetters('unverified'),
//   }
//
// Wires the store up with `unverifiedStatus`/`unverifiedError` in state
// and `isUnverifiedLoading`/`unverifiedHasError` in getters so that
// useCrudActions({ statusKey: 'unverifiedStatus' }) has somewhere real
// to write.
export function subResourceState(name) {
  return {
    [`${name}Status`]: 'idle',
    [`${name}Error`]: null,
  }
}

export function subResourceGetters(name) {
  const statusKey = `${name}Status`
  const errorKey = `${name}Error`
  const loadingKey = `is${capitalize(name)}Loading`
  return {
    [loadingKey]: (state) => state[statusKey] === 'loading',
    [`${name}HasError`]: (state) => state[statusKey] === 'error' && !!state[errorKey],
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Use this to add a consistent reset implementation when you want
// a full manual reset instead of Pinia's `$reset()`.
export function makeReset(defaults = {}) {
  return function () {
    Object.assign(this, defaults)
  }
}