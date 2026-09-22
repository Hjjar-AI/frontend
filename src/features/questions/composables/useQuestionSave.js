// frontend/src/features/questions/composables/useQuestionSave.js
//
// Shared post-save work for the question create/edit flow.
//
// AddView.vue and EditView.vue do the following after a successful
// save, in the same order, with the same error handling:
//
//   1. STRIP two sentinel image fields the form injected
//      (`__pending_image`, `__clear_image`) BEFORE the request goes
//      out, so they do not leak into the API payload.
//   2. If either was set, upload the new image (or issue the delete).
//      A failure here does NOT undo the save — the question is
//      already persisted — so it surfaces a warning, not an error.
//   3. Record the chosen category and each tag in the per-user
//      recent-items lists, so the pickers on the next form open
//      default to the most recently used values.
//
// The two views differ in exactly two ways:
//
//   • EditView sends `expected_version` on the update payload, to
//     detect a concurrent edit. That field is read from the loaded
//     question, which only Edit has. The helper does not know about
//     it and does not touch it.
//   • The image-failure message key differs: one for create, one
//     for update. That key is a parameter to `finishSave`.
//
// USAGE (AddView)
// ---------------
//   const { extractSentinels, finishSave } = useQuestionSave()
//
//   const sentinels = extractSentinels(formData)
//   const result = await questionStore.create(formData)
//   if (!result) return
//   await finishSave({
//     questionId: result.id,
//     sentinels,
//     payload: formData,
//     uploadFailureKey: 'questions.imageUploadFailed',
//   })
//   router.push('/questions')
//
// USAGE (EditView)
// ----------------
//   if (question.value?.version !== undefined) {
//     formData.expected_version = question.value.version
//   }
//   const sentinels = extractSentinels(formData)
//   const result = await questionStore.update(id, formData)
//   if (!result) return
//   await finishSave({
//     questionId: id,
//     sentinels,
//     payload: formData,
//     uploadFailureKey: 'questions.imageUploadFailedUpdate',
//   })
//   router.push('/questions')
//
// WHY TWO FUNCTIONS AND NOT ONE
// -----------------------------
// `extractSentinels` MUST run before the save call — the API
// payload cannot contain the two sentinel keys. `finishSave` MUST
// run after the save call — it needs the saved question's id and a
// confirmed success. There is a `questionStore.create/update` call
// in between that belongs to the caller (each view decides whether
// to send `expected_version`, and each has its own store call
// shape). Splitting the helper into the two phases it actually has
// is what lets the caller keep ownership of that middle step.

import { useI18n } from 'vue-i18n'
import { useNotify } from '@/composables/useNotify'
import { useRecentItems } from '@/composables/useRecentItems'
import { questionService } from '@/services/questionService'

export function useQuestionSave() {
  const { t } = useI18n()
  const { notify } = useNotify()
  const { add: addRecentCategory } = useRecentItems('categories')
  const { add: addRecentTag } = useRecentItems('tags')

  /**
   * Read and remove the two image sentinel fields from `payload`.
   *
   * Mutates `payload` in place: the keys are deleted. That is what
   * the caller wants — the same object is passed straight into the
   * store's create/update call, and the API must not see these two
   * keys.
   *
   * @param {Object} payload
   * @returns {{ pendingImage: File|null, clearImage: boolean }}
   */
  function extractSentinels(payload) {
    const pendingImage = payload.__pending_image || null
    const clearImage = payload.__clear_image || false
    delete payload.__pending_image
    delete payload.__clear_image
    return { pendingImage, clearImage }
  }

  /**
   * Run the shared post-save steps.
   *
   * @param {Object} options
   * @param {number} options.questionId       id of the saved question
   * @param {{ pendingImage: File|null, clearImage: boolean }} options.sentinels
   *                                          the object returned by
   *                                          `extractSentinels`
   * @param {Object} options.payload          the same object passed
   *                                          to create/update; read
   *                                          for `category` and
   *                                          `tags` after the save
   * @param {string} options.uploadFailureKey i18n key for the image
   *                                          upload warning
   * @returns {Promise<void>}
   */
  async function finishSave({ questionId, sentinels, payload, uploadFailureKey }) {
    const { pendingImage, clearImage } = sentinels

    // ── Image upload (best-effort) ────────────────────────────
    //
    // When `pendingImage` is null and `clearImage` is true, the
    // service layer sends a delete flag — see
    // `questionService.uploadImage`.
    if (pendingImage || clearImage) {
      try {
        await questionService.uploadImage(questionId, pendingImage)
      } catch (e) {
        // Warning, not error: the question itself saved fine. The
        // caller proceeds to its success navigation; the user sees
        // one warning toast and can retry the image from the edit
        // form.
        notify(e?.message || t(uploadFailureKey), 'warning')
      }
    }

    // ── Recent-items bookkeeping ──────────────────────────────
    //
    // Category and tag lists are stored per-user; see
    // `useRecentItems`. Both calls are idempotent — re-adding an
    // existing value just moves it to the front of the list.
    if (payload.category) addRecentCategory(payload.category)
    if (payload.tags) {
      payload.tags.split(',').forEach(tag => {
        const trimmed = tag.trim()
        if (trimmed) addRecentTag(trimmed)
      })
    }
  }

  return { extractSentinels, finishSave }
}