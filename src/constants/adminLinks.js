// frontend/src/constants/adminLinks.js
//
// Shared admin link registry.
//
// Three nav surfaces previously declared their own admin link list by
// hand: the desktop Navbar dropdown, the mobile bottom-nav sheet, and
// the Profile page's admin card. They had already drifted — the
// mobile sheet was missing four links that the desktop dropdown
// exposed. This module is the single source of truth.
//
// SHAPE
//   { to, icon, labelKey, cap }
//
//   to        — router path
//   icon      — Bootstrap Icons class
//   labelKey  — i18n key under `nav.*`
//   cap       — capability string the caller must hold
//
// SCOPE: ADMIN-ONLY ROUTES
// ------------------------
// Every entry here maps to a route whose `meta.capability` matches
// this entry's `cap`. The test in
// `tests/unit/constants/adminLinks.test.js` asserts that two-way
// contract: a route with `meta.capability` must have a matching entry
// here, and an entry here must point at a route with a matching
// `meta.capability`.
//
// `/analytics` USED TO BE AN ENTRY HERE. It was removed when the
// route's `meta.capability` was loosened from `analytics.view_all` to
// no capability (see `router/index.js`): the page has a
// member-facing half (category mastery, streak history) that every
// authenticated user can read, and an admin-only half
// (`canViewAll`) that stays behind the capability check inside the
// view itself.
//
// The `/analytics` link is now rendered from `Navbar.vue` (desktop,
// top-level) and `MobileBottomNav.vue` (mobile sheet grid) for every
// authenticated user. Admins reach the same page from the same
// place; the admin-only accordion reports on that page remain
// hidden by the in-view `canViewAll` check.
//
// CONSISTENCY WITH THE ROUTER
// ---------------------------
// The router declares its admin routes with `meta.capability`, and
// this file declares the same capability on each link. The two lists
// are checked against each other by
// `tests/unit/constants/adminLinks.test.js`.

export const ADMIN_LINKS = [
  {
    to: '/admin/users',
    icon: 'bi bi-people-fill',
    labelKey: 'nav.users',
    cap: 'admin.users',
  },
  {
    to: '/admin/verification-stats',
    icon: 'bi bi-bar-chart',
    labelKey: 'nav.verificationStats',
    cap: 'admin.verification_stats',
  },
  {
    to: '/admin/blueprints',
    icon: 'bi bi-diagram-3',
    labelKey: 'nav.blueprints',
    cap: 'admin.blueprints',
  },
  {
    to: '/admin/groups',
    icon: 'bi bi-people',
    labelKey: 'nav.groups',
    cap: 'groups.admin',
  },
  {
    to: '/admin/tags',
    icon: 'bi bi-tags',
    labelKey: 'nav.tags',
    cap: 'questions.manage_tags',
  },
  {
    to: '/admin/flags',
    icon: 'bi bi-flag',
    labelKey: 'nav.flags',
    cap: 'admin.flags',
  },
  {
    to: '/admin/active-users',
    icon: 'bi bi-broadcast',
    labelKey: 'nav.activeUsers',
    cap: 'admin.active_users',
  },
  {
    to: '/admin/history',
    icon: 'bi bi-person-lines-fill',
    labelKey: 'nav.history',
    cap: 'tests.view_all_history',
  },
  {
    to: '/admin/settings',
    icon: 'bi bi-gear',
    labelKey: 'nav.settings',
    cap: 'admin.settings',
  },
  {
    to: '/admin/database',
    icon: 'bi bi-database',
    labelKey: 'nav.database',
    cap: 'admin.database',
  },
  {
    to: '/admin/import',
    icon: 'bi bi-upload',
    labelKey: 'nav.import',
    cap: 'admin.database',
  },
  {
    to: '/admin/permissions',
    icon: 'bi bi-shield-check',
    labelKey: 'nav.permissions',
    cap: 'admin.permissions',
  },
]

// A Set of every path declared in ADMIN_LINKS. Exported so the
// consistency test can ask "is this route path part of the admin
// navigation?" without rebuilding the set from the array.
export const ADMIN_ROUTE_PATHS = new Set(ADMIN_LINKS.map((l) => l.to))

// The narrower set that gates the "admin mode" badge next to the
// user's avatar. This is a *visual* indicator that the caller holds
// broad admin capability, not an authorization check — every gated
// action verifies its own capability.
export const ADMIN_BADGE_CAPABILITIES = [
  'admin.users',
  'admin.settings',
  'admin.database',
  'admin.permissions',
]

// The three admin actions surfaced on the Profile page's admin card.
// These are the "quick shortcuts" a returning admin is most likely
// to want one click away from their own profile.
export const PROFILE_ADMIN_SHORTCUTS = [
  'admin.users',
  'admin.settings',
  'admin.permissions',
]