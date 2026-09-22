import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const categoryService = {
  list(params = {}) {
    return apiClient.get(ENDPOINTS.CATEGORIES.BASE, { params })
  },
  create(data) {
    return apiClient.post(ENDPOINTS.CATEGORIES.CREATE, data)
  },
  update(id, data) {
    return apiClient.put(ENDPOINTS.CATEGORIES.UPDATE(id), data)
  },
  delete(id) {
    return apiClient.delete(ENDPOINTS.CATEGORIES.DELETE(id))
  },
}