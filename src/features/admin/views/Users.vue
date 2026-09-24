<!-- frontend/src/features/admin/views/Users.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('admin.users.title')"
      icon="bi bi-people-fill"
      page-class="admin-users"
    >
        <template #actions>
          <BaseButton variant="primary" @click="userFormModalRef?.open()">
            <i class="bi bi-person-plus"></i> {{ t('admin.users.addButton') }}
          </BaseButton>
        </template>
      <ErrorBanner
        :error="userStore.error"
        :retry="userStore.error ? true : false"
        @dismiss="userStore.error = null"
        @retry="fetchUsers"
      />

      <BulkActions
        v-if="selectedIds.length > 0"
        :count="selectedIds.length"
        :item-label="t('admin.users.itemLabel')"
        :verify-label="t('admin.users.bulkActivate')"
        :unverify-label="t('admin.users.bulkDeactivate')"
        :clear-label="t('admin.users.bulkClear')"
        @verify="bulkToggle(true)"
        @unverify="bulkToggle(false)"
        @clear="clearSelection"
      />

      <BaseListContainer
        :loading="userStore.isLoading"
        :items="userStore.items"
        :empty-title="t('admin.users.empty')"
        empty-icon="bi-people-fill"
      >
        <template #default="{ items }">
          <div class="users-grid">
            <BaseCard
              v-for="user in items"
              :key="user.id"
              class="user-card"
              :class="{
                'user-card--selected': isSelected(user.id),
                'user-card--inactive': !user.is_active
              }"
              :variant="user.is_active ? 'default' : 'secondary'"
            >
              <div class="user-card__select">
                <BaseCheckbox
                  :model-value="isSelected(user.id)"
                  @update:model-value="toggleSelection(user.id)"
                />
              </div>
              <div class="user-card__header">
                <div
                  class="user-card__avatar"
                  :class="[
                    avatarToneClass(user.id ?? user.username),
                    { 'user-card__avatar--inactive': !user.is_active },
                  ]"
                >
                  {{ (user.full_name || user.username || '?')[0] }}
                </div>
                <div class="user-card__identity">
                  <h4 class="user-card__name">{{ user.full_name || user.username }}</h4>
                  <p class="user-card__username">@{{ user.username }}</p>
                </div>
                <div class="user-card__badges">
                  <BaseBadge :variant="roleBadgeVariant(user.role)">
                    {{ roleLabel(user.role) }}
                  </BaseBadge>
                  <BaseBadge :variant="user.is_active ? 'success' : 'secondary'">
                    {{ user.is_active ? t('admin.users.statusActive') : t('admin.users.statusInactive') }}
                  </BaseBadge>
                </div>
              </div>
              <div class="user-card__stats">
                <div class="user-card__stat">
                  <i class="bi bi-question-circle"></i>
                  <span>{{ t('admin.users.statQuestions', { count: user.questions_count || 0 }) }}</span>
                </div>
                <div class="user-card__stat">
                  <i class="bi bi-trophy"></i>
                  <span v-if="user.latest_exam_accuracy != null">{{ user.latest_exam_accuracy }}%</span>
                  <span v-else class="text-muted">—</span>
                </div>
                <div class="user-card__stat">
                  <i class="bi bi-clock"></i>
                  <span v-if="user.last_login">
                    {{ formatCellValue(user.last_login, { nullValue: t('admin.users.statNeverLoggedIn'), type: 'datetime' }) }}
                  </span>
                  <span v-else class="text-muted">{{ t('admin.users.statNeverLoggedIn') }}</span>
                </div>
                <div class="user-card__stat">
                  <i class="bi bi-calendar-check"></i>
                  <span
                    v-if="getExpiryDays(user) != null"
                    :class="getExpiryDays(user) <= 0 ? 'text-danger' : ''"
                  >
                    {{ getExpiryDays(user) > 0
                      ? t('admin.users.statDaysLeft', { days: getExpiryDays(user) })
                      : t('admin.users.statExpired') }}
                  </span>
                  <span v-else class="text-muted">{{ t('admin.users.statUnlimited') }}</span>
                </div>
              </div>
              <div class="user-card__actions">
                <BaseIconButton
                  icon="bi bi-pencil"
                  :label="t('common.edit')"
                  @click="userFormModalRef?.open(user)"
                />
                <BaseIconButton
                  v-if="authStore.can('admin.permissions')"
                  icon="bi bi-shield-check"
                  :label="t('admin.users.permissionsButton')"
                  @click="router.push({ path: '/admin/permissions', query: { user: user.id } })"
                />
                <BaseIconButton
                  icon="bi bi-key"
                  :label="t('admin.users.resetTitle')"
                  @click="openResetPassword(user)"
                />
                <BaseIconButton
                  :icon="user.is_active ? 'bi bi-toggle-off' : 'bi bi-toggle-on'"
                  :label="user.is_active ? t('admin.users.bulkDeactivate') : t('admin.users.bulkActivate')"
                  @click="confirmToggle(user)"
                />
                <BaseIconButton
                  icon="bi bi-trash"
                  variant="danger"
                  :label="t('common.delete')"
                  @click="confirmDelete(user)"
                />
              </div>
            </BaseCard>
          </div>
        </template>
      </BaseListContainer>

      <Pagination
        v-if="pagination.totalPages.value > 1"
        :current="pagination.page.value"
        :total-pages="pagination.totalPages.value"
        @page-change="pagination.goToPage"
      />

      <UserFormModal ref="userFormModalRef" />

      <BaseModal
        :is-open="resetModalOpen"
        :title="t('admin.users.resetTitle')"
        @update:is-open="closeResetModal"
      >
        <form v-if="!generatedPassword" @submit.prevent="submitResetPassword">
          <BaseInput
            v-model="resetForm.adminPassword"
            :label="t('admin.users.resetAdminPassword')"
            type="password"
            required
            autocomplete="current-password"
          />
          <BaseInput
            v-model="resetForm.newPassword"
            :label="t('admin.users.resetNewPassword')"
            type="password"
            :minlength="8"
            :placeholder="t('admin.users.resetNewPasswordPlaceholder')"
            autocomplete="new-password"
          />
          <div class="form-actions">
            <BaseButton type="submit" variant="primary" :loading="userStore.isLoading">
              {{ t('admin.users.resetSubmit') }}
            </BaseButton>
            <BaseButton type="button" variant="secondary" @click="closeResetModal">
              {{ t('common.cancel') }}
            </BaseButton>
          </div>
        </form>
        <div v-else class="temp-password-display">
          <p class="text-muted">{{ t('admin.users.resetTempPasswordHint') }}</p>
          <BaseInput
            :model-value="generatedPassword"
            :label="t('admin.users.resetTempPasswordLabel')"
            readonly
          />
          <div class="form-actions">
            <BaseButton variant="primary" @click="closeResetModal">
              {{ t('admin.users.resetDone') }}
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </PageShell>
  </Layout>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import Pagination from '@/components/base/BasePagination.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import BulkActions from '@/components/common/BulkActions.vue'
import UserFormModal from '../components/UserFormModal.vue'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotify } from '@/composables/useNotify'
import { useDialog } from '@/composables/useDialog'
import { usePagination } from '@/composables/usePagination'
import { useSelection } from '@/composables/useSelection'
import { useConfigStore } from '@/stores/configStore'
import { roleLabelFor, roleBadgeVariantFor } from '@/utils/roleDisplay'
import { formatCellValue } from '@/utils/formatCellValue'
import { daysUntilExpiry } from '@/utils/formatters'
import { avatarToneClass } from '@/utils/avatar'

const { t } = useI18n()

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()
const { notify } = useNotify()

const { confirm, prompt: promptDialog } = useDialog()
const { selectedIds, toggle: toggleSelection, clear: clearSelection, isSelected } = useSelection()
const userFormModalRef = ref(null)
const configStore = useConfigStore()

// `fetchUsers` fills `pagination.total` (the item count, for the
// "showing N of M" line) and `pagination.totalPages` (the page count,
// for the Pagination control) — both from the server's own fields.
// Before this revision, `totalPages` was a computed derived from
// `total / perPage`, which duplicated arithmetic the server had
// already done. See `usePagination.js` for the module comment.
const fetchUsers = async () => {
  const result = await userStore.fetchList({
    page: pagination.page.value,
    per_page: pagination.perPage.value,
  })
  if (result === null) return null
  if (Number.isFinite(userStore.pagination.total)) {
    pagination.total.value = userStore.pagination.total
  }
  if (Number.isFinite(userStore.pagination.total_pages)) {
    pagination.totalPages.value = userStore.pagination.total_pages
  }
  return result
}
const pagination = usePagination(fetchUsers, configStore.itemsPerPage || 20)

const resetModalOpen = ref(false)
const resetTargetUser = ref(null)
const resetForm = reactive({ adminPassword: '', newPassword: '' })
const generatedPassword = ref('')

function roleLabel(role) {
  return roleLabelFor(role, t)
}

function roleBadgeVariant(role) {
  return roleBadgeVariantFor(role)
}

function getExpiryDays(user) {
  const caps = user.capabilities
  if (Array.isArray(caps) && caps.includes('system.bypass_expiry')) {
    return null
  }
  return daysUntilExpiry(user.expires_at)
}

function openResetPassword(user) {
  resetTargetUser.value = user
  resetForm.adminPassword = ''
  resetForm.newPassword = ''
  generatedPassword.value = ''
  resetModalOpen.value = true
}

function closeResetModal() {
  resetModalOpen.value = false
  generatedPassword.value = ''
}

async function submitResetPassword() {
  if (!resetForm.adminPassword) {
    notify(t('admin.users.resetRequired'), 'error')
    return
  }
  const newPass = resetForm.newPassword || undefined
  const result = await userStore.resetPassword(
    resetTargetUser.value.id,
    resetForm.adminPassword,
    newPass,
  )
  if (!result) return
  if (result.temp_password) {
    generatedPassword.value = result.temp_password
    return
  }
  notify(t('admin.users.resetSuccess'), 'success')
  closeResetModal()
}

async function confirmToggle(user) {
  await userStore.confirmToggle(user)
}

async function confirmDelete(user) {
  await userStore.confirmDelete(user)
}

async function bulkToggle(active) {
  if (selectedIds.value.length === 0) return
  const action = active ? t('admin.users.bulkActivate') : t('admin.users.bulkDeactivate')
  const message = t('admin.users.bulkConfirm', { action, count: selectedIds.value.length })
  const ok = await confirm(message)
  if (!ok) return

  const adminPassword = await promptDialog(
    t('admin.users.formAdminPasswordPlaceholder'),
    ''
  )
  if (!adminPassword) return

  let successCount = 0
  let failCount = 0
  for (const id of selectedIds.value) {
    const result = await userStore.toggleActive(id, adminPassword, { silent: true })
    if (result) successCount++
    else failCount++
  }
  if (failCount > 0) {
    notify(
      t('admin.users.bulkSummaryPartial', {
        action,
        success: successCount,
        fail: failCount,
      }),
      'warning',
    )
  } else {
    notify(t('admin.users.bulkSummaryOk', { action, count: successCount }), 'success')
  }
  clearSelection()
}

onMounted(fetchUsers)
</script>
