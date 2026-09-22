// frontend/src/services/tipService.js
//
// Client for the member-facing tip list endpoint.
//
// Previously Dashboard.vue called `apiClient.get('/tips/', ...)`
// inline — the only place in the codebase where a component reached
// past the service layer with a hardcoded URL. This module restores
// the component → service → apiClient chain used everywhere else.
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const tipService = {
  /**
   * Fetch the active tip list for a locale.
   *
   * @param {string} locale — 'ar' or 'en'
   * @returns {Promise<{ tips: string[], locale: string }>}
   *
   * The response's `locale` may differ from the requested value if
   * the backend fell back to the default locale (see TipsView in
   * apps/core/views.py for the fallback rules).
   */
  getTips(locale) {
    return apiClient.get(ENDPOINTS.TIPS, { params: { locale } })
  },
}