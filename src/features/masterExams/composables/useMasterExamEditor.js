import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterExamStore } from '@/stores/masterExamStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useNotify } from '@/composables/useNotify'
import { useDebounceFn } from '@/composables/useDebounceFn'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { questionService } from '@/services/questionService'
import { adminService } from '@/services/adminService'
import { groupService } from '@/services/groupService'
import { caseService } from '@/services/caseService'
import { difficultyLabelFor } from '@/utils/constants'
import { normalizeQuestionChoices } from '@/utils/questionValidators'
import { LIST_SEARCH_DEBOUNCE_MS } from '@/constants/layout'

function emptyDraftForm() {
  return {
    question: '',
    choices: ['', '', '', ''],
    correct_answer: 1,
    explanation: '',
    source: '',
    difficulty: 'medium',
    category: null,
    case_key: '',
  }
}

function toLocalInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function questionListsDiffer(first, second) {
  if (!first || !second || first.length !== second.length) return true
  return first.some((id, index) => id !== second[index])
}

export function useMasterExamEditor(t) {
  const route = useRoute()
  const router = useRouter()
  const masterExamStore = useMasterExamStore()
  const categoryStore = useCategoryStore()
  const { notify } = useNotify()

  const isEdit = computed(() => Boolean(route.params.id))
  const examId = computed(() => (isEdit.value ? Number(route.params.id) : null))
  const questionsById = reactive({})
  const availableGroups = ref([])
  const availableUsers = ref([])
  const availableAttendings = ref([])
  const availableCases = ref([])

  const form = reactive({
    name: '',
    description: '',
    instructions: '',
    exam_topic_tag: '',
    opens_at_local: '',
    closes_at_local: '',
    duration_minutes: 30,
    allow_makeup: true,
    audience_all_doctors: false,
    audience_group_ids: [],
    audience_user_ids: [],
    co_attending_ids: [],
    weight_easy: 1,
    weight_medium: 1,
    weight_hard: 1,
    shuffle_questions: true,
    shuffle_choices: false,
    question_ids: [],
  })
  const { isDirty, markClean } = useUnsavedChanges(() => form, {
    message: () => t('common.unsavedChanges'),
  })

  const draftFormOpen = ref(false)
  const draftForm = ref(emptyDraftForm())
  const pickerOpen = ref(false)
  const pickerSearch = ref('')
  const pickerResults = ref([])
  const pickerLoading = ref(false)
  const pickerSelected = ref(new Set())

  const isFrozen = computed(() => {
    if (!isEdit.value) return false
    const exam = masterExamStore.byId[examId.value]
    return exam ? !exam.can_edit_now : false
  })

  function difficultyLabel(difficulty) {
    return difficultyLabelFor(difficulty, t)
  }

  async function loadQuestionsData(ids) {
    if (!ids?.length) return
    try {
      const response = await questionService.batch(ids)
      for (const question of response.items || []) {
        questionsById[question.id] = question
      }
    } catch {
      // Missing display data should not prevent editing the exam settings.
    }
  }

  async function loadExam() {
    if (!isEdit.value) return
    const exam = await masterExamStore.fetchOne(examId.value)
    if (!exam) return

    Object.assign(form, {
      name: exam.name,
      description: exam.description || '',
      instructions: exam.instructions || '',
      exam_topic_tag: exam.exam_topic_tag || '',
      opens_at_local: toLocalInput(exam.opens_at),
      closes_at_local: toLocalInput(exam.closes_at),
      duration_minutes: exam.duration_minutes,
      allow_makeup: exam.allow_makeup,
      audience_all_doctors: exam.audience_all_doctors,
      audience_group_ids: (exam.audience_groups || []).map((group) => group.id),
      audience_user_ids: (exam.audience_users || []).map((user) => user.id),
      co_attending_ids: (exam.co_attendings || []).map((user) => user.id),
      weight_easy: exam.weight_easy,
      weight_medium: exam.weight_medium,
      weight_hard: exam.weight_hard,
      shuffle_questions: exam.shuffle_questions,
      shuffle_choices: exam.shuffle_choices,
      question_ids: [...(exam.question_ids || [])],
    })

    await loadQuestionsData(form.question_ids)
  }

  async function loadAuxiliaryData() {
    const [, groupsResult, usersResult, casesResult] = await Promise.allSettled([
      categoryStore.fetchAll(),
      groupService.adminList(),
      adminService.listUsers({ per_page: 500 }),
      caseService.list({ limit: 100 }),
    ])

    availableGroups.value =
      groupsResult.status === 'fulfilled' ? groupsResult.value.items || [] : []

    const users = usersResult.status === 'fulfilled' ? usersResult.value.items || [] : []
    availableUsers.value = users.filter((user) => user.role === 'member')
    availableAttendings.value = users.filter(
      (user) => user.role === 'member' && user.capabilities?.includes('master_exams.create'),
    )
    availableCases.value = casesResult.status === 'fulfilled' ? casesResult.value.items || [] : []
  }

  function moveQuestion(index, target) {
    if (index < 0 || index >= form.question_ids.length) return
    const next = [...form.question_ids]
    const [questionId] = next.splice(index, 1)
    next.splice(Math.max(0, Math.min(target, next.length)), 0, questionId)
    form.question_ids = next
  }

  const moveUp = (index) => moveQuestion(index, index - 1)
  const moveDown = (index) => moveQuestion(index, index + 1)
  const moveTop = (index) => moveQuestion(index, 0)
  const moveBottom = (index) => moveQuestion(index, form.question_ids.length - 1)

  function removeQuestion(index) {
    form.question_ids.splice(index, 1)
  }

  async function loadPicker() {
    pickerLoading.value = true
    try {
      const response = await questionService.list({
        search: pickerSearch.value,
        per_page: 30,
      })
      pickerResults.value = response.items || []
    } catch {
      pickerResults.value = []
    } finally {
      pickerLoading.value = false
    }
  }

  const { debounced: debouncedPicker } = useDebounceFn(loadPicker, LIST_SEARCH_DEBOUNCE_MS)

  function onPickerSearch(value) {
    pickerSearch.value = value
    debouncedPicker()
  }

  function togglePicker(questionId) {
    if (form.question_ids.includes(questionId)) return
    const selected = new Set(pickerSelected.value)
    if (selected.has(questionId)) selected.delete(questionId)
    else selected.add(questionId)
    pickerSelected.value = selected
  }

  function confirmPicker() {
    const questionIds = Array.from(pickerSelected.value)
    form.question_ids = [...form.question_ids, ...questionIds]
    loadQuestionsData(questionIds)
    pickerSelected.value = new Set()
    pickerOpen.value = false
  }

  function buildExamPayload() {
    return {
      name: form.name.trim(),
      description: form.description,
      instructions: form.instructions,
      exam_topic_tag: form.exam_topic_tag,
      opens_at: form.opens_at_local ? new Date(form.opens_at_local).toISOString() : null,
      closes_at: form.closes_at_local ? new Date(form.closes_at_local).toISOString() : null,
      duration_minutes: Number(form.duration_minutes),
      allow_makeup: form.allow_makeup,
      audience_all_doctors: form.audience_all_doctors,
      audience_group_ids: form.audience_group_ids,
      audience_user_ids: form.audience_user_ids,
      co_attending_ids: form.co_attending_ids,
      weight_easy: Number(form.weight_easy),
      weight_medium: Number(form.weight_medium),
      weight_hard: Number(form.weight_hard),
      shuffle_questions: form.shuffle_questions,
      shuffle_choices: form.shuffle_choices,
    }
  }

  async function syncQuestions(serverQuestionIds) {
    const localQuestionIds = form.question_ids || []
    const serverSet = new Set(serverQuestionIds)
    const localSet = new Set(localQuestionIds)
    const toAdd = localQuestionIds.filter((id) => !serverSet.has(id))
    const toRemove = serverQuestionIds.filter((id) => !localSet.has(id))

    if (toAdd.length) {
      const added = await masterExamStore.addQuestions(examId.value, toAdd)
      if (!added) return false
    }
    for (const questionId of toRemove) {
      const removed = await masterExamStore.removeQuestion(examId.value, questionId)
      if (!removed) return false
    }
    if (questionListsDiffer(serverQuestionIds, localQuestionIds)) {
      await masterExamStore.reorder(examId.value, localQuestionIds)
    }
    return true
  }

  async function saveInternal({ navigateAfterCreate = true } = {}) {
    const payload = buildExamPayload()
    if (!payload.name) {
      notify(t('masterExams.nameRequired'), 'error')
      return null
    }
    if (!payload.opens_at || !payload.closes_at) {
      notify(t('masterExams.datesRequired'), 'error')
      return null
    }

    if (isEdit.value) {
      const exam = masterExamStore.byId[examId.value]
      const result = await masterExamStore.update(examId.value, {
        ...payload,
        expected_version: exam?.version || 1,
      })
      if (!result) return result
      const synced = await syncQuestions(result.question_ids || [])
      if (!synced) return result
      await masterExamStore.fetchOne(examId.value)
      markClean()
      return result
    }

    const result = await masterExamStore.create({
      ...payload,
      question_ids: form.question_ids,
    })
    if (result) markClean()
    if (result && navigateAfterCreate) {
      router.replace(`/master-exams/${result.id}/edit`)
    }
    return result
  }

  async function addDraft() {
    const { choices, correctAnswer } = normalizeQuestionChoices(
      draftForm.value.choices,
      draftForm.value.correct_answer,
    )

    if (!draftForm.value.question.trim()) {
      notify(t('validation.required'), 'error')
      return
    }
    if (choices.length < 2) {
      notify(t('validation.minChoices', { min: 2 }), 'error')
      return
    }
    if (correctAnswer === null) {
      notify(t('validation.correctAnswerEmpty'), 'error')
      return
    }

    const payload = {
      question: draftForm.value.question.trim(),
      choices,
      correct_answer: correctAnswer,
      explanation: draftForm.value.explanation,
      source: draftForm.value.source,
      difficulty: draftForm.value.difficulty,
      category: draftForm.value.category,
      case_key: draftForm.value.case_key || null,
    }

    if (!isEdit.value) {
      const savedExam = await saveInternal({ navigateAfterCreate: false })
      if (!savedExam) return
      const draft = await masterExamStore.addDraft(savedExam.id, payload)
      if (draft) router.replace(`/master-exams/${savedExam.id}/edit`)
      return
    }

    const draft = await masterExamStore.addDraft(examId.value, payload)
    if (!draft) return
    form.question_ids.push(draft.id)
    questionsById[draft.id] = {
      ...draft,
      is_draft: true,
      category_name: draft.category_name,
    }
    draftForm.value = emptyDraftForm()
    draftFormOpen.value = false
  }

  async function save() {
    await saveInternal()
  }

  onMounted(async () => {
    await Promise.all([loadAuxiliaryData(), loadExam(), loadPicker()])
    markClean()
  })

  return {
    router,
    masterExamStore,
    categoryStore,
    isEdit,
    examId,
    isFrozen,
    isDirty,
    form,
    questionsById,
    availableGroups,
    availableUsers,
    availableAttendings,
    availableCases,
    draftFormOpen,
    draftForm,
    pickerOpen,
    pickerSearch,
    pickerResults,
    pickerLoading,
    pickerSelected,
    difficultyLabel,
    moveUp,
    moveDown,
    moveTop,
    moveBottom,
    removeQuestion,
    loadExam,
    loadPicker,
    onPickerSearch,
    togglePicker,
    confirmPicker,
    addDraft,
    save,
  }
}
