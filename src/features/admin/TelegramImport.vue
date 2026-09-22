<!-- frontend/src/features/admin/TelegramImport.vue -->
<template>
  <SimpleImportTab
    accept=".json"
    :label="t('admin.import.telegramLabel')"
    :hint="t('admin.import.telegramHint')"
    :button-icon="'bi bi-telegram'"
    :button-label="t('admin.import.telegramButton')"
    :allowed-extensions="ALLOWED"
    :invalid-type-message-fn="badTypeMessage"
    :upload-fn="importTelegram"
    @imported="$emit('imported')"
  />
</template>

<script setup>
import SimpleImportTab from './components/SimpleImportTab.vue'
import { useAdminDatabaseStore } from '@/stores/adminDatabaseStore'

const { t } = useI18n()
const databaseStore = useAdminDatabaseStore()

const ALLOWED = ['.json']

// Telegram import is JSON-only, so the message does not name the
// offending extension — the original pre-refactor TelegramImport.vue
// always showed the same static message. The factory signature is
// the same as FileImport's so the wrapper stays uniform; the
// extension argument is intentionally unused here.
function badTypeMessage() {
  return t('admin.import.badTelegramType')
}

async function importTelegram(file) {
  const result = await databaseStore.importTelegram(file)
  if (!result) throw new Error(databaseStore.error || t('admin.import.failed'))
  return result
}

defineEmits(['imported'])
</script>
