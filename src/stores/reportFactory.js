// frontend/src/stores/reportFactory.js
//
// Descriptor-driven fetcher for the analytics reports.
//
// WHAT THIS REPLACES
// ------------------
// `analyticsStore.js` declares seven advanced reports. Each one
// repeats the same four pieces of boilerplate:
//
//   • a data bucket in state (`categoryMastery: null`), plus a
//     matching `...Status` / `...Error` pair from
//     `subResourceState(name)` and `subResourceGetters(name)`;
//   • a fetch action that short-circuits on a non-null bucket,
//     calls `useCrudActions(this, { statusKey, errorKey })` with the
//     report-specific keys, calls the matching service method with
//     `suppressErrorToast: true`, and writes the response into the
//     bucket;
//   • a reset entry in the store's `reset` action;
//   • a getter pair (`is<Name>Loading` / `<name>HasError`).
//
// Seven reports x four pieces of boilerplate = twenty-eight lines
// that have to be kept in sync. A change to the fetcher contract
// (for example, adding a cache-prefix argument) has to be replicated
// seven times.
//
// The three factories below own those four pieces. `analyticsStore`
// declares a report by naming it; the shape lives here.
//
// SHAPE OF A REPORT
// -----------------
//   name              the state key. `reportState('categoryMastery')`
//                     produces:
//                       categoryMastery: null
//                       categoryMasteryStatus: 'idle'
//                       categoryMasteryError: null
//                     and `subResourceGetters('categoryMastery')`
//                     produces:
//                       isCategoryMasteryLoading
//                       categoryMasteryHasError
//
//   serviceMethod     a function that issues the request. Called as
//                     `serviceMethod(params)` when `acceptsParams`
//                     is true, or `serviceMethod()` when it is
//                     false. The distinction exists because the
//                     backend's difficulty-calibration endpoint
//                     accepts no query params, while the other six
//                     do.
//
//   acceptsParams     whether the fetch action forwards a `params`
//                     argument to the service method.
//
// The `name` doubles as the store key, the status key prefix, and
// the error key prefix. Keeping one name for all three is what makes
// the factory work; if a future report needs differently-named keys,
// add an explicit override rather than special-casing the call site.

import { useCrudActions } from '@/composables/useCrudActions'
import { subResourceState, subResourceGetters } from '@/stores/storeHelpers'

/**
 * Build the state slice for a single report.
 *
 * @param {string} name
 * @returns {Object}
 */
export function reportState(name) {
  return {
    [name]: null,
    ...subResourceState(name),
  }
}

/**
 * Build the getters block for a list of reports.
 *
 * The `subResourceGetters` helper in `storeHelpers.js` generates one
 * `is<Name>Loading` / `<name>HasError` pair per report. This
 * function aggregates them so the store's `getters` block can
 * declare the seven reports with a single spread.
 *
 * @param {string[]} names
 * @returns {Object}
 */
export function reportGetters(names) {
  const out = {}
  for (const name of names) {
    Object.assign(out, subResourceGetters(name))
  }
  return out
}

/**
 * Build the reset-action payload fragment for a list of reports.
 *
 * The reset action uses `makeReset({...})`, which assigns each key in
 * its defaults onto the store. Every report needs its bucket nulled
 * and its status/error pair reset; that is the same shape
 * `reportState(name)` produces, so it is reused rather than
 * re-declared.
 *
 * @param {string[]} names
 * @returns {Object}
 */
export function reportResetPayload(names) {
  const out = {}
  for (const name of names) {
    Object.assign(out, reportState(name))
  }
  return out
}

/**
 * Build the fetch action for one report.
 *
 * The returned function is a plain `async function` that uses `this`
 * to reach the store. Pinia's Options API binds actions with the
 * store as their receiver, so `this[name]` and `this[name + 'Status']`
 * resolve to the right fields when the action is invoked as
 * `store.fetch<Name>()`.
 *
 * CACHING
 * -------
 * A fetch whose bucket is already non-null is a no-op unless the
 * caller passes `{ force: true }`. That is the caching contract the
 * previous inline fetchers had — an accordion open→close→open cycle
 * is free after the first open, and a page reload does not re-fetch
 * data the user has already seen.
 *
 * A failed fetch leaves the bucket null, so a subsequent call does
 * NOT short-circuit. The `useCrudActions.wrap` helper writes to the
 * status/error keys and returns `null` on failure; the store bucket
 * is only touched on the success path.
 *
 * @param {Object} options
 * @param {string} options.name
 * @param {Function} options.serviceMethod
 * @param {boolean} [options.acceptsParams=false]
 * @returns {Function} async fetch action
 */
export function makeReportFetcher({ name, serviceMethod, acceptsParams = false }) {
  const statusKey = `${name}Status`
  const errorKey = `${name}Error`

  return async function fetchReport(options = {}) {
    const { force = false, params = {} } = options

    // Cache short-circuit. A non-null bucket is the "we already have
    // data" signal; `force: true` overrides it. This mirrors the
    // pattern the store used inline.
    if (this[name] && !force) return this[name]

    const { wrap } = useCrudActions(this, { statusKey, errorKey })

    const call = acceptsParams
      ? () => serviceMethod(params)
      : () => serviceMethod()

    return await wrap(call, {
      errorMsgFallbackKey: 'notifications.analyticsLoadFailed',
      // The accordion wrapper renders the error inline via
      // `<ErrorBanner>`; a background fetch failure should not also
      // raise a toast on top of it.
      suppressErrorToast: true,
      onSuccess: (data) => {
        this[name] = data
      },
    })
  }
}

// The seven report names. Kept here so a future caller can iterate
// them without reaching into `analyticsStore.js`. Order is the order
// the factory was written against; the store's getter and reset
// spreads do not depend on it.
export const ANALYTICS_REPORT_NAMES = [
  'categoryMastery',
  'streakHistory',
  'difficultyCalibration',
  'authorFlagRate',
  'examDuration',
  'cohortComparison',
  'weeklyRetention',
]