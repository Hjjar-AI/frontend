<!-- frontend/src/features/admin/FileImport.vue -->
<template>
  <SimpleImportTab
    accept=".xlsx,.xls,.csv,.json"
    :label="t('admin.import.fileLabel')"
    :hint="t('admin.import.fileHint')"
    :button-icon="'bi bi-upload'"
    :button-label="t('admin.import.importButton')"
    :allowed-extensions="ALLOWED"
    :invalid-type-message-fn="badTypeMessage"
    :upload-fn="importDatabase"
    @imported="$emit('imported')"
  />
</template>

<script setup>
import SimpleImportTab from './components/SimpleImportTab.vue'
import { useAdminDatabaseStore } from '@/stores/adminDatabaseStore'

const { t } = useI18n()
const databaseStore = useAdminDatabaseStore()

const ALLOWED = ['.xlsx', '.xls', '.csv', '.json']

// Factory, not a string: the wrapper passes the actual extension of
// the file the user selected, so the message can name it. This
// preserves the exact form the pre-refactor FileImport produced:
//   نوع الملف غير مسموح: .pdf. الأنواع المدعومة: .xlsx, .xls, .csv, .json
function badTypeMessage(ext) {
  return t('admin.import.badType', {
    ext,
    allowed: ALLOWED.join(', '),
  })
}

async function importDatabase(file) {
  const result = await databaseStore.importDatabase(file)
  if (!result) throw new Error(databaseStore.error || t('admin.import.failed'))
  return result
}

defineEmits(['imported'])
</script>
