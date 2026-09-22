<!-- frontend/src/components/common/DropZone.vue -->
<template>
  <div
    class="drop-zone"
    :class="{
      'drop-zone--active': isDragging,
      'drop-zone--disabled': disabled,
    }"
    :aria-disabled="disabled ? 'true' : 'false'"
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @dragover.prevent
    @drop.prevent="handleDrop"
  >
    
    <input
      type="file"
      ref="fileInput"
      :accept="accept"
      :disabled="disabled"
      class="drop-zone__input"
      @change="handleFileSelect"
    />
    <div class="drop-zone__content">
      <i class="bi bi-cloud-upload drop-zone__icon"></i>
      <p class="drop-zone__text">{{ resolvedLabel }}</p>
      <small class="drop-zone__hint" v-if="hint">{{ hint }}</small>
      <BaseButton
        variant="outline"
        size="small"
        :disabled="disabled"
        @click="openFileDialog"
      >
        {{ resolvedBrowseLabel }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useNotify } from '@/composables/useNotify'
import {
  validateFile,
  FILE_VALIDATION_REASONS,
} from '@/utils/fileValidation'


const { t } = useI18n()

const props = defineProps({
  accept: { type: String, default: '' },
  label: { type: String },
  hint: { type: String, default: '' },
  browseLabel: { type: String },
  disabled: { type: Boolean, default: false },
  // Size limit in megabytes. Optional; when unset, no size check is
  // performed.
  maxSizeMb: { type: Number, default: null },
  // Optional message factory for a wrong-type rejection. Receives
  // the offending file's extension (leading dot included, or the raw
  // filename if it has no dot) and returns the pre-translated message
  // the caller wants displayed. When omitted, DropZone fires a
  // generic `notifications.fileTypeNotAllowed` message.
  //
  // The prop exists so a caller that already had its own wording for
  // a rejection — e.g. `SimpleImportTab`'s "supported: .xlsx, .xls,
  // .csv, .json", or `StateImport`'s "please choose a JSON file
  // only" — keeps that wording now that DropZone validates both
  // picked and dropped files.
  invalidTypeMessageFn: { type: Function, default: null },
})

const emit = defineEmits(['file-selected'])
const { notify } = useNotify()

const resolvedLabel = computed(() => props.label ?? t('ui.dragDropDefaultLabel'))
const resolvedBrowseLabel = computed(() => props.browseLabel ?? t('ui.browseDefaultLabel'))

const isDragging = ref(false)
const fileInput = ref(null)
let dragCounter = 0

watch(() => props.disabled, (isDisabled) => {
  if (isDisabled) {
    isDragging.value = false
    dragCounter = 0
  }
})

function acceptList() {
  if (!props.accept) return []
  return props.accept.split(',').map((s) => s.trim()).filter(Boolean)
}

function runValidation(file) {
  const result = validateFile(file, {
    allowedExtensions: acceptList(),
    maxSizeMb: props.maxSizeMb,
  })
  if (result.ok) return true

  if (result.reason === FILE_VALIDATION_REASONS.TOO_LARGE) {
    notify(t('admin.import.tooLarge', { max: props.maxSizeMb }), 'error')
  } else if (props.invalidTypeMessageFn) {
    notify(props.invalidTypeMessageFn(result.params.ext), 'error')
  } else {
    notify(
      t('notifications.fileTypeNotAllowed', { name: file?.name || '' }),
      'error',
    )
  }
  return false
}

function onDragEnter() {
  if (props.disabled) return
  dragCounter++
  isDragging.value = true
}

function onDragLeave() {
  if (props.disabled) return
  dragCounter--
  if (dragCounter === 0) isDragging.value = false
}

function openFileDialog() {
  if (props.disabled) return
  fileInput.value?.click()
}

function handleFileSelect(e) {
  if (props.disabled) return
  const file = e.target.files[0]
  if (file && runValidation(file)) {
    emit('file-selected', file)
  }
  if (fileInput.value) fileInput.value.value = ''
}

function handleDrop(e) {
  // Reset the drag counter regardless of `disabled` — a drop is a
  // terminal event for the current drag.
  dragCounter = 0
  isDragging.value = false
  if (props.disabled) return

  const file = e.dataTransfer.files[0]
  if (!file) return
  if (!runValidation(file)) return

  emit('file-selected', file)
}
</script>