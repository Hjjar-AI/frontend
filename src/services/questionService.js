// frontend/src/services/questionService.js
//
// CRUD methods (`list`/`get`/`create`/`update`/`delete`) are
// defined inline against `apiClient` — the same pattern every other
// service in this directory follows (categoryService,
// blueprintService, groupService, bookmarkService, ...). The
// `createRepository` factory this service used to import was the
// only consumer of that factory in the entire codebase; it has been
// removed along with the factory module (see git history for
// `services/api/repositoryFactory.js`).
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

const Q = ENDPOINTS.QUESTIONS

export const questionService = {
  // ── CRUD ─────────────────────────────────────────────────────────

  list(params = {}) {
    return apiClient.get(Q.BASE, { params })
  },
  get(id) {
    return apiClient.get(Q.ITEM(id))
  },
  create(data) {
    return apiClient.post(Q.BASE, data)
  },
  update(id, data) {
    return apiClient.put(Q.ITEM(id), data)
  },
  delete(id, config = {}) {
    return apiClient.delete(Q.ITEM(id), config)
  },

  // ── Verification ─────────────────────────────────────────────────

  toggleVerify(id) {
    return apiClient.post(Q.VERIFY(id))
  },
  bulkVerify(questionIds, action, notes) {
    return apiClient.post(Q.BULK_VERIFY, {
      question_ids: questionIds,
      action,
      verification_notes: notes,
    })
  },

  // ── Tags ─────────────────────────────────────────────────────────

  bulkUpdateTags(questionIds, addTags, removeTags) {
    return apiClient.post(Q.BULK_TAGS, {
      question_ids: questionIds,
      add_tags: addTags,
      remove_tags: removeTags,
    })
  },
  listTags() {
    return apiClient.get(Q.TAGS)
  },

  // ── Lists ────────────────────────────────────────────────────────

  getUnverified(params) {
    return apiClient.get(Q.UNVERIFIED, { params })
  },
  batch(ids) {
    return apiClient.post(Q.BATCH, { ids })
  },
  availableCount(params) {
    return apiClient.get(Q.AVAILABLE_COUNT, { params })
  },
  duplicate(id) {
    return apiClient.post(Q.DUPLICATE(id))
  },

  // ── Ratings ──────────────────────────────────────────────────────
  //
  // rateQuestion — write the caller's rating for one question. 1-5.
  // The server upserts (update_or_create) so calling twice with the
  // same value is idempotent.
  //
  // batchRatings — read the caller's rating plus the global average
  // and count for many questions in one round trip. Used by the
  // shared rating batcher
  // (features/questions/composables/useRatingBatcher.js), which
  // collapses the per-card rating fetch into one request per list
  // render.
  //
  // The server caps the id list at 500; the batcher splits above
  // that automatically. Callers that invoke batchRatings directly
  // should observe the same limit.
  rateQuestion(id, rating) {
    return apiClient.post(Q.RATE(id), { rating })
  },
  batchRatings(ids) {
    return apiClient.get(Q.RATINGS_BATCH, {
      params: { ids: ids.join(',') },
    })
  },

  // ── Image ────────────────────────────────────────────────────────

  uploadImage(id, file) {
    if (!file) {
      const fd = new FormData()
      fd.append('delete', 'true')
      return apiClient.post(Q.IMAGE(id), fd)
    }
    const fd = new FormData()
    fd.append('image', file)
    return apiClient.post(Q.IMAGE(id), fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // ── Study Now queue ──────────────────────────────────────────────
  //
  // Asks the server to assemble a personalized session from the
  // caller's own attempt state. Returns:
  //   { question_ids: [int, …], total: int, breakdown: {…} }
  // The caller feeds `question_ids` into the existing study start
  // endpoint via testSessionStore.start('study', { question_ids }).
  studyNow(limit = 20) {
    return apiClient.get(Q.STUDY_NOW, { params: { limit } })
  },

  // ── Case stems ───────────────────────────────────────────────────

  updateCaseStem(caseGroup, caseStem) {
    return apiClient.post(
      Q.CASES_STEM(caseGroup),
      { case_stem: caseStem },
    )
  },
}