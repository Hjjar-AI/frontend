// frontend/src/features/questions/composables/useQuestionListController.js
//
// PAGINATION
// ----------
// `totalItems` (for the "showing N of M" line) and `totalPages`
// (for the Pagination control) are both sourced from the server.
// `paginate()` in apps/core/utils.py returns `{total, page,
// per_page, total_pages}`, and every list endpoint routes through
// it. Before this revision, `totalPages` was a computed derived from
// `totalItems / perPage` — a second implementation of arithmetic
// the server had already done. The two implementations agreed only
// as long as `per_page` was sent explicitly on every request and the
// server did not clamp it differently from the client's assumption.
// Both were true today; neither was enforced.
//
// `History.vue` already trusted the server's `total_pages`. This
// composable and `usePagination.js` (used by `Users.vue`) are the
// two outliers that have been brought into line.

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuestionStore } from '@/stores/questionStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useFlagStore } from '@/stores/flagStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useAuthStore } from '@/stores/authStore'
import { useWrongAnswerStore } from '@/stores/wrongAnswerStore'
import { useTestSessionStore } from '@/stores/testSessionStore'
import { useDialog } from '@/composables/useDialog'
import { useSelection } from '@/composables/useSelection'
import { useNotify } from '@/composables/useNotify'
import { useQuestionFilters } from './useQuestionFilters'
import { storageService } from '@/services/storageService'
import { categoryService } from '@/services/categoryService'
import { tagService } from '@/services/tagService'

export function useQuestionListController(modeRef, t) {
  const readMode = () => (typeof modeRef === 'function' ? modeRef() : modeRef.value)

  const router = useRouter()
  const route = useRoute()
  const questionStore = useQuestionStore()
  const bookmarkStore = useBookmarkStore()
  const flagStore = useFlagStore()
  const preferencesStore = usePreferencesStore()
  const authStore = useAuthStore()
  const wrongAnswerStore = useWrongAnswerStore()
  const testSessionStore = useTestSessionStore()
  const { confirm, prompt: promptDialog } = useDialog()
  const { notify } = useNotify()
  const { selectedIds, toggle: toggleSelection, clear: clearSelection, isSelected } = useSelection()

  const bulkTagModalOpen = ref(false)
  const currentPage = ref(1)
  const perPage = ref(preferencesStore.defaultPerPage || 20)
  const totalItems = ref(0)
  const totalPages = ref(1)
  const categories = ref([])
  const tags = ref([])
  const lastViewedId = ref(null)
  const { filters, reset: resetFilters } = useQuestionFilters({
    difficulty: preferencesStore.defaultDifficulty,
  })

  const lastViewedStorageKey = computed(
    () => `last_viewed_question_id_${authStore.user?.id || 'guest'}`,
  )

  const modeAdapters = {
    all: {
      containerClass: 'questions-list',
      headerTitle: () => t('questions.title'),
      headerIcon: 'bi bi-list-ul',
      emptyIcon: 'bi-plus-circle',
      supportsSelect: true,
      items: () => questionStore.items,
      loading: () => questionStore.isLoading,
      error: () => questionStore.error || '',
      clearError: () => {
        questionStore.error = null
      },
      async fetch(page) {
        const result = await questionStore.fetchList({
          page,
          per_page: perPage.value,
          ...filters,
        })
        totalItems.value = result?.total ?? totalItems.value
        if (Number.isFinite(result?.total_pages)) {
          totalPages.value = result.total_pages
        }
      },
    },
    review: {
      containerClass: 'review-queue',
      headerTitle: () => t('questions.reviewTitle'),
      headerIcon: 'bi bi-clipboard-check',
      emptyTitleKey: 'questions.emptyReview',
      emptyMessageKey: 'questions.emptyReviewDesc',
      emptyIcon: 'bi-patch-check',
      supportsSelect: true,
      badge: () => ({
        variant: 'warning',
        label: t('questions.reviewBadge', { count: totalItems.value }),
      }),
      items: () => questionStore.unverifiedItems,
      loading: () => questionStore.isUnverifiedLoading,
      error: () => questionStore.unverifiedError || '',
      clearError: () => {
        questionStore.unverifiedError = null
      },
      async fetch(page) {
        await questionStore.fetchUnverified({ page, per_page: perPage.value })
        totalItems.value = questionStore.unverifiedPagination.total || 0
        totalPages.value = questionStore.unverifiedPagination.total_pages || 1
      },
    },
    mistakes: {
      containerClass: 'notebook-page',
      headerTitle: () => t('questions.mistakesTitle'),
      headerIcon: 'bi bi-journal-x',
      emptyTitleKey: 'questions.emptyMistakes',
      emptyMessageKey: 'questions.emptyMistakesDesc',
      emptyIcon: 'bi-journal-x',
      supportsSelect: false,
      badge: () => ({
        variant: 'danger',
        label: t('questions.mistakeBadge', { count: totalItems.value }),
      }),
      items: () => wrongAnswerStore.mistakes,
      loading: () => wrongAnswerStore.isLoading,
      error: () => wrongAnswerStore.error || '',
      clearError: () => {
        wrongAnswerStore.error = null
      },
      async fetch(page) {
        await wrongAnswerStore.fetchMistakes({ page, per_page: perPage.value })
        totalItems.value = wrongAnswerStore.mistakePagination.total || 0
        totalPages.value = wrongAnswerStore.mistakePagination.total_pages || 1
      },
      drill: () => ({
        ids: wrongAnswerStore.mistakeIds.slice(0, 50),
        label: t('questions.mistakesTitle'),
      }),
    },
    fragile: {
      containerClass: 'notebook-page',
      headerTitle: () => t('questions.fragileTitle'),
      headerIcon: 'bi bi-shield-slash',
      emptyTitleKey: 'questions.emptyFragile',
      emptyMessageKey: 'questions.emptyFragileDesc',
      emptyIcon: 'bi-shield-check',
      supportsSelect: false,
      badge: () => ({
        variant: 'warning',
        label: t('questions.fragileBadge', { count: totalItems.value }),
      }),
      items: () => wrongAnswerStore.fragile,
      loading: () => wrongAnswerStore.isLoading,
      error: () => wrongAnswerStore.error || '',
      clearError: () => {
        wrongAnswerStore.error = null
      },
      async fetch(page) {
        await wrongAnswerStore.fetchFragile({ page, per_page: perPage.value })
        totalItems.value = wrongAnswerStore.fragilePagination.total || 0
        totalPages.value = wrongAnswerStore.fragilePagination.total_pages || 1
      },
      drill: () => ({
        ids: wrongAnswerStore.fragileIds.slice(0, 50),
        label: t('questions.fragileTitle'),
      }),
    },
  }

  const adapter = computed(() => modeAdapters[readMode()] || modeAdapters.all)
  const containerClass = computed(() => adapter.value.containerClass)
  const headerTitle = computed(() => adapter.value.headerTitle())
  const headerIcon = computed(() => adapter.value.headerIcon)
  const supportsSelect = computed(() => adapter.value.supportsSelect)
  const headerBadge = computed(() => adapter.value.badge?.() || null)
  const items = computed(() => adapter.value.items())
  const isLoading = computed(() => adapter.value.loading())
  const error = computed(() => adapter.value.error())
  const bookmarkedIds = computed(() => bookmarkStore.bookmarkedIds)

  const showHeaderActions = computed(() => {
    if (readMode() === 'all') return authStore.can('questions.create')
    return Boolean(adapter.value.drill)
  })

  const drillButtonLabel = computed(() => {
    if (readMode() === 'mistakes') return t('questions.startMistakesDrill')
    if (readMode() === 'fragile') return t('questions.startFragileDrill')
    return ''
  })

  const activeFilterCount = computed(
    () =>
      Object.entries(filters).filter(([key, value]) => {
        if (key === 'verified') return value === 'yes'
        return value !== ''
      }).length,
  )

  const filterChips = computed(() => {
    const chips = []
    if (filters.search)
      chips.push({
        key: 'search',
        label: t('questions.filterSearch', { term: filters.search }),
      })
    if (filters.category)
      chips.push({
        key: 'category',
        label: t('questions.filterCategory'),
      })
    if (filters.difficulty)
      chips.push({
        key: 'difficulty',
        label: t('questions.filterDifficulty', { level: filters.difficulty }),
      })
    if (filters.verified === 'yes')
      chips.push({
        key: 'verified',
        label: t('questions.filterVerifiedOnly'),
      })
    if (filters.tag)
      chips.push({
        key: 'tag',
        label: t('questions.filterTag', { tag: filters.tag }),
      })
    return chips
  })

  const emptyTitle = computed(() => {
    if (readMode() === 'all') {
      return activeFilterCount.value > 0
        ? t('questions.emptyNoFilterMatch')
        : t('questions.emptyNoQuestions')
    }
    return adapter.value.emptyTitleKey ? t(adapter.value.emptyTitleKey) : ''
  })

  const emptyMessage = computed(() =>
    adapter.value.emptyMessageKey ? t(adapter.value.emptyMessageKey) : '',
  )

  const emptyIcon = computed(() => {
    if (readMode() === 'all') {
      return activeFilterCount.value > 0 ? 'bi-search' : 'bi-plus-circle'
    }
    return adapter.value.emptyIcon
  })
  const emptyReason = computed(() => {
    if (readMode() === 'all') return activeFilterCount.value > 0 ? 'filtered' : 'first-use'
    return 'no-results'
  })

  function queryValue(value) {
    return Array.isArray(value) ? value[0] : value
  }

  function hydrateListState() {
    const page = Number(queryValue(route.query.page))
    const pageSize = Number(queryValue(route.query.per_page))
    if (Number.isInteger(page) && page > 0) currentPage.value = page
    if (Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100) perPage.value = pageSize

    if (readMode() !== 'all') return
    for (const key of ['search', 'category', 'difficulty', 'verified', 'tag']) {
      const value = queryValue(route.query[key])
      if (value !== undefined) filters[key] = String(value)
    }
  }

  function syncListState() {
    const query = {}
    if (currentPage.value > 1) query.page = String(currentPage.value)
    if (perPage.value !== (preferencesStore.defaultPerPage || 20)) {
      query.per_page = String(perPage.value)
    }
    if (readMode() === 'all') {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== '') query[key] = String(value)
      }
    }
    router.replace({ query })
  }

  function clearError() {
    adapter.value.clearError()
  }

  function onFiltersUpdate(next) {
    Object.assign(filters, next)
  }

  function handleSearch() {
    currentPage.value = 1
    fetchPage(1)
  }

  async function handleReset() {
    resetFilters()
    currentPage.value = 1
    await fetchPage(1)
  }

  function removeFilter(key) {
    filters[key] = ''
    handleSearch()
  }

  async function handlePerPageChange() {
    currentPage.value = 1
    await fetchPage(1)
  }
  async function fetchPage(page = 1) {
    const requested = Number(page)
    let target = Number.isFinite(requested) ? Math.floor(requested) : 1
    if (target < 1) target = 1
    if (totalItems.value > 0 && target > totalPages.value) {
      target = totalPages.value
    }
    currentPage.value = target
    syncListState()
    await adapter.value.fetch(target)
  }

  function handlePageChange(page) {
    fetchPage(page)
  }

  async function handleBookmark(id) {
    await bookmarkStore.toggle(id)
  }

  async function handleDelete(id) {
    if (!(await confirm(t('questions.deleteConfirm')))) return
    await questionStore.remove(id)
    if (readMode() === 'all' && lastViewedId.value === id) clearLastViewed()
    await fetchPage(currentPage.value)
  }

  async function handleVerify(id) {
    await questionStore.toggleVerify(id)
    if (readMode() === 'review') await fetchPage(currentPage.value)
  }

  async function handleDuplicate(id) {
    await questionStore.duplicate(id)
  }

  async function handleFlag(id) {
    const reason = await promptDialog(t('questions.flagReason'), '')
    if (reason !== null) await flagStore.flagQuestion(id, reason || '')
  }

  async function handleBulkVerify(action) {
    if (selectedIds.value.length === 0) return
    const actionLabel = action === 'verify' ? t('questions.verify') : t('questions.unverify')
    const accepted = await confirm(
      t('questions.bulkVerifyConfirm', {
        action: actionLabel,
        count: selectedIds.value.length,
      }),
    )
    if (!accepted) return

    const notes = await promptDialog(t('questions.verifyNotes'), '')
    if (notes === null) return
    const result = await questionStore.bulkVerify(selectedIds.value, action, notes || '')
    if (!result) return
    clearSelection()
    await fetchPage(currentPage.value)
  }

  async function handleBulkTags(tagsPayload) {
    if (selectedIds.value.length === 0) return
    const result = await questionStore.bulkUpdateTags(
      selectedIds.value,
      tagsPayload.add,
      tagsPayload.remove,
    )
    if (!result) return
    bulkTagModalOpen.value = false
    clearSelection()
    await fetchPage(currentPage.value)
  }

  async function startDrill() {
    const drill = adapter.value.drill?.() || { ids: [], label: '' }
    if (drill.ids.length === 0) {
      notify(t('questions.noQuestionsForDrill'), 'warning')
      return
    }

    const result = await testSessionStore.start('study', {
      question_ids: drill.ids,
      session_label: drill.label,
      limit: drill.ids.length,
    })
    if (result) router.push('/study/question')
  }

  function loadLastViewed() {
    lastViewedId.value = Number(storageService.getItem(lastViewedStorageKey.value)) || null
  }

  function clearLastViewed() {
    storageService.removeItem(lastViewedStorageKey.value)
    lastViewedId.value = null
  }

  onMounted(async () => {
    hydrateListState()
    const prerequisites = [bookmarkStore.fetchBookmarks()]
    if (readMode() === 'all') {
      prerequisites.push(
        categoryService.list().then((result) => {
          categories.value = result.items || []
        }),
        tagService.list().then((result) => {
          tags.value = result.items || []
        }),
      )
    }
    await Promise.all(prerequisites)
    if (readMode() === 'all') loadLastViewed()
    await fetchPage(currentPage.value)
  })

  watch(readMode, () => {
    currentPage.value = 1
    clearSelection()
    fetchPage(1)
  })

  return {
    router,
    authStore,
    questionStore,
    selectedIds,
    toggleSelection,
    clearSelection,
    isSelected,
    bulkTagModalOpen,
    currentPage,
    perPage,
    totalItems,
    filters,
    categories,
    tags,
    lastViewedId,
    containerClass,
    headerTitle,
    headerIcon,
    supportsSelect,
    headerBadge,
    showHeaderActions,
    drillButtonLabel,
    items,
    isLoading,
    error,
    bookmarkedIds,
    emptyTitle,
    emptyMessage,
    emptyIcon,
    emptyReason,
    totalPages,
    activeFilterCount,
    filterChips,
    clearError,
    onFiltersUpdate,
    handleSearch,
    handleReset,
    removeFilter,
    handlePerPageChange,
    fetchPage,
    handlePageChange,
    handleBookmark,
    handleDelete,
    handleVerify,
    handleDuplicate,
    handleFlag,
    handleBulkVerify,
    handleBulkTags,
    startDrill,
    clearLastViewed,
  }
}
