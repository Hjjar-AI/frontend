<!-- frontend/src/features/admin/components/SimpleImportTab.vue -->
<!--
  Shared "upload a file" tab.

  Renders a DropZone plus a single submit button.

  INVALID-TYPE MESSAGE
  --------------------
  The caller owns the wording for a wrong-type rejection via the
  `invalidTypeMessageFn` prop. DropZone receives the same factory
  and calls it in place of its generic message, so a user who picks
  a wrong-type file sees the caller's wording.

  VALIDATION (first-review item 10)
  ---------------------------------
  Validation runs entirely inside DropZone. This component no longer
  re-checks the file in its own handler — the file that arrives at
  `handleFileSelect` has already passed the same validator the drop
  path uses.
-->
<template>
  <div class="simple-import-tab">
    <DropZone
      :accept="accept"
      :label="label"
      :hint="hint"
      :disabled="loading"
      :max-size-mb="maxSizeMb"
      :invalid-type-message-fn="invalidTypeMessageFn"
      @file-selected="handleFileSelect"
    />

    <div class="simple-import-tab__actions">
      <BaseButton
        variant="primary"
        :loading="loading"
        :disabled="!selectedFile"
        @click="upload"
      >
        <i :class="buttonIcon"></i> {{ buttonLabel }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DropZone from '@/components/common/DropZone.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useNotify } from '@/composables/useNotify'

const { t } = useI18n()

const props = defineProps({
  // Comma-separated accept attribute for the input, e.g. ".json".
  accept: { type: String, required: true },
  // Pre-translated copy.
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  buttonIcon: { type: String, default: 'bi bi-upload' },
  buttonLabel: { type: String, required: true },
  // Retained for the caller's own reference and future use. DropZone
  // receives the same list via the accept prop's parsing.
  allowedExtensions: { type: Array, required: true },
  // Message factory for a wrong-type rejection. Forwarded to DropZone.
  invalidTypeMessageFn: { type: Function, required: true },
  // Maximum size in megabytes. Forwarded to DropZone, which enforces
  // it and fires the shared `admin.import.tooLarge` message on
  // violation.
  maxSizeMb: { type: Number, default: 50 },
  // Async function (File) => response.
  uploadFn: { type: Function, required: true },
})

const emit = defineEmits(['imported'])

const { notify } = useNotify()

const selectedFile = ref(null)
const loading = ref(false)

// The file arrives already validated by DropZone. No re-check here.
function handleFileSelect(file) {
  selectedFile.value = file
}

async function upload() {
  if (!selectedFile.value) {
    notify(t('admin.import.noFile'), 'warning')
    return
  }
  loading.value = true
  try {
    const data = await props.uploadFn(selectedFile.value)
    notify(data?.message || t('admin.import.success'), 'success')
    selectedFile.value = null
    emit('imported')
  } catch (err) {
    notify(err?.message || t('admin.import.failed'), 'error')
  } finally {
    loading.value = false
  }
}
</script>
