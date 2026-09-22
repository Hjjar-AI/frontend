// frontend/src/services/authService.js
//
// Theme sync removed (#1, #13): `updateTheme` used to POST to
// `/auth/theme/`. Theme preference is now client-local only.

import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const authService = {
  async login(username, password) {
    return apiClient.post(ENDPOINTS.AUTH.LOGIN, { username, password })
  },

  async logout() {
    return apiClient.post(ENDPOINTS.AUTH.LOGOUT)
  },

  async me() {
    return apiClient.get(ENDPOINTS.AUTH.ME)
  },

  async changePassword(currentPassword, newPassword) {
    return apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },
}