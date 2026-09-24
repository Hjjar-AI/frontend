<!-- frontend/src/components/common/ExportButtons.vue -->
<template>
  <div class="export-buttons">
    <BaseButton
      v-for="fmt in formats"
      :key="fmt.value"
      :variant="fmt.variant"
      :loading="exportingFormat === fmt.value"
      :disabled="exportingFormat !== null && exportingFormat !== fmt.value"
      :aria-label="t('ui.exportAs', { format: fmt.label })"
      @click="exportFile(fmt.value)"
    >
      <i :class="fmt.icon"></i> {{ fmt.label }}
    </BaseButton>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { downloadBlob, getResponseFilename } from '@/utils/downloadFile'
import { buildExportUrl as appendExportParams } from '@/utils/exportUrl'

const { t, locale } = useI18n()

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

  // Structured PDF-only options. Supplying pdfRequest switches PDF export to
  // POST so free text and repeatable custom fields never enter the URL.
  pdfOptions: { type: Object, default: () => ({}) },
  pdfRequest: { type: Function, default: null },
})

const { notify } = useNotify()
const exportingFormat = ref(null)

const formats = [
  { value: 'excel', label: 'Excel', icon: 'bi-file-earmark-excel', variant: 'secondary' },
  { value: 'csv', label: 'CSV', icon: 'bi-file-earmark-text', variant: 'secondary' },
  { value: 'json', label: 'JSON', icon: 'bi-file-earmark-code', variant: 'secondary' },
  { value: 'pdf', label: 'PDF', icon: 'bi-file-earmark-pdf', variant: 'secondary' },
]


// ── URL construction ─────────────────────────────────────────────
//
// `urlBuilder` returns a relative path. Filter params are appended
// as a query string. Only keys whose value is a non-empty string,
// or a non-empty array, survive; everything else is dropped so the
// caller does not have to strip empty entries before passing the
// dict in.
function buildUrl(format) {
  const options = {
    format,
    filterParams: props.filterParams,
    theme: document.documentElement.dataset.theme,
    locale: locale.value,
  }
  return appendExportParams(props.urlBuilder(format), options)
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
    if (format === 'pdf' && props.pdfRequest) {
      const filters = { ...props.filterParams }
      const title = filters.title || ''
      delete filters.title
      const response = await props.pdfRequest({
        title,
        filters,
        theme: document.documentElement.dataset.theme,
        locale: locale.value,
        front_matter: props.pdfOptions,
      })
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'application/pdf' })
      const filename = getResponseFilename(response) || defaultFilename(format)
      downloadBlob(blob, filename)
      return
    }

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: '*/*', 'Accept-Language': locale.value },
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
    const filename = getResponseFilename(response) || defaultFilename(format)

    downloadBlob(blob, filename)
  } catch (err) {
    notify(err?.message || t('common.networkError'), 'error')
  } finally {
    exportingFormat.value = null
  }
}
</script>
