<!-- frontend/src/components/common/ExportButtons.vue -->
<template>
  <div class="export-buttons">
    <BaseButton
      v-for="fmt in formats"
      :key="fmt.value"
      :variant="fmt.variant"
      :loading="exportingFormat === fmt.value"
      :disabled="exportingFormat !== null && exportingFormat !== fmt.value"
      @click="exportFile(fmt.value)"
      :aria-label="t('ui.exportAs', { format: fmt.label })"
    >
      <i :class="fmt.icon"></i> {{ fmt.label }}
    </BaseButton>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { downloadBlob } from '@/utils/downloadFile'


const { t } = useI18n()

const props = defineProps({
  // Builds the export URL for one format. Called as
  // `urlBuilder('pdf')` → e.g. '/api/v1/database/export/pdf/'.
  urlBuilder: { type: Function, required: true },

  // Optional filter params. Any key with a non-empty value is
  // appended to the URL as a query param. Keys with `null`,
  // `undefined`, `''`, or an empty array are dropped.
  //
  // The shape is deliberately loose: this component does not know
  // which keys the backend accepts. The parent builds the dict and
  // is responsible for naming. See DatabaseInfo.vue's
  // `exportFilterParams` computed for the reference serializer.
  filterParams: { type: Object, default: () => ({}) },
})

const { notify } = useNotify()
const exportingFormat = ref(null)

const formats = [
  { value: 'excel', label: 'Excel', icon: 'bi-file-earmark-excel', variant: 'success' },
  { value: 'csv', label: 'CSV', icon: 'bi-file-earmark-text', variant: 'primary' },
  { value: 'json', label: 'JSON', icon: 'bi-file-earmark-code', variant: 'info' },
  { value: 'pdf', label: 'PDF', icon: 'bi-file-earmark-pdf', variant: 'danger' },
]


// ── URL construction ─────────────────────────────────────────────
//
// `urlBuilder` returns a relative path. Filter params are appended
// as a query string. Only keys whose value is a non-empty string,
// or a non-empty array, survive; everything else is dropped so the
// caller does not have to strip empty entries before passing the
// dict in.
function buildUrl(format) {
  let url = props.urlBuilder(format)
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(props.filterParams || {})) {
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && value.trim() === '') continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      params.set(key, value.join(','))
    } else {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  if (qs) {
    url += (url.includes('?') ? '&' : '?') + qs
  }
  return url
}


// ── Filename extraction ──────────────────────────────────────────
//
// Django's FileResponse sets a `Content-Disposition: attachment;
// filename="…"` header. We prefer that name over a client-side
// guess so the timestamp the backend baked into the filename is the
// one the user sees. Two forms are handled:
//
//   • RFC 5987: `filename*=UTF-8''encoded` — used by newer Django
//     when the filename contains non-ASCII characters.
//   • Legacy:   `filename="plain"` — used everywhere else.
function extractFilename(response) {
  const cd = response.headers.get('content-disposition') || ''
  if (!cd) return null

  const starMatch = cd.match(/filename\*=UTF-8''([^;]+)/i)
  if (starMatch) {
    try {
      return decodeURIComponent(starMatch[1])
    } catch {
      // fall through to the legacy match
    }
  }

  const legacyMatch = cd.match(/filename="?([^";]+)"?/i)
  return legacyMatch ? legacyMatch[1] : null
}

function defaultFilename(format) {
  const ext = { excel: 'xlsx', csv: 'csv', json: 'json', pdf: 'pdf' }[format] || 'bin'
  const ts = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14)
  return `questions_export_${ts}.${ext}`
}


// ── Fetch-then-download ──────────────────────────────────────────
//
// The previous implementation created a hidden `<a>` and called
// `.click()` on it. That works for the happy path but has a real
// failure mode once filters are in play: an empty result set makes
// the backend return a JSON error envelope, and a direct navigation
// renders that JSON as a blank browser tab instead of a toast.
//
// Fetching the file first means:
//   • HTTP errors (403, 404, 500) surface as a toast, not a blank page.
//   • The button's loading state resets in `finally`, regardless of
//     outcome.
//   • Two concurrent export clicks cannot stomp on each other — the
//     button is disabled while one export is in flight.
//

async function exportFile(format) {
  if (exportingFormat.value !== null) return
  exportingFormat.value = format

  notify(t('notifications.exportingAs', { format: format.toUpperCase() }), 'info')

  const url = buildUrl(format)

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: '*/*' },
    })

    if (!response.ok) {
      let message = `${response.status} ${response.statusText || ''}`.trim()
      try {
        const body = await response.json()
        if (body && typeof body === 'object') {
          message = body.message || body.error || message
        }
      } catch {
        // Response body was not JSON — keep the HTTP status line.
      }
      notify(message, 'error')
      return
    }

    const blob = await response.blob()
    const filename = extractFilename(response) || defaultFilename(format)

    downloadBlob(blob, filename)
  } catch (err) {
    notify(err?.message || t('common.networkError'), 'error')
  } finally {
    exportingFormat.value = null
  }
}
</script>