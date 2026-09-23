// frontend/src/composables/useAnswerSubmission.js
import { computed } from 'vue'

export function useAnswerSubmission(store) {
  let tail = Promise.resolve()

  function submitAnswer(
    answer,
    action = 'next',
    targetIndex = null,
    confidence = null,
    errorReason = null,
    preAnswer = null,
  ) {
    const task = tail.then(() =>
      store.submitAnswer(answer, action, targetIndex, confidence, errorReason, preAnswer)
    )
    // Keep the chain alive after a rejection. The caller still receives
    // the rejected promise they can handle — `tail` gets a different,
    // already-settled promise.
    tail = task.catch(() => {})
    return task
  }

  const submitting = computed(() => store.isSubmitLoading)

  return { submitting, submitAnswer }
}
