<!-- frontend/src/features/auth/views/Login.vue -->
<template>
  <div class="login-page">
    <BaseCard class="login-card">
      <div class="login-card__header">
        <div class="icon-hero"><i class="bi bi-book-half"></i></div>
        <h1 class="login-card__title">{{ t('app.name') }}</h1>
        <p class="login-card__subtitle">{{ t('auth.loginTitle') }}</p>
      </div>

      <AlertBox
        v-if="showInsecureWarning"
        variant="warning"
        :message="t('auth.insecureWarning')"
      />

      <Transition name="success-fade">
        <div v-if="loginSuccess" class="login-success">
          <i class="bi bi-check-circle-fill success-icon"></i>
          <p>{{ t('auth.loginSuccess') }}</p>
        </div>
      </Transition>

      <form v-if="!loginSuccess" @submit.prevent="submitWithGuard" class="login-form">
        <BaseInput
          v-model="username"
          :label="t('auth.username')"
          type="text"
          :placeholder="t('auth.usernamePlaceholder')"
          :error="errors.username"
          required
          autocomplete="username"
          @blur="touch('username')"
          @input="handleFieldInput('username')"
        />
        <BaseInput
          v-model="password"
          :label="t('auth.password')"
          type="password"
          :placeholder="t('auth.passwordPlaceholder')"
          :error="errors.password"
          required
          autocomplete="current-password"
          @blur="touch('password')"
          @input="handleFieldInput('password')"
        />
        <BaseButton
          type="submit"
          variant="primary"
          :loading="authStore.isLoading || isSubmitting"
          class="login-form__submit"
        >
          <i class="bi bi-box-arrow-in-right"></i> {{ t('auth.loginButton') }}
        </BaseButton>
      </form>

      <AlertBox
        v-if="authStore.error && !loginSuccess"
        variant="danger"
        :message="authStore.error"
      />

      <div class="login-disclaimer">
        <p>
          <i class="bi bi-info-circle"></i>
          {{ t('auth.disclaimer') }}
        </p>
        <p>
          {{ t('auth.agreePrivacy') }}
          <router-link to="/privacy">{{ t('auth.privacyLink') }}</router-link>.
        </p>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import '@/assets/auth.css'
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSubmitGuard } from '@/composables/useSubmitGuard'
import { useFormValidation } from '@/composables/useFormValidation'
import { validateUsername, validateLoginPassword } from '@/utils/validators'
import BaseInput from '@/components/base/BaseInput.vue'
import AlertBox from '@/components/common/AlertBox.vue'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isSubmitting, guard } = useSubmitGuard()

const username = ref('')
const password = ref('')
const loginSuccess = ref(false)
let successTimer = null

const { errors, touch, revalidate, validateAll } = useFormValidation({
  username: () =>
    validateUsername(username.value).valid ? '' : t('validation.usernameMin'),
  password: () =>
    validateLoginPassword(password.value).valid ? '' : t('validation.passwordRequired'),
})

function safeRedirect(raw) {
  if (typeof raw !== 'string') return '/'
  if (!raw.startsWith('/')) return '/'
  if (raw.startsWith('//')) return '/'
  if (raw.startsWith('/\\')) return '/'
  return raw
}

const showInsecureWarning = computed(() => {
  if (typeof window === 'undefined') return false
  if (window.location.protocol !== 'http:') return false
  const host = window.location.hostname
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]'
  ) {
    return false
  }
  return true
})

function clearAuthError() {
  if (authStore.error) authStore.error = null
}

function handleFieldInput(name) {
  clearAuthError()
  revalidate(name)
}

async function handleLogin() {
  if (!validateAll()) return
  const success = await authStore.login(username.value, password.value)
  if (success) {
    loginSuccess.value = true
    const target = safeRedirect(route.query.redirect)
    successTimer = setTimeout(() => {
      router.push(target)
    }, 800)
  }
}

function submitWithGuard() {
  guard(handleLogin)
}

onBeforeUnmount(() => {
  if (successTimer) {
    clearTimeout(successTimer)
    successTimer = null
  }
})
</script>
