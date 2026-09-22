<!-- frontend/src/features/auth/views/ChangePassword.vue -->
<template>
  <div class="change-password-page">
    <BaseCard class="change-password-card">
      <div class="change-password-card__header">
        <div class="icon-hero"><i class="bi bi-key"></i></div>
        <h2>{{ t('auth.changePassword') }}</h2>
        <p class="text-muted">{{ t('auth.changePasswordSubtitle') }}</p>
      </div>

      <form @submit.prevent="handleChange" class="change-password-form">
        <FormGrid>
          <BaseInput
            v-model="currentPassword"
            :label="t('auth.currentPassword')"
            type="password"
            :placeholder="t('auth.currentPassword')"
            :error="errors.current"
            required
            autocomplete="current-password"
          />
          <BaseInput
            v-model="newPassword"
            :label="t('auth.newPassword')"
            type="password"
            :placeholder="t('auth.newPassword')"
            :error="errors.newPassword"
            :hint="t('auth.changePasswordHint')"
            required
            autocomplete="new-password"
            @input="validateNewPassword"
          />
          <BaseInput
            v-model="confirmPassword"
            :label="t('auth.confirmPassword')"
            type="password"
            :placeholder="t('auth.confirmPassword')"
            :error="errors.confirm"
            required
            autocomplete="new-password"
            @input="validateConfirm"
          />
        </FormGrid>

        <div class="change-password-form__actions">
          <BaseButton type="submit" variant="primary" :loading="authStore.isLoading">
            <i class="bi bi-check-lg"></i> {{ t('common.save') }}
          </BaseButton>
          <BaseButton type="button" variant="secondary" @click="router.push('/')">
            <i class="bi bi-x-lg"></i> {{ t('common.cancel') }}
          </BaseButton>
        </div>
      </form>

      <AlertBox v-if="authStore.error" variant="danger" :message="authStore.error" />
    </BaseCard>
  </div>
</template>

<script setup>
import '@/assets/auth.css'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { validatePassword, MIN_PASSWORD_LENGTH } from '@/utils/validators'
import BaseInput from '@/components/base/BaseInput.vue'
import AlertBox from '@/components/common/AlertBox.vue'
import FormGrid from '@/components/common/FormGrid.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errors = reactive({ current: '', newPassword: '', confirm: '' })

function validateNewPassword() {
  const result = validatePassword(newPassword.value)
  errors.newPassword = result.valid
    ? ''
    : t('validation.passwordMin', { min: MIN_PASSWORD_LENGTH })
  return result.valid
}

function validateConfirm() {
  if (confirmPassword.value !== newPassword.value) {
    errors.confirm = t('auth.passwordMismatch')
    return false
  }
  errors.confirm = ''
  return true
}

async function handleChange() {
  const validNew = validateNewPassword()
  const validConfirm = validateConfirm()
  if (!validNew || !validConfirm) return
  const success = await authStore.changePassword(currentPassword.value, newPassword.value)
  if (success) router.push('/')
}
</script>