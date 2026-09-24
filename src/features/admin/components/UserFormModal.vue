<!-- frontend/src/features/admin/components/UserFormModal.vue -->
<template>
  <BaseModal
    :is-open="isOpen"
    :title="editMode ? t('admin.users.editTitle') : t('admin.users.createTitle')"
    size="md"
    @update:is-open="close"
  >
    <form @submit.prevent="handleSubmit" class="user-form">
      <FormGrid>
        <BaseInput
          v-model="form.username"
          :label="t('admin.users.formUsername')"
          :disabled="editMode"
          :error="errors.username"
          required
          @blur="touch('username')"
          @input="revalidate('username')"
        />
        <BaseInput v-model="form.full_name" :label="t('admin.users.formFullName')" />
        <BaseInput
          v-model="form.password"
          type="password"
          :label="editMode ? t('admin.users.formPasswordEdit') : t('admin.users.formPassword')"
          :required="!editMode"
          :minlength="8"
          autocomplete="new-password"
          :error="errors.password"
          @blur="touch('password')"
          @input="revalidate('password')"
        />
        <BaseSelect
          v-model="form.role"
          :label="t('admin.users.formRole')"
          :options="roleOptions"
        />
        <BaseInput
          v-model.number="form.expiry_days"
          type="number"
          :label="t('admin.users.formExpiryDays')"
          :hint="t('admin.users.formExpiryHint')"
          min="0"
          inputmode="numeric"
        />
        <BaseCheckbox v-model="form.auto_renew" :label="t('admin.users.formAutoRenew')" />
        <BaseCheckbox v-model="form.is_active" :label="t('admin.users.formIsActive')" />

        <BaseInput
          v-model="form.admin_password"
          type="password"
          :label="t('admin.users.formAdminPassword')"
          :placeholder="t('admin.users.formAdminPasswordPlaceholder')"
          required
          autocomplete="current-password"
          :error="errors.adminPassword"
          @blur="touch('adminPassword')"
          @input="revalidate('adminPassword')"
        />
      </FormGrid>

      <div class="form-actions">
        <BaseButton type="button" variant="secondary" @click="close">
          {{ t('common.cancel') }}
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :loading="userStore.isLoading"
        >
          {{ editMode ? t('admin.users.update') : t('admin.users.create') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import { useUserStore } from '@/stores/userStore'
import { useAdminSettingsStore } from '@/stores/adminSettingsStore'
import { ROLE_LABEL_KEYS, ROLES } from '@/utils/constants'
import { daysUntilExpiry } from '@/utils/formatters'
import { useFormValidation } from '@/composables/useFormValidation'

const { t } = useI18n()

const userStore = useUserStore()
const adminSettingsStore = useAdminSettingsStore()

const isOpen = ref(false)
const editMode = ref(false)
const editingId = ref(null)

// Role options are built from the ROLES constant, not hardcoded.
// Order here is the display order in the picker: most-privileged
// first, then descending. Adding a role to constants.js is enough
// to make it appear here.
const ROLE_DISPLAY_ORDER = [
  ROLES.ADMIN,
  ROLES.MODERATOR,
  ROLES.MEMBER,
]

const roleOptions = computed(() =>
  ROLE_DISPLAY_ORDER.map((role) => ({
    value: role,
    label: t(ROLE_LABEL_KEYS[role]),
  }))
)

const form = reactive({
  username: '',
  full_name: '',
  password: '',
  role: ROLES.MEMBER,
  expiry_days: 60,
  auto_renew: false,
  is_active: true,
  admin_password: '',
})
const { errors, touch, revalidate, validateAll, resetValidation } = useFormValidation({
  username: () => form.username.trim() ? '' : t('validation.required'),
  password: () => editMode.value || form.password ? '' : t('validation.required'),
  adminPassword: () => form.admin_password ? '' : t('admin.users.formAdminPasswordRequired'),
})

onMounted(async () => {
  await adminSettingsStore.fetchSettings()
})

function parseIntOr(raw, fallback) {
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? fallback : n
}

function applyDefaults() {
  const settings = adminSettingsStore.settings || {}
  const defaultExpiry = parseIntOr(settings.default_expiry_days, 60)
  const defaultRenewal = parseIntOr(settings.default_renewal_days, 0)
  form.expiry_days = defaultExpiry
  form.auto_renew = defaultRenewal > 0
}

function open(user = null) {
  resetValidation()
  form.admin_password = ''

  if (user) {
    editMode.value = true
    editingId.value = user.id
    form.username = user.username
    form.full_name = user.full_name || ''
    form.password = ''
    form.role = user.role
    const raw = user.expires_at ? daysUntilExpiry(user.expires_at) : 0
    form.expiry_days = Math.max(0, raw || 0)
    form.auto_renew = user.auto_renew_days > 0
    form.is_active = user.is_active
  } else {
    editMode.value = false
    editingId.value = null
    form.username = ''
    form.full_name = ''
    form.password = ''
    form.role = ROLES.MEMBER
    applyDefaults()
    form.is_active = true
  }
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

async function handleSubmit() {
  if (!validateAll()) return

  const data = {
    username: form.username,
    full_name: form.full_name,
    role: form.role,
    expiry_days: form.expiry_days,
    auto_renew_days: form.auto_renew
      ? (parseInt(adminSettingsStore.settings?.default_renewal_days) || 30)
      : 0,
    is_active: form.is_active,
    admin_password: form.admin_password,
  }

  let result
  if (editMode.value) {
    if (form.password) data.new_password = form.password
    result = await userStore.update(editingId.value, data)
  } else {
    data.password = form.password
    result = await userStore.create(data)
  }
  if (result) close()
}

defineExpose({ open, close })
</script>
