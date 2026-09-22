// frontend/tests/unit/services/endpoints-snapshot.test.js
//
// Snapshot test for the ENDPOINTS registry.
//
// WHY A SNAPSHOT ON TOP OF THE SHAPE TEST
// ---------------------------------------
// The shape test in `endpoints.test.js` asserts *invariants* — every
// leaf is a string or a builder, every path is well-formed, no two
// constants collide. Those assertions catch a class of bugs but do
// not record the exact set of endpoints the frontend currently
// speaks to.
//
// This file records that set. On the first run, Vitest writes
// `__snapshots__/endpoints-snapshot.test.js.snap`. Every subsequent
// run diffs the current registry against the recorded file and
// fails on any change.
//
// WHAT THAT BUYS
// --------------
// A URL drift between frontend and backend — e.g. the backend
// renames a route and the frontend is updated in the same commit —
// shows up as a small, reviewable diff in the snapshot. A reader
// opening the commit sees the old value and the new value side by
// side, which is exactly the artefact a backend developer needs to
// confirm the change is intentional.
//
// HOW TO UPDATE
// -------------
// When the change is intentional, run:
//
//     pnpm test -- -u
//
// (or `pnpm test:update` if you add that script). Vitest rewrites
// the snapshot. Include the `.snap` diff in the commit alongside
// the source change.

import { describe, it, expect } from 'vitest'

import { ENDPOINTS, API_BASE } from '@/services/api/endpoints'

// Deterministic dummy argument used to exercise every builder.
const DUMMY_ARG = 1

// Collect a sorted, flat list of every leaf in the registry.
//
// Sorting by path keeps the snapshot diff stable when a new endpoint
// is added in the middle of an object literal — without the sort,
// insertion order would leak into the snapshot and every addition
// would rewrite the trailing lines.
function collectLeaves(node, path = 'ENDPOINTS', out = []) {
  if (typeof node === 'string') {
    out.push({ path, kind: 'string', value: node })
  } else if (typeof node === 'function') {
    const arity = node.length
    const args = arity === 0 ? [] : new Array(arity).fill(DUMMY_ARG)
    let value
    try {
      value = node(...args)
    } catch (e) {
      value = `[threw: ${e.message}]`
    }
    out.push({ path, kind: 'function', arity, value })
  } else if (node !== null && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      collectLeaves(v, `${path}.${k}`, out)
    }
  } else {
    out.push({ path, kind: 'other', value: String(node) })
  }
  return out
}

describe('ENDPOINTS snapshot', () => {
  it('API_BASE is stable', () => {
    expect(API_BASE).toMatchSnapshot()
  })

  it('every endpoint in the registry', () => {
    const leaves = collectLeaves(ENDPOINTS).sort((a, b) =>
      a.path.localeCompare(b.path),
    )
    expect(leaves).toMatchSnapshot()
  })
})