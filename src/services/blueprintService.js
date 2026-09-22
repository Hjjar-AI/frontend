// frontend/src/services/blueprintService.js
//
// FEATURE #8 — client for the Blueprint CRUD endpoints.
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const blueprintService = {
  list() {
    return apiClient.get(ENDPOINTS.EXAM.BLUEPRINTS)
  },
  get(id) {
    return apiClient.get(ENDPOINTS.EXAM.BLUEPRINT(id))
  },
  create(data) {
    return apiClient.post(ENDPOINTS.EXAM.BLUEPRINTS, data)
  },
  update(id, data) {
    return apiClient.put(ENDPOINTS.EXAM.BLUEPRINT(id), data)
  },
  delete(id) {
    return apiClient.delete(ENDPOINTS.EXAM.BLUEPRINT(id))
  },
}