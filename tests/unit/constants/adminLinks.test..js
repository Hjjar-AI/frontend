// frontend/tests/unit/constants/adminLinks.test.js
//
// Consistency check between the admin navigation registry
// (`constants/adminLinks.js`) and the router's admin routes
// (`router/index.js`).
//
// WHY THIS TEST EXISTS
// --------------------
// The two lists were already out of sync once: the mobile bottom-nav
// sheet exposed four fewer admin links than the desktop dropdown,
// because each surface had hand-rolled its own list. Consolidating
// the navigation surfaces onto `ADMIN_LINKS` fixed that drift for
// the nav side, but the router still declares its own
// `meta.capability` on each admin route. If a future change adds a
// route to the router with `capability: 'admin.new_thing'` and does
// not add a matching `ADMIN_LINKS` entry, the page is reachable but
// unreachable from the navigation — and the reverse drift (a link in
// the navigation that points at a route with a different capability)
// is silently permissive.
//
// This test catches both directions.

import { describe, it, expect } from 'vitest'
import router from '@/router'
import { ADMIN_LINKS, ADMIN_ROUTE_PATHS } from '@/constants/adminLinks'

const routes = router.getRoutes()

// Admin-ish routes that are intentionally not in the top-level
// navigation. These are reached from within an admin page rather
// than from the dropdown or sheet.
//
// Add an entry here only when there is a real reason the route
// should not appear in the nav — e.g. it is a detail page whose
// parent is already listed, or it is a flow reached from a card
// rather than a menu item.
const ROUTES_NOT_IN_NAV = new Set([
  '/admin/groups/:id',
  '/master-exams/:id/edit',
  '/master-exams/:id/results',
])

describe('adminLinks ↔ router consistency', () => {
  it('every ADMIN_LINKS entry points at a route that exists', () => {
    const missing = []
    for (const link of ADMIN_LINKS) {
      const record = routes.find((r) => r.path === link.to)
      if (!record) missing.push(link.to)
    }
    expect(
      missing,
      `\nAdmin links with no matching route:\n  ${missing.join('\n  ')}\n`,
    ).toEqual([])
  })

  it('every ADMIN_LINKS entry has the same capability as its route', () => {
    const mismatches = []
    for (const link of ADMIN_LINKS) {
      const record = routes.find((r) => r.path === link.to)
      if (!record) continue  // covered by the previous test
      const routeCap = record.meta?.capability
      if (routeCap !== link.cap) {
        mismatches.push(
          `${link.to}: link cap=${JSON.stringify(link.cap)}, ` +
          `route cap=${JSON.stringify(routeCap)}`,
        )
      }
    }
    expect(
      mismatches,
      `\nCapability mismatches:\n  ${mismatches.join('\n  ')}\n`,
    ).toEqual([])
  })

  it('every admin-gated route is either in ADMIN_LINKS or on the exception list', () => {
    const unlisted = routes
      .filter((r) => r.meta?.capability)
      .filter((r) => {
        // Only routes inside the admin namespace, or the top-level
        // /analytics route, participate in this check. Capability-
        // gated routes outside that namespace (e.g. the master-exam
        // edit flow) are not part of the admin navigation and are
        // not expected to appear in ADMIN_LINKS.
        const isAdminNamespace =
          r.path.startsWith('/admin') || r.path === '/analytics'
        return isAdminNamespace
      })
      .filter((r) => !ROUTES_NOT_IN_NAV.has(r.path))
      .filter((r) => !ADMIN_ROUTE_PATHS.has(r.path))
      .map((r) => r.path)

    expect(
      unlisted,
      `\nAdmin-gated routes not surfaced in ADMIN_LINKS ` +
      `(add them to ADMIN_LINKS or to ROUTES_NOT_IN_NAV):\n` +
      `  ${unlisted.join('\n  ')}\n`,
    ).toEqual([])
  })

  it('ADMIN_ROUTE_PATHS matches the set of ADMIN_LINKS destinations', () => {
    // Guards against a future edit that changes ADMIN_LINKS without
    // updating the derived set (e.g. by moving the set to its own
    // literal).
    const linkPaths = new Set(ADMIN_LINKS.map((l) => l.to))
    expect(ADMIN_ROUTE_PATHS.size).toBe(linkPaths.size)
    for (const p of linkPaths) {
      expect(ADMIN_ROUTE_PATHS.has(p)).toBe(true)
    }
  })
})