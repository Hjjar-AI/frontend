// frontend/src/services/api/errorHandler.js
import { i18n } from '@/i18n'

export function normalizeError(error) {
  const t = i18n.global.t

  if (error?.response) {
    const status = error.response.status
    const body = error.response.data || {}

    const message =
      body.message ||
      body.error ||
      body.detail ||
      body.data?.message ||
      body.data?.detail ||
      t('errors.serverError')

    return {
      message,
      code: status,
      details: body.data?.details || body.details || null,
    }
  } else if (error?.request) {
    return {
      message: t('common.networkError'),
      code: 'NETWORK',
      details: null,
    }
  } else {
    return {
      message: error?.message || t('common.unexpectedError'),
      code: 'UNKNOWN',
      details: null,
    }
  }
}
