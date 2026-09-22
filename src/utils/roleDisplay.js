// frontend/src/utils/roleDisplay.js
//
// Shared role display registry.
//
// WHAT THIS REPLACES
// ------------------
// Three views rendered the same roles with three parallel mappings:
//
//   • Users.vue          — badge variant (danger/warning/info)
//   • Permissions.vue    — icon (shield-lock-fill / shield-check /
//                          person-badge / person)
//   • NavbarUserMenu.vue — label
//
// The label table itself already lives in `utils/constants.js` as
// `ROLE_LABEL_KEYS`, so this module does NOT duplicate it. It adds
// the two pieces of presentation metadata that were not already
// centralised: the icon class and the badge variant.
//
// ROLE SET
// --------
// Three roles — admin, moderator, member. This matches
// `apps/users/models.py` ROLE_CHOICES and the `DEFAULT_ROLES` map in
// `configStore.js`. If a fourth role is added, all three must be
// updated together.

import { ROLE_LABEL_KEYS } from '@/utils/constants'

export const ROLE_DISPLAY = {
  admin: {
    icon: 'bi bi-shield-lock-fill',
    badgeVariant: 'danger',
  },
  moderator: {
    icon: 'bi bi-shield-check',
    badgeVariant: 'warning',
  },
  member: {
    icon: 'bi bi-person-badge',
    badgeVariant: 'info',
  },
}

// Fallbacks match the `default` arms of the switch statements this
// module replaces.
const DEFAULT_ROLE_ICON = 'bi bi-person'
const DEFAULT_ROLE_BADGE_VARIANT = 'info'

/**
 * Bootstrap-Icon class for a role.
 *
 * Falls through to the generic person glyph for an unknown or
 * missing role, the same value the original switch used.
 */
export function roleIconFor(role) {
  return ROLE_DISPLAY[role]?.icon || DEFAULT_ROLE_ICON
}

/**
 * Badge variant for a role.
 *
 * Falls through to `'info'` for an unknown or missing role, the same
 * value the original switch used.
 */
export function roleBadgeVariantFor(role) {
  return ROLE_DISPLAY[role]?.badgeVariant || DEFAULT_ROLE_BADGE_VARIANT
}

/**
 * Localized label for a role.
 *
 * Uses the existing `ROLE_LABEL_KEYS` table so there is one place
 * the label mapping is written down. Falls through to the raw role
 * string for an unknown value, so a backend-added role remains
 * visible in the UI rather than blanking.
 *
 * @param {string}   role  role code ('admin' | 'moderator' | 'member')
 * @param {Function} t     the i18n `t` function
 */
export function roleLabelFor(role, t) {
  const key = ROLE_LABEL_KEYS[role]
  return key ? t(key) : (role || '')
}