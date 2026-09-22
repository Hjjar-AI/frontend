// frontend/src/composables/usePagination.js
//
// Pagination state for the admin user-list page.
//
// `totalPages` is now a writable ref, not a computed. It is set by
// the caller's fetch function from the server response's
// `total_pages` field — the value `apps/core/utils.py::paginate()`
// already computes on the server. Before this, the composable
// recomputed the same number from `total / perPage`; a second
// implementation of arithmetic the server had already done.
//
// SEE ALSO: `features/questions/composables/useQuestionListController.js`
// was doing the same recompute independently. Its `totalPages` is
// also now a writable ref sourced from the server.
//
// `features/history/views/History.vue` already trusted the server's
// value; the two outliers have been brought into line with it.

import { ref } from 'vue'

export function usePagination(fetchFn, initialPerPage = 20) {
  const page = ref(1)
  const perPage = ref(initialPerPage)
  const total = ref(0)
  const totalPages = ref(1)

  async function goToPage(newPage) {
    // Validate page bounds.
    if (newPage < 1) newPage = 1
    if (newPage > totalPages.value) newPage = totalPages.value
    page.value = newPage
    if (fetchFn) {
      await fetchFn()
    }
  }

  async function changePerPage(newPerPage) {
    perPage.value = newPerPage
    page.value = 1
    if (fetchFn) {
      await fetchFn()
    }
  }

  function reset() {
    page.value = 1
    perPage.value = initialPerPage
    total.value = 0
    totalPages.value = 1
  }

  return {
    page,
    perPage,
    total,
    totalPages,
    goToPage,
    changePerPage,
    reset,
  }
}