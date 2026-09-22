// frontend/src/features/questions/composables/useQuestionFilters.js
import { reactive } from 'vue'

export function useQuestionFilters(initialFilters = {}) {
  const filters = reactive({
    search: initialFilters.search || '',
    category: initialFilters.category || '',
    difficulty: initialFilters.difficulty || '',
    verified: initialFilters.verified || '',
    tag: initialFilters.tag || '',
  })

  function reset() {
    filters.search = ''
    filters.category = ''
    filters.difficulty = ''
    filters.verified = ''
    filters.tag = ''
  }

    function toQueryParams() {
    const params = {}
    for (const [key, value] of Object.entries(filters)) {
      if (value) params[key] = value
    }
    return params
  }

  return { filters, reset, toQueryParams }
}