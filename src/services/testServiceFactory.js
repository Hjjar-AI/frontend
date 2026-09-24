// frontend/src/services/testServiceFactory.js
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export function createTestService(mode) {
  const endpoints = {
    exam: ENDPOINTS.EXAM,
    study: ENDPOINTS.STUDY,
    recall: ENDPOINTS.RECALL,
  }[mode]

  if (!endpoints) throw new Error(`Invalid test mode: ${mode}`)

  return {
    start(config) {
      return apiClient.post(endpoints.START, config)
    },

    getQuestion(sessionId) {
      return apiClient.get(endpoints.QUESTION, { params: { session_id: sessionId } })
    },

    submitAnswer(
      sessionId,
      answer,
      action = 'next',
      targetIndex = null,
      confidence = null,
      errorReason = null,
      preAnswer = null,
    ) {
      const payload = { session_id: sessionId, answer, action }
      if (targetIndex !== null) payload.target_index = targetIndex
      if (answer !== null && answer !== undefined) {
        if (confidence !== null && confidence !== undefined) {
          payload.confidence = confidence
        }
        if (errorReason) payload.error_reason = errorReason
      }
      if (preAnswer !== null && preAnswer !== undefined) payload.pre_answer = preAnswer
      return apiClient.post(endpoints.ANSWER, payload)
    },

    finish(sessionId) {
      return apiClient.post(endpoints.RESULTS, { session_id: sessionId })
    },

    pause(sessionId) {
      if (endpoints.PAUSE) return apiClient.post(endpoints.PAUSE, { session_id: sessionId })
    },
    resume(sessionId, mode) {
      if (!endpoints.RESUME) return Promise.resolve(null)
      const payload = {}
      if (sessionId) payload.session_id = sessionId
      if (mode) payload.mode = mode
      return apiClient.post(endpoints.RESUME, payload)
    },

    discardProgress(sessionId, mode) {
      if (!endpoints.DISCARD) return
      const body = {}
      if (sessionId) body.session_id = sessionId
      if (mode) body.mode = mode
      const payload = Object.keys(body).length ? { data: body } : {}
      return apiClient.delete(endpoints.DISCARD, payload)
    },

    status(sessionId) {
      if (endpoints.STATUS) return apiClient.get(endpoints.STATUS, { params: { session_id: sessionId } })
    },
  }
}
