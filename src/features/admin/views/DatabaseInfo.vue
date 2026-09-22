<!-- frontend/src/features/admin/views/DatabaseInfo.vue -->
<template>
  <Layout>
    <div class="database-info">
      <PageHeader :title="t('admin.database.title')" icon="bi bi-database" />
      <ErrorBanner :error="adminDatabaseStore.error" @dismiss="adminDatabaseStore.error = null" />
      <div class="grid-2col">
        <BaseCard>
          <h4 class="card-title">
            <i class="card-title__icon bi bi-info-circle"></i> {{ t('admin.database.infoTitle') }}
          </h4>
          <table class="table-shared">
            <tbody>
              <tr>
                <th>{{ t('admin.database.type') }}</th>
                <td>{{ dbInfo.database_type || 'SQLite' }}</td>
              </tr>
              <tr>
                <th>{{ t('admin.database.fileSize') }}</th>
                <td>{{ dbInfo.file_size || '0 KB' }}</td>
              </tr>
              <tr>
                <th>{{ t('admin.database.lastModified') }}</th>
                <td>{{ dbInfo.file_modified || 'N/A' }}</td>
              </tr>
              <tr>
                <th>{{ t('admin.database.totalQuestions') }}</th>
                <td>{{ dbInfo.total_questions || 0 }}</td>
              </tr>
              <tr>
                <th>{{ t('admin.database.verifiedQuestions') }}</th>
                <td>{{ dbInfo.verified_count || 0 }}</td>
              </tr>
              <tr>
                <th>{{ t('admin.database.totalUsers') }}</th>
                <td>{{ dbInfo.total_users || 0 }}</td>
              </tr>
              <tr>
                <th>{{ t('admin.database.totalCategories') }}</th>
                <td>{{ dbInfo.total_categories || 0 }}</td>
              </tr>
              <tr>
                <th>{{ t('admin.database.totalSessions') }}</th>
                <td>{{ dbInfo.total_sessions || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </BaseCard>
        <div>
          <BaseCard class="state-export-card">
            <h4 class="card-title">
              <i class="card-title__icon bi bi-box-seam"></i>
              {{ t('admin.database.exportStateTitle') }}
            </h4>
            <p
              class="text-muted state-export-card__description"
            >
              {{ t('admin.database.exportStateDesc') }}
            </p>
            <div class="export-buttons">
              <BaseButton variant="primary" @click="exportState(true)">
                <i class="bi bi-images"></i>
                {{ t('admin.database.exportStateWithImages') }}
              </BaseButton>
              <BaseButton variant="secondary" @click="exportState(false)">
                <i class="bi bi-file-earmark-code"></i>
                {{ t('admin.database.exportStateWithoutImages') }}
              </BaseButton>
            </div>
          </BaseCard>

          <BaseCard>
            <h4 class="card-title">
              <i class="card-title__icon bi bi-download"></i>
              {{ t('admin.database.exportTitle') }}
            </h4>

            <ExportFilters v-model="exportFilters" />

            <ExportButtons :url-builder="buildExportUrl" :filter-params="exportFilterParams" />
          </BaseCard>

          <BaseCard>
            <h4 class="card-title">
              <i class="card-title__icon bi bi-life-preserver"></i>
              {{ t('admin.database.backupTitle') }}
            </h4>
            <div class="d-flex gap-1 flex-wrap mb-2">
              <BaseButton
                variant="primary"
                @click="createBackup"
                :loading="adminDatabaseStore.isLoading"
              >
                <i class="bi bi-plus-circle"></i> {{ t('admin.database.createBackup') }}
              </BaseButton>
              <BaseButton
                variant="secondary"
                @click="fetchBackups"
                :loading="adminDatabaseStore.isLoading"
              >
                <i class="bi bi-list"></i> {{ t('admin.database.listBackups') }}
              </BaseButton>
            </div>

            <div v-if="adminDatabaseStore.backups.length" class="backup-list">
              <div
                v-for="backup in adminDatabaseStore.backups"
                :key="backup.name"
                class="backup-item"
              >
                <span>{{ backup.name }}</span>
                <span>{{ backup.size }}</span>
                <span>{{ formatDateTime(backup.modified) }}</span>
                <BaseButton variant="warning" size="small" @click="openRestoreModal(backup.name)">
                  <i class="bi bi-arrow-counterclockwise"></i>
                  {{ t('admin.database.restoreButton') }}
                </BaseButton>
              </div>
            </div>
          </BaseCard>
          <BaseCard class="danger-zone">
            <h4 class="card-title">
              <i class="card-title__icon bi bi-exclamation-triangle"></i>
              {{ t('admin.database.dangerTitle') }}
            </h4>
            <p class="danger-description">
              {{
                t('admin.database.dangerDesc', {
                  questions: dbInfo.total_questions || 0,
                  sessions: dbInfo.total_sessions || 0,
                })
              }}
            </p>
            <BaseInput
              v-model="adminPassword"
              :label="t('admin.database.clearAdminPassword')"
              type="password"
              :placeholder="t('admin.database.clearAdminPasswordPlaceholder')"
              required
              autocomplete="current-password"
            />
            <BaseInput
              v-model="deleteConfirmation"
              :label="t('admin.database.clearTypedConfirm')"
              placeholder="DELETE"
            />
            <BaseButton
              variant="danger"
              :disabled="deleteConfirmation !== 'DELETE' || !adminPassword"
              @click="clearDatabase"
              :loading="adminDatabaseStore.isLoading"
            >
              <i class="bi bi-trash"></i> {{ t('admin.database.clearButton') }}
            </BaseButton>
          </BaseCard>
        </div>
      </div>

      <BaseModal
        :is-open="restoreModalOpen"
        :title="t('admin.database.restoreTitle')"
        size="sm"
        @update:is-open="closeRestoreModal"
      >
        <i18n-t keypath="admin.database.restoreConfirm" tag="p" class="danger-description">
          <template #name>
            <strong>{{ restoreTargetName }}</strong>
          </template>
        </i18n-t>
        <BaseInput
          v-model="restorePassword"
          :label="t('admin.database.restorePassword')"
          type="password"
          :placeholder="t('admin.database.restorePasswordPlaceholder')"
          required
          autocomplete="current-password"
          @keyup.enter="submitRestore"
        />
        <template #footer>
          <BaseButton variant="secondary" @click="closeRestoreModal">{{
            t('common.cancel')
          }}</BaseButton>
          <BaseButton
            variant="warning"
            :disabled="!restorePassword"
            :loading="adminDatabaseStore.isLoading"
            @click="submitRestore"
          >
            <i class="bi bi-arrow-counterclockwise"></i> {{ t('admin.database.restoreButton') }}
          </BaseButton>
        </template>
      </BaseModal>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import ExportButtons from '@/components/common/ExportButtons.vue'
import ExportFilters from '../components/ExportFilters.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useAdminDatabaseStore } from '@/stores/adminDatabaseStore'
import { useNotify } from '@/composables/useNotify'
import { formatDateTime } from '@/utils/formatters'
import { downloadUrl } from '@/utils/downloadFile'

const { t } = useI18n()

const adminDatabaseStore = useAdminDatabaseStore()
const { notify } = useNotify()

const dbInfo = computed(() => adminDatabaseStore.databaseInfo || {})

const deleteConfirmation = ref('')
const adminPassword = ref('')

const restoreModalOpen = ref(false)
const restoreTargetName = ref('')
const restorePassword = ref('')

// ── Export filters + title ────────────────────────────────────────
//
// The panel binds to this object via v-model. The three filter
// groups are ARRAYS (difficulty, categories, tags); `search` and
// `title` are scalars. The title is a document label, not a filter,
// and is used by PDF export only. Every key is initialised so the
// template and the panel can read it without `?.` chains.
const exportFilters = ref({
  title: '',
  search: '',
  difficulties: [],
  category_ids: [],
  tags_filter: [],
})

// Serialize the panel state into query params.
//
// Multi-value keys are comma-joined. The backend accepts either a
// single value or a comma-separated list for each of the three
// filter keys, so the wire format is unchanged from the single-select
// version of this feature.
//
// `title` is a plain string and is forwarded verbatim. The backend
// caps it at 150 chars and PDF export sanitizes the filename part.
//
// Empty values are dropped so an admin who never touches the panel
// gets the exact pre-filter URL.
const exportFilterParams = computed(() => {
  const params = {}
  const f = exportFilters.value

  if (f.title) {
    params.title = f.title
  }
  if (f.search) {
    params.search = f.search
  }
  if (Array.isArray(f.difficulties) && f.difficulties.length > 0) {
    params.difficulty = f.difficulties.join(',')
  }
  if (Array.isArray(f.category_ids) && f.category_ids.length > 0) {
    params.category_ids = f.category_ids.join(',')
  }
  if (Array.isArray(f.tags_filter) && f.tags_filter.length > 0) {
    params.tags_filter = f.tags_filter.join(',')
  }

  return params
})

const buildExportUrl = (fmt) => adminDatabaseStore.exportUrl(fmt)

async function loadDbInfo() {
  await adminDatabaseStore.fetchDatabaseInfo()
}

async function createBackup() {
  await adminDatabaseStore.createBackup()
  await fetchBackups()
}

async function fetchBackups() {
  await adminDatabaseStore.fetchBackups()
}

function exportState(includeImages) {
  // URL construction stays behind the database store boundary.
  const url = adminDatabaseStore.exportStateUrl(includeImages, false)
  downloadUrl(url)
  notify(
    t(
      includeImages
        ? 'admin.database.exportStateStartedWithImages'
        : 'admin.database.exportStateStartedWithoutImages',
    ),
    'info',
  )
}

function openRestoreModal(name) {
  restoreTargetName.value = name
  restorePassword.value = ''
  restoreModalOpen.value = true
}

function closeRestoreModal() {
  restoreModalOpen.value = false
  restorePassword.value = ''
  restoreTargetName.value = ''
}

async function submitRestore() {
  if (!restorePassword.value) {
    notify(t('admin.database.restorePasswordRequired'), 'error')
    return
  }
  const result = await adminDatabaseStore.restoreBackup(
    restoreTargetName.value,
    restorePassword.value,
  )
  if (result) {
    closeRestoreModal()
    await loadDbInfo()
    await fetchBackups()
  }
}

async function clearDatabase() {
  if (deleteConfirmation.value !== 'DELETE') return
  const result = await adminDatabaseStore.clearDatabase(adminPassword.value)
  if (result) {
    deleteConfirmation.value = ''
    adminPassword.value = ''
    await loadDbInfo()
    await fetchBackups()
  }
}

onMounted(() => {
  loadDbInfo()
  fetchBackups()
})
</script>
