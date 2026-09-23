import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const knowledgeService = {
  map() {
    return apiClient.get(ENDPOINTS.QUESTIONS.KNOWLEDGE_MAP)
  },
  list(params = {}) {
    return apiClient.get(ENDPOINTS.QUESTIONS.KNOWLEDGE_OBJECTS, { params })
  },
  create(data) {
    return apiClient.post(ENDPOINTS.QUESTIONS.KNOWLEDGE_OBJECTS, data)
  },
  update(id, data) {
    return apiClient.put(ENDPOINTS.QUESTIONS.KNOWLEDGE_OBJECT(id), data)
  },
  delete(id) {
    return apiClient.delete(ENDPOINTS.QUESTIONS.KNOWLEDGE_OBJECT(id))
  },
}
