<!-- frontend/src/features/auth/views/ChangePassword.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('auth.changePassword')"
      :subtitle="t('auth.changePasswordSubtitle')"
      icon="bi bi-key"
      size="form"
      page-class="change-password-page"
      :error="authStore.error || ''"
      @dismiss-feedback="authStore.error = null"
    >
    <BaseCard class="change-password-card">
      <div class="change-password-card__header">
        <div class="icon-hero"><i class="bi bi-key"></i></div>
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
            @blur="touch('current')"
            @input="revalidate('current')"
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
            @blur="touch('newPassword')"
            @input="handleNewPasswordInput"
          />
          <BaseInput
            v-model="confirmPassword"
            :label="t('auth.confirmPassword')"
            type="password"
            :placeholder="t('auth.confirmPassword')"
            :error="errors.confirm"
            required
            autocomplete="new-password"
            @blur="touch('confirm')"
            @input="revalidate('confirm')"
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
    </BaseCard>
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/auth.css'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useFormValidation } from '@/composables/useFormValidation'
import { validatePassword, MIN_PASSWORD_LENGTH } from '@/utils/validators'
import BaseInput from '@/components/base/BaseInput.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const { errors, touch, revalidate, validateAll } = useFormValidation({
  current: () => currentPassword.value ? '' : t('validation.passwordRequired'),
  newPassword: () =>
    validatePassword(newPassword.value).valid
      ? ''
      : t('validation.passwordMin', { min: MIN_PASSWORD_LENGTH }),
  confirm: () =>
    confirmPassword.value === newPassword.value ? '' : t('auth.passwordMismatch'),
})

function handleNewPasswordInput() {
  revalidate('newPassword')
  revalidate('confirm')
}

async function handleChange() {
  if (!validateAll()) return
  const success = await authStore.changePassword(currentPassword.value, newPassword.value)
  if (success) router.push('/')
}
</script>
