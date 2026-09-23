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
          <BaseCard>
            <h4 class="card-title">
              <i class="card-title__icon bi bi-funnel"></i>
              {{ t('admin.database.filtersTitle') }}
            </h4>
            <p class="text-muted state-export-card__description">
              {{ t('admin.database.filtersSharedHint') }}
            </p>
            <ExportFilters v-model="exportFilters" />
          </BaseCard>

          <BaseCard class="state-export-card">
            <h4 class="card-title">
              <i class="card-title__icon bi bi-box-seam"></i>
              {{ t('admin.database.exportStateTitle') }}
            </h4>
            <p class="text-muted state-export-card__description">
              {{ t('admin.database.exportStateDesc') }}
            </p>
            <div class="export-buttons">
              <BaseButton variant="primary" @click="exportState(true, 'xlsx')">
                <i class="bi bi-file-earmark-spreadsheet"></i>
                {{ t('admin.database.exportStateExcel') }}
              </BaseButton>
              <BaseButton variant="secondary" @click="exportState(true, 'json')">
                <i class="bi bi-images"></i>
                {{ t('admin.database.exportStateWithImages') }}
              </BaseButton>
              <BaseButton variant="secondary" @click="exportState(false, 'json')">
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

            <p class="text-muted state-export-card__description">
              {{ t('admin.database.editableExportDesc') }}
            </p>

            <ExportButtons
              :url-builder="buildExportUrl"
              :filter-params="exportFilterParams"
              :pdf-options="pdfOptions"
              :pdf-request="requestPdfExport"
            />
          </BaseCard>

          <BaseCard>
            <h4 class="card-title">
              <i class="card-title__icon bi bi-life-preserver"></i>
              {{ t('admin.database.backupTitle') }}
            </h4>
            <p class="text-muted state-export-card__description">
              {{ t('admin.database.backupDesc') }}
            </p>
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

          <BaseCard class="quality-card">
            <h4 class="card-title">
              <i class="card-title__icon bi bi-clipboard-check"></i>
              {{ t('admin.database.qualityTitle') }}
            </h4>
            <p class="text-muted state-export-card__description">
              {{ t('admin.database.qualityDesc') }}
            </p>
            <div class="d-flex gap-1 flex-wrap mb-2">
              <BaseButton
                variant="secondary"
                :loading="qualityLoading"
                @click="loadQualityReport"
              >
                <i class="bi bi-search"></i> {{ t('admin.database.qualityScan') }}
              </BaseButton>
              <BaseButton
                variant="warning"
                :disabled="!qualityReport?.summary?.questions_with_issues"
                :loading="qualityFlagging"
                @click="flagQualityIssues"
              >
                <i class="bi bi-flag"></i> {{ t('admin.database.qualityCreateFlags') }}
              </BaseButton>
            </div>

            <div v-if="qualityReport" class="quality-report">
              <p class="quality-report__summary">
                {{
                  t('admin.database.qualitySummary', {
                    scanned: qualityReport.summary?.questions_scanned || 0,
                    affected: qualityReport.summary?.questions_with_issues || 0,
                  })
                }}
              </p>
              <div class="quality-report__counts">
                <span v-for="entry in qualityIssueCounts" :key="entry.code" class="badge">
                  {{ qualityIssueLabel(entry.code) }}: {{ entry.count }}
                </span>
              </div>
              <div v-if="qualityReport.items?.length" class="quality-report__list">
                <article
                  v-for="item in qualityReport.items.slice(0, 50)"
                  :key="item.uuid"
                  class="quality-report__item"
                >
                  <RouterLink :to="{ name: 'QuestionEdit', params: { id: item.id } }">
                    {{ item.question }}
                  </RouterLink>
                  <span class="text-muted">
                    {{ item.issues.map((issue) => qualityIssueLabel(issue.code)).join(', ') }}
                  </span>
                  <span v-if="item.has_open_quality_flag" class="badge badge-warning">
                    {{ t('admin.database.qualityAlreadyFlagged') }}
                  </span>
                </article>
                <p v-if="qualityReport.items.length > 50" class="text-muted">
                  {{ t('admin.database.qualityShowingFirst', { count: 50 }) }}
                </p>
              </div>
              <p v-else class="text-success">{{ t('admin.database.qualityClean') }}</p>
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
import { downloadBlob, getResponseFilename } from '@/utils/downloadFile'

const { t } = useI18n()

const adminDatabaseStore = useAdminDatabaseStore()
const { notify } = useNotify()

const dbInfo = computed(() => adminDatabaseStore.databaseInfo || {})

const deleteConfirmation = ref('')
const adminPassword = ref('')

const restoreModalOpen = ref(false)
const restoreTargetName = ref('')
const restorePassword = ref('')
const qualityLoading = ref(false)
const qualityFlagging = ref(false)
const qualityReport = computed(() => adminDatabaseStore.qualityReport)
const qualityIssueCounts = computed(() =>
  Object.entries(qualityReport.value?.summary?.issue_counts || {}).map(([code, count]) => ({
    code,
    count,
  })),
)

// ── Export filters + title ────────────────────────────────────────
//
// The panel binds to this object via v-model. The three filter
// groups are ARRAYS (difficulty, categories, tags); `search` and
// `title` are scalars. The title is a document label, not a filter,
// and is used by PDF export only. Every key is initialised so the
// template and the panel can read it without `?.` chains.
const exportFilters = ref({
  title: '',
  include_about: false,
  about_title: '',
  about_body: '',
  about_fields: [],
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

const pdfOptions = computed(() => ({
  enabled: Boolean(exportFilters.value.include_about),
  heading: exportFilters.value.about_title || '',
  body: exportFilters.value.about_body || '',
  fields: (exportFilters.value.about_fields || [])
    .map((field) => ({
      label: String(field?.label || '').trim(),
      value: String(field?.value || '').trim(),
    }))
    .filter((field) => field.label && field.value),
}))

const requestPdfExport = (options) => adminDatabaseStore.exportPdf(options)

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

async function exportState(includeImages, format = 'json') {
  notify(
    t(
      format === 'xlsx'
        ? 'admin.database.exportStateStartedExcel'
        : includeImages
          ? 'admin.database.exportStateStartedWithImages'
          : 'admin.database.exportStateStartedWithoutImages',
    ),
    'info',
  )
  try {
    const response = await adminDatabaseStore.exportState(
      includeImages,
      false,
      format,
      exportFilterParams.value,
    )
    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data], {
            type:
              format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/json',
          })
    const filename = getResponseFilename(response) || `question_bank_package.${format}`
    downloadBlob(blob, filename)
  } catch (error) {
    notify(error?.message || t('common.networkError'), 'error')
  }
}

function qualityIssueLabel(code) {
  const labels = {
    duplicate_question: t('admin.database.qualityIssue.duplicate_question'),
    duplicate_choices: t('admin.database.qualityIssue.duplicate_choices'),
    missing_explanation: t('admin.database.qualityIssue.missing_explanation'),
    missing_category: t('admin.database.qualityIssue.missing_category'),
    missing_source_document: t('admin.database.qualityIssue.missing_source_document'),
    invalid_translations: t('admin.database.qualityIssue.invalid_translations'),
    translation_choice_count_mismatch: t(
      'admin.database.qualityIssue.translation_choice_count_mismatch',
    ),
  }
  return labels[code] || code
}

async function loadQualityReport() {
  qualityLoading.value = true
  try {
    const report = await adminDatabaseStore.fetchDataQualityReport()
    if (!report) throw new Error(adminDatabaseStore.error || t('admin.database.qualityLoadFailed'))
  } catch (error) {
    notify(error?.message || t('admin.database.qualityLoadFailed'), 'error')
  } finally {
    qualityLoading.value = false
  }
}

async function flagQualityIssues() {
  qualityFlagging.value = true
  try {
    const report = await adminDatabaseStore.flagDataQualityIssues()
    if (!report) throw new Error(adminDatabaseStore.error || t('admin.database.qualityFlagFailed'))
    notify(
      t('admin.database.qualityFlagsCreated', { count: report.flags_created || 0 }),
      'success',
    )
  } catch (error) {
    notify(error?.message || t('admin.database.qualityFlagFailed'), 'error')
  } finally {
    qualityFlagging.value = false
  }
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
