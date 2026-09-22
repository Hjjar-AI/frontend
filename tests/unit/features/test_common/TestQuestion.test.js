// frontend/tests/unit/features/test_common/TestQuestion.test.js
//
// Component tests for the plain (non-master-exam) test runner.
//
// NAVIGATION-AWAY PATHS
// ---------------------
// The plain runner navigates to the results page on exactly two
// paths:
//
//   1. `onMounted` → `loadQuestion()` → `if (store.isComplete) push(...)`.
//      A freshly mounted component with an already-completed store
//      goes straight to the results page.
//
//   2. `attemptFinish()` → `await store.finish()` → `push(...)`.
//      The user clicks "Finish", the store grades the session, and
//      the runner navigates.
//
// There is deliberately NO reactive watcher on `store.isComplete`.
// The plain runner has no background poll and no server-side
// force-finish, so mid-mount mutation of `isComplete` cannot occur
// from any code path the app exercises. If either of those become
// features (a status poll, a scheduled server-side sweep) the runner
// will need the same `watch(() => store.isComplete, ...)` block that
// `MasterExamRunner.vue` already carries — see the comment on
// `useMasterExamAttemptStore.submitAnswer` for the pattern.
//
// ROUTER MOCK
// -----------
// `mountWithGlobals` imports `createRouter` and `createMemoryHistory`
// from `vue-router` to build the plugin installed in every mount.
// The mock therefore uses `importOriginal` to keep those named
// exports available, and overrides only `useRouter`.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useRouter: () => ({ push: routerPush }),
  }
})

vi.mock('@/composables/useNotify', () => ({
  useNotify: () => ({ notify: vi.fn() }),
}))

vi.mock('@/composables/useDialog', () => ({
  useDialog: () => ({ confirm: vi.fn().mockResolvedValue(true) }),
}))

vi.mock('@/composables/useSound', () => ({
  useSound: () => ({ playClick: vi.fn(), playCorrect: vi.fn(), playIncorrect: vi.fn() }),
}))

vi.mock('@/stores/configStore', () => ({
  useConfigStore: () => ({ maxChoices: 8 }),
}))

import TestQuestion from '@/features/test_common/TestQuestion.vue'
import { mountWithGlobals } from '../../../helpers/mountWithGlobals'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function makeStoreMock(overrides = {}) {
  return {
    isActive: true,
    isComplete: false,
    currentIndex: 0,
    totalQuestions: 3,
    questionIds: [10, 11, 12],
    currentQuestionId: 10,
    answers: {},
    confidence: {},
    progress: 0,
    results: null,
    startedAt: new Date(),
    accumulatedTime: 0,
    durationMinutes: 30,
    tag: '',
    submitStatus: 'idle',
    fetchQuestion: vi.fn().mockResolvedValue({
      question: { id: 10, text: 'Q', choices: ['a', 'b'] },
    }),
    submitAnswer: vi.fn().mockResolvedValue({}),
    finish: vi.fn().mockResolvedValue({
      results: [], total_questions: 0, correct_count: 0, accuracy: 0,
    }),
    pause: vi.fn(),
    resume: vi.fn(),
    hasAnswer: vi.fn().mockReturnValue(false),
    restoreFullState: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const COMMON_STUBS = {
  QuestionDisplay: true,
  Timer: true,
  ProgressBar: true,
  TestNavigation: true,
  ExplanationSection: true,
  QuestionNavDots: true,
  ShortcutHint: true,
  BaseSkeleton: true,
}

describe('TestQuestion — already-complete session on mount', () => {
  it('navigates to the results page when the store reports isComplete', async () => {
    // `loadQuestion()` on mount checks `store.isComplete` before
    // fetching. A store that is already complete routes to the
    // results page without an API call.
    const store = makeStoreMock({ isComplete: true })
    const wrapper = mountWithGlobals(TestQuestion, {
      props: { store, mode: 'exam', isPauseSupported: true },
      global: { stubs: COMMON_STUBS },
    })
    await nextTick()
    await nextTick()
    await nextTick()

    expect(routerPush).toHaveBeenCalledWith('/exam/results')
    // No question was fetched — the guard in `loadQuestion` returned
    // before `fetchQuestion` could run.
    expect(store.fetchQuestion).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not navigate to results when the store is incomplete', async () => {
    const store = makeStoreMock({ isComplete: false })
    const wrapper = mountWithGlobals(TestQuestion, {
      props: { store, mode: 'exam', isPauseSupported: true },
      global: { stubs: COMMON_STUBS },
    })
    await nextTick()
    await nextTick()
    await nextTick()

    expect(routerPush).not.toHaveBeenCalledWith('/exam/results')
    // The mount did fetch the current question, because the
    // `isComplete` guard did not fire.
    expect(store.fetchQuestion).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('uses the study results path when mode is study', async () => {
    const store = makeStoreMock({ isComplete: true })
    const wrapper = mountWithGlobals(TestQuestion, {
      props: { store, mode: 'study', isPauseSupported: true },
      global: { stubs: COMMON_STUBS },
    })
    await nextTick()
    await nextTick()
    await nextTick()

    expect(routerPush).toHaveBeenCalledWith('/study/results')
    wrapper.unmount()
  })
})

describe('TestQuestion — no active session on mount', () => {
  it('redirects to the setup page when there is no active session', async () => {
    // `isActive: false` AND `questionIds: []` triggers the
    // early-return block in `onMounted`. The `restoreFullState`
    // call is a no-op here (it resolves without repopulating the
    // store), so the second `isActive` check fires and the runner
    // routes back to the setup page.
    const store = makeStoreMock({
      isActive: false,
      isComplete: false,
      questionIds: [],
      restoreFullState: vi.fn().mockResolvedValue(undefined),
    })
    const wrapper = mountWithGlobals(TestQuestion, {
      props: { store, mode: 'exam', isPauseSupported: true },
      global: { stubs: COMMON_STUBS },
    })
    await nextTick()
    await nextTick()
    await nextTick()

    expect(routerPush).toHaveBeenCalledWith('/exam')
    expect(store.fetchQuestion).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not redirect when restoreFullState recovers an active session', async () => {
    // When `restoreFullState()` brings the store back to an active
    // state, the runner should NOT redirect to setup — it should
    // fall through to `loadQuestion` and render the question.
    const store = makeStoreMock({
      isActive: false,
      questionIds: [],
      restoreFullState: vi.fn().mockImplementation(async function () {
        // The real store mutates itself; the mock mirrors that by
        // mutating the fields on the same object the component
        // holds a reference to.
        store.isActive = true
        store.questionIds = [10, 11, 12]
      }),
    })
    const wrapper = mountWithGlobals(TestQuestion, {
      props: { store, mode: 'exam', isPauseSupported: true },
      global: { stubs: COMMON_STUBS },
    })
    await nextTick()
    await nextTick()
    await nextTick()

    expect(routerPush).not.toHaveBeenCalledWith('/exam')
    expect(store.fetchQuestion).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('TestQuestion — mode-specific setup path', () => {
  it('uses the study setup path when mode is study', async () => {
    const store = makeStoreMock({
      isActive: false,
      questionIds: [],
      restoreFullState: vi.fn().mockResolvedValue(undefined),
    })
    const wrapper = mountWithGlobals(TestQuestion, {
      props: { store, mode: 'study', isPauseSupported: true },
      global: { stubs: COMMON_STUBS },
    })
    await nextTick()
    await nextTick()
    await nextTick()

    expect(routerPush).toHaveBeenCalledWith('/study')
    wrapper.unmount()
  })
})