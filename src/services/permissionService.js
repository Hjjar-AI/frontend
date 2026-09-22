// frontend/src/services/permissionService.js
//
// API client for the capability panel.
//
// Four endpoints, all gated server-side by the 'admin.permissions'
// capability. A client that cannot reach them will receive 403 from
// the API; the panel UI additionally checks the capability before
// rendering, so a non-admin user never sees the page in the first
// place.
//
// URLs are sourced from ENDPOINTS.PERMISSIONS so the panel is not
// the sole place in the codebase that hardcodes an auth-prefixed
// path.
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

const P = ENDPOINTS.PERMISSIONS

export const permissionService = {
  /**
   * Fetch the full capability catalog, the panel grouping, and the
   * current role → capabilities map.
   *
   * Response shape:
   *   {
   *     capabilities: [str, ...],           // flat catalog
   *     groups: [{ label, capabilities }],  // panel display groups
   *     roles: { role_name: [str, ...] },   // current role caps
   *   }
   */
  listRoles() {
    return apiClient.get(P.ROLES)
  },

  /**
   * Replace one role's capability set.
   *
   * The 'admin' role is rejected server-side — admins always hold
   * every capability regardless of what the row for 'admin' says.
   */
  updateRole(role, capabilities) {
    return apiClient.put(P.ROLES, {
      role,
      capabilities,
    })
  },

  /**
   * Read one user's capability state:
   *   {
   *     user_id, username, role,
   *     role_capabilities: [str, ...],   // what the role grants
   *     overrides: { cap: true|false },  // per-user deltas
   *     resolved: [str, ...],            // effective set
   *   }
   */
  getUserCapabilities(userId) {
    return apiClient.get(P.USER(userId))
  },

  /**
   * Replace a user's override dict. Passing `null` for a key
   * removes the override and returns the capability to the role
   * default. The server normalizes nulls before storage; the client
   * does not need to filter.
   */
  updateUserCapabilities(userId, overrides) {
    return apiClient.put(
      P.USER(userId),
      { capabilities: overrides },
    )
  },
}