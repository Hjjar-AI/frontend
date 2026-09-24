<!-- frontend/src/features/admin/StateImport.vue -->
<template>
  <div class="state-import">
    <DropZone
      accept=".json,.xlsx"
      :label="t('admin.import.stateLabel')"
      :hint="t('admin.import.stateHint')"
      :disabled="loading"
      :invalid-type-message-fn="invalidStateMessage"
      @file-selected="handleFileSelect"
    />

    <div v-if="selectedFile" class="state-import__file">
      <i class="bi bi-file-earmark-code"></i>
      <span class="state-import__filename">{{ selectedFile.name }}</span>
      <span class="state-import__size">{{ humanSize }}</span>
    </div>

    <fieldset class="state-import__mode">
      <legend>{{ t('admin.import.stateModeLabel') }}</legend>
      <BaseRadio v-model="mode" name="state-import-mode" value="merge" class="state-import__mode-option">
        <span>
          <strong>{{ t('admin.import.stateModeMerge') }}</strong>
        </span>
      </BaseRadio>
      <BaseRadio v-model="mode" name="state-import-mode" value="replace" class="state-import__mode-option">
        <span>
          <strong>{{ t('admin.import.stateModeReplace') }}</strong>
        </span>
      </BaseRadio>
      <p v-if="mode === 'replace'" class="state-import__warning">
        <i class="bi bi-exclamation-triangle"></i>
        {{ t('admin.import.stateReplaceWarning') }}
      </p>
    </fieldset>

    <fieldset class="state-import__mode">
      <legend>{{ t('admin.import.conflictStrategyLabel') }}</legend>
      <BaseRadio v-model="conflictStrategy" name="state-conflict-mode" value="keep_local" class="state-import__mode-option">
        <span><strong>{{ t('admin.import.conflictKeepLocal') }}</strong></span>
      </BaseRadio>
      <BaseRadio v-model="conflictStrategy" name="state-conflict-mode" value="use_imported" class="state-import__mode-option">
        <span><strong>{{ t('admin.import.conflictUseImported') }}</strong></span>
      </BaseRadio>
      <BaseRadio v-model="conflictStrategy" name="state-conflict-mode" value="review" class="state-import__mode-option">
        <span><strong>{{ t('admin.import.conflictReviewManually') }}</strong></span>
      </BaseRadio>
    </fieldset>

    <div class="state-import__actions">
      <BaseButton
        variant="secondary"
        :disabled="!selectedFile"
        :loading="previewLoading"
        @click="preview"
      >
        <i class="bi bi-eye"></i> {{ t('admin.import.statePreviewButton') }}
      </BaseButton>
      <BaseButton variant="primary" :disabled="!selectedFile" :loading="loading" @click="upload">
        <i class="bi bi-upload"></i> {{ t('admin.import.stateButton') }}
      </BaseButton>
    </div>

    <div v-if="previewCounts" class="state-import__preview">
      <h4><i class="bi bi-clipboard-data"></i> {{ t('admin.import.statePreviewTitle') }}</h4>
      <ul class="state-import__counts">
        <li>
          <span>{{ t('admin.import.stateCountCategories') }}</span>
          <strong
            >{{ previewCounts.categories_created }} / {{ previewCounts.categories_updated }}</strong
          >
        </li>
        <li>
          <span>{{ t('admin.import.stateCountTags') }}</span>
          <strong>{{ previewCounts.tags_created }}</strong>
        </li>
        <li>
          <span>{{ t('admin.import.stateCountCases') }}</span>
          <strong>{{ previewCounts.cases_created }}</strong>
        </li>
        <li>
          <span>{{ t('admin.import.stateCountQuestionsCreated') }}</span>
          <strong>{{ previewCounts.questions_created }}</strong>
        </li>
        <li v-if="previewCounts.questions_skipped">
          <span>{{ t('admin.import.stateCountQuestionsSkipped') }}</span>
          <strong>{{ previewCounts.questions_skipped }}</strong>
        </li>
        <li v-if="previewCounts.questions_updated">
          <span>{{ t('admin.import.stateCountQuestionsUpdated') }}</span>
          <strong>{{ previewCounts.questions_updated }}</strong>
        </li>
        <li v-if="mode === 'replace'">
          <span>{{ t('admin.import.stateCountQuestionsDeleted') }}</span>
          <strong>{{ previewCounts.questions_deleted }}</strong>
        </li>
        <li>
          <span>{{ t('admin.import.stateCountImages') }}</span>
          <strong>{{ previewCounts.images_imported }}</strong>
        </li>
        <li v-if="previewConflictCount">
          <span>{{ t('admin.import.stateCountConflicts') }}</span>
          <strong>{{ previewConflictCount }}</strong>
        </li>
      </ul>
      <p class="state-import__preview-hint">
        <i class="bi bi-info-circle"></i>
        {{ t('admin.import.statePreviewHint') }}
      </p>
    </div>

    <AuthorMappingModal
      v-model:is-open="mappingModalOpen"
      :authors="mappingAuthors"
      :users="mappingUsers"
      @confirm="handleMappingConfirm"
      @cancel="clearPendingFlow"
    />
    <ConflictResolutionModal
      v-model:is-open="conflictModalOpen"
      :conflicts="pendingConflicts"
      @confirm="handleConflictConfirm"
      @cancel="clearPendingFlow"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { useDialog } from '@/composables/useDialog'
import { useAdminDatabaseStore } from '@/stores/adminDatabaseStore'
import { useUserStore } from '@/stores/userStore'
import DropZone from '@/components/common/DropZone.vue'
import BaseRadio from '@/components/base/BaseRadio.vue'
import AuthorMappingModal from './components/AuthorMappingModal.vue'
import ConflictResolutionModal from './components/ConflictResolutionModal.vue'

const { t } = useI18n()

const { notify } = useNotify()
const { confirm, prompt } = useDialog()
const databaseStore = useAdminDatabaseStore()
const userStore = useUserStore()

const emit = defineEmits(['imported'])

const selectedFile = ref(null)
const mode = ref('merge')
const conflictStrategy = ref('keep_local')
const loading = ref(false)
const previewLoading = ref(false)
const previewCounts = ref(null)
const previewConflictCount = ref(0)
const mappingModalOpen = ref(false)
const mappingAuthors = ref([])
const mappingUsers = ref([])
const pendingAdminPassword = ref('')
const conflictModalOpen = ref(false)
const pendingConflicts = ref([])
const pendingUnknowns = ref([])
const pendingConflictResolutions = ref({})

let cachedUsers = null

const humanSize = computed(() => {
  if (!selectedFile.value) return ''
  const bytes = selectedFile.value.size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
})

// DropZone handles the type check via the accept attribute.
// This factory supplies the wording for a rejection. It ignores the
// extension argument on purpose — the previous implementation
// always showed the same static message for this surface.
function invalidStateMessage() {
  return t('admin.import.badStateType')
}

// The file arrives already validated by DropZone.
function handleFileSelect(file) {
  selectedFile.value = file
  previewCounts.value = null
  previewConflictCount.value = 0
}

watch(mode, (value) => {
  conflictStrategy.value = value === 'replace' ? 'use_imported' : 'keep_local'
})

async function preview() {
  if (!selectedFile.value) return
  previewLoading.value = true
  try {
    const res = await databaseStore.importState(selectedFile.value, mode.value, {
      analyze: true,
      conflictStrategy: conflictStrategy.value,
    })
    if (!res) throw new Error(databaseStore.error || t('admin.import.stateFailed'))
    previewCounts.value = res.counts || null
    previewConflictCount.value = res.conflict_count || 0
  } catch (err) {
    notify(err?.message || t('admin.import.stateFailed'), 'error')
    previewCounts.value = null
    previewConflictCount.value = 0
  } finally {
    previewLoading.value = false
  }
}

async function loadUsersForMapping() {
  if (cachedUsers !== null) return cachedUsers
  try {
    const res = await userStore.fetchList({ per_page: 500 })
    if (!res) throw new Error(userStore.error || t('notifications.usersLoadFailed'))
    cachedUsers = userStore.items.map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name || '',
    }))
  } catch {
    cachedUsers = []
  }
  return cachedUsers
}

async function upload() {
  if (!selectedFile.value) {
    notify(t('admin.import.stateDropFirst'), 'warning')
    return
  }

  let adminPassword = ''
  if (mode.value === 'replace') {
    const ok = await confirm(t('admin.import.stateReplaceWarning'))
    if (!ok) return

    const entered = await prompt(t('admin.database.clearAdminPassword'), '')
    if (!entered) return
    adminPassword = entered
  }

  loading.value = true
  try {
    const analysis = await databaseStore.importState(selectedFile.value, mode.value, {
      analyze: true,
      conflictStrategy: conflictStrategy.value,
    })
    if (!analysis) throw new Error(databaseStore.error || t('admin.import.stateFailed'))

    pendingUnknowns.value = analysis.unknown_authors || []
    pendingConflicts.value = analysis.conflicts || []
    pendingAdminPassword.value = adminPassword

    if (conflictStrategy.value === 'review' && pendingConflicts.value.length > 0) {
      conflictModalOpen.value = true
      return
    }

    if (pendingUnknowns.value.length > 0) {
      mappingAuthors.value = pendingUnknowns.value
      mappingUsers.value = await loadUsersForMapping()
      mappingModalOpen.value = true
      return
    }

    await completeImport({}, adminPassword, {})
  } catch (err) {
    notify(err?.message || t('admin.import.stateFailed'), 'error')
  } finally {
    loading.value = false
  }
}

function clearPendingMapping() {
  mappingModalOpen.value = false
  mappingAuthors.value = []
  mappingUsers.value = []
  pendingAdminPassword.value = ''
}

function clearPendingFlow() {
  clearPendingMapping()
  conflictModalOpen.value = false
  pendingConflicts.value = []
  pendingUnknowns.value = []
  pendingConflictResolutions.value = {}
}

async function completeImport(mapping, adminPassword, conflictResolutions = {}) {
  const res = await databaseStore.importState(selectedFile.value, mode.value, {
    mapping,
    adminPassword,
    conflictStrategy: conflictStrategy.value,
    conflictResolutions,
  })
  if (!res) throw new Error(databaseStore.error || t('admin.import.stateFailed'))

  notify(
    t('admin.import.stateSuccess', { questions: res?.counts?.questions_created ?? 0 }),
    'success',
  )
  selectedFile.value = null
  previewCounts.value = null
  previewConflictCount.value = 0
  emit('imported', res)
}

async function handleMappingConfirm(mapping) {
  const adminPassword = pendingAdminPassword.value
  const conflictResolutions = { ...pendingConflictResolutions.value }
  clearPendingFlow()
  loading.value = true
  try {
    await completeImport(mapping, adminPassword, conflictResolutions)
  } catch (err) {
    notify(err?.message || t('admin.import.stateFailed'), 'error')
  } finally {
    loading.value = false
  }
}

async function handleConflictConfirm(resolutions) {
  conflictModalOpen.value = false
  pendingConflictResolutions.value = resolutions
  if (pendingUnknowns.value.length > 0) {
    mappingAuthors.value = pendingUnknowns.value
    mappingUsers.value = await loadUsersForMapping()
    mappingModalOpen.value = true
    return
  }
  const adminPassword = pendingAdminPassword.value
  loading.value = true
  try {
    await completeImport({}, adminPassword, resolutions)
    clearPendingFlow()
  } catch (err) {
    notify(err?.message || t('admin.import.stateFailed'), 'error')
  } finally {
    loading.value = false
  }
}
</script>
