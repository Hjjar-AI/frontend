import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const bookmarkService = {
  list() {
    return apiClient.get(ENDPOINTS.BOOKMARKS.BASE)
  },
  toggle(questionId) {
    return apiClient.post(ENDPOINTS.BOOKMARKS.TOGGLE(questionId))
  },
  count() {
    return apiClient.get(ENDPOINTS.BOOKMARKS.COUNT)
  },
}