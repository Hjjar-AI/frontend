import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useBlueprintStore } from '@/stores/blueprintStore'
import { useAuthStore } from '@/stores/authStore'
import { useWrongAnswerStore } from '@/stores/wrongAnswerStore'
import { tagService } from '@/services/tagService'
import { questionService } from '@/services/questionService'
import { useDebounceFn } from '@/composables/useDebounceFn'

function parseTags(value) {
  return String(value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function unique(values) {
  return [...new Set(values)]
}

export function useTestSetupState(props, emit, t) {
  const categoryStore = useCategoryStore()
  const bookmarkStore = useBookmarkStore()
  const blueprintStore = useBlueprintStore()
  const authStore = useAuthStore()
  const wrongAnswerStore = useWrongAnswerStore()

  const mode = ref(props.initialMode)
  const source = ref('')
  const selectedTags = ref([])
  const selectedCategories = ref([])
  const selectedBlueprintId = ref(null)
  const numQuestions = ref(10)
  const tags = ref([])
  const tagsLoading = ref(false)

  const filters = reactive({
    difficulty: '',
    tags: '',
    verified_only: false,
  })

  const categories = computed(() => categoryStore.items)
  const categoriesLoading = computed(() => categoryStore.isLoading)
  const activeBlueprints = computed(() => blueprintStore.activeBlueprints)

  const tagItems = computed(() =>
    tags.value.map((tag) => ({
      value: tag.name,
      label: tag.name,
      count: tag.count,
    })),
  )

  const categoryItems = computed(() =>
    categories.value.map((category) => ({
      value: category.id,
      label: category.name,
      color: category.color,
    })),
  )

  const blueprintOptions = computed(() =>
    activeBlueprints.value.map((blueprint) => ({
      value: blueprint.id,
      label: blueprint.name,
    })),
  )

  const sourceBehaviors = {
    tag: {
      isReady: () => selectedTags.value.length > 0,
      hint: () => t('tests.pickTag'),
      apply(payload) {
        const tagsFilter = unique([...selectedTags.value, ...parseTags(filters.tags)])
        if (tagsFilter.length) payload.tags_filter = tagsFilter.join(',')
      },
      label() {
        if (selectedTags.value.length === 1) return selectedTags.value[0]
        if (selectedTags.value.length > 1) {
          return t('tests.sourceMultiTag', { count: selectedTags.value.length })
        }
        return t('tests.genericTag')
      },
    },
    category: {
      isReady: () => selectedCategories.value.length > 0,
      hint: () => t('tests.categoryPickerEmptyHint'),
      apply(payload, forCount) {
        payload.category_ids = forCount
          ? selectedCategories.value.join(',')
          : [...selectedCategories.value]
      },
      label() {
        if (selectedCategories.value.length === 1) {
          return (
            categories.value.find((category) => category.id === selectedCategories.value[0])
              ?.name || ''
          )
        }
        return t('tests.sourceMultiCategory')
      },
    },
    bookmarks: {
      isReady: () => (bookmarkStore.count || 0) > 0,
      hint: () => t('tests.sourceNotReady'),
      apply(payload, forCount) {
        payload.use_bookmarks = forCount ? 'true' : true
      },
      label: () => t('tests.sourceBookmarksLabel'),
    },
    srs: {
      isReady: () => (wrongAnswerStore.srsDueCount || 0) > 0,
      hint: () => t('tests.sourceNotReady'),
      apply(payload, forCount) {
        payload.use_srs = forCount ? 'true' : true
        if (!forCount) payload.disable_timer = true
      },
      label: () => t('tests.smartReviewTag'),
    },
    blueprint: {
      isReady: () => Boolean(selectedBlueprintId.value),
      hint: () => t('tests.sourceNotReady'),
      apply(payload) {
        payload.blueprint_id = selectedBlueprintId.value
      },
      label() {
        return (
          blueprintOptions.value.find((blueprint) => blueprint.value === selectedBlueprintId.value)
            ?.label || ''
        )
      },
    },
  }

  const activeSourceBehavior = computed(() => sourceBehaviors[source.value] || null)

  const availableSources = computed(() => {
    const definitions = [
      {
        value: 'tag',
        icon: 'bi bi-tag',
        labelKey: 'tests.sourceTagShort',
        badge: tags.value.length || null,
        disabled: tags.value.length === 0,
        disabledReason: t('tests.noTagsAvailable'),
      },
      {
        value: 'category',
        icon: 'bi bi-folder2',
        labelKey: 'tests.sourceCategoryShort',
        badge: categories.value.length || null,
        disabled: categories.value.length === 0,
        disabledReason: t('categories.empty'),
      },
      {
        value: 'bookmarks',
        icon: 'bi bi-bookmark-heart',
        labelKey: 'tests.sourceBookmarksShort',
        badge: bookmarkStore.count || null,
        disabled: bookmarkStore.count === 0,
        disabledReason: t('questions.emptyBookmarks'),
      },
      {
        value: 'srs',
        icon: 'bi bi-arrow-repeat',
        labelKey: 'tests.sourceSrsShort',
        badge: wrongAnswerStore.srsDueCount || null,
        disabled: wrongAnswerStore.srsDueCount === 0,
        disabledReason: t('tests.srsNothingDue'),
      },
    ]

    if (authStore.can('tests.use_blueprint')) {
      definitions.push({
        value: 'blueprint',
        icon: 'bi bi-diagram-3',
        labelKey: 'tests.sourceBlueprintShort',
        badge: blueprintOptions.value.length || null,
        disabled: blueprintOptions.value.length === 0,
        disabledReason: t('admin.blueprints.empty'),
      })
    }

    return definitions
  })

  const canStart = computed(() => {
    if (props.loading) return false
    return activeSourceBehavior.value?.isReady() || false
  })

  const hintForDisabled = computed(() => {
    if (!activeSourceBehavior.value) return t('tests.chooseSource')
    return activeSourceBehavior.value.hint()
  })

  function setMode(next) {
    if (next === mode.value) return
    mode.value = next
    emit('update:mode', next)
    recomputeAvailableCount()
  }

  function setSource(next) {
    if (next === source.value) return
    source.value = next
    if (next !== 'tag') selectedTags.value = []
    if (next !== 'category') selectedCategories.value = []
    if (next !== 'blueprint') selectedBlueprintId.value = null
    recomputeAvailableCount()
  }

  function buildSelectionPayload(forCount = false) {
    const payload = {}
    activeSourceBehavior.value?.apply(payload, forCount)

    if (source.value !== 'tag') {
      const additionalTags = unique(parseTags(filters.tags))
      if (additionalTags.length) payload.tags_filter = additionalTags.join(',')
    }
    if (filters.difficulty) payload.difficulty = filters.difficulty
    if (filters.verified_only) {
      payload.verified_only = forCount ? 'true' : true
    }
    return payload
  }

  function buildStartPayload() {
    return {
      ...buildSelectionPayload(false),
      limit: numQuestions.value,
      session_label: activeSourceBehavior.value?.label() || t('tests.genericTag'),
    }
  }

  async function fetchAvailableCount() {
    if (source.value === 'srs') {
      emit('max-update', wrongAnswerStore.srsDueCount || 0)
      return
    }
    if (source.value === 'bookmarks') {
      emit('max-update', bookmarkStore.count || 0)
      return
    }
    if (!activeSourceBehavior.value) {
      emit('max-update', 0)
      return
    }

    try {
      const result = await questionService.availableCount(buildSelectionPayload(true))
      if (result.count !== undefined) emit('max-update', result.count)
    } catch {
      // The available count is a hint; starting remains governed by the API.
    }
  }

  const { debounced: recomputeAvailableCount } = useDebounceFn(fetchAvailableCount, 300)

  function submit() {
    if (!canStart.value) return
    emit('start', buildStartPayload())
  }

  watch(
    () => props.initialMode,
    (next) => {
      if (next !== mode.value) mode.value = next
    },
  )

  watch(
    [source, selectedTags, selectedCategories, selectedBlueprintId, filters],
    recomputeAvailableCount,
    { deep: true },
  )

  onMounted(async () => {
    tagsLoading.value = true
    try {
      const [tagData] = await Promise.all([
        tagService.list(),
        categoryStore.fetchAll(),
        bookmarkStore.fetchBookmarks(),
        wrongAnswerStore.fetchSrsDueCount(),
        authStore.can('tests.use_blueprint') ? blueprintStore.fetchAll() : Promise.resolve(),
      ])
      tags.value = tagData?.items || []
    } finally {
      tagsLoading.value = false
    }

    if (props.initialUseBookmarks && (bookmarkStore.count || 0) > 0) {
      setSource('bookmarks')
    }

    recomputeAvailableCount()
  })

  return {
    MODE_OPTIONS: [
      {
        value: 'study',
        icon: 'bi bi-book-half',
        titleKey: 'tests.modeStudyLabel',
        descKey: 'tests.studyDescShort',
      },
      {
        value: 'exam',
        icon: 'bi bi-journal-check',
        titleKey: 'tests.modeExamLabel',
        descKey: 'tests.examDescShort',
      },
      {
        value: 'recall',
        icon: 'bi bi-chat-left-text',
        titleKey: 'tests.modeRecallLabel',
        descKey: 'tests.recallDescShort',
      },
    ],
    mode,
    source,
    selectedTags,
    selectedCategories,
    selectedBlueprintId,
    filters,
    numQuestions,
    tagItems,
    tagsLoading,
    categoryItems,
    categoriesLoading,
    blueprintOptions,
    availableSources,
    bookmarkStore,
    wrongAnswerStore,
    canStart,
    hintForDisabled,
    setMode,
    setSource,
    submit,
  }
}
