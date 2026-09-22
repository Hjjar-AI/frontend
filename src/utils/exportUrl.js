import { normalizeTheme } from '@/utils/constants'

/**
 * Append presentation/filter parameters to an export endpoint.
 *
 * Theme is sent only for PDFs because it is a browser-local preference and
 * the server cannot otherwise know which palette the user is viewing.
 */
export function buildExportUrl(baseUrl, { format, filterParams = {}, theme } = {}) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filterParams || {})) {
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && value.trim() === '') continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      params.set(key, value.join(','))
    } else {
      params.set(key, String(value))
    }
  }

  if (format === 'pdf') {
    params.set('theme', normalizeTheme(theme))
  }

  const query = params.toString()
  if (!query) return baseUrl
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query}`
}
