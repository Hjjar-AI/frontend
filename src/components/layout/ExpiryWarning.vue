<!-- frontend/src/components/layout/ExpiryWarning.vue -->
<template>
  <!--
    The `isExpiringSoon` getter already returns false when the user
    has no `expires_at` value. Admin accounts are stored with a null
    `expires_at` (the backend explicitly omits it for the admin
    role), so the previous `&& !adminRole` guard was redundant — it
    has been removed along with the capability migration.

    The template's guard is `isExpiringSoon`, which is true only
    while 0 < days <= 7. Expired users are logged out by the router
    guard before this component renders, so an "expired" branch is
    dead code and has been removed from `expiryMessage`.
  -->
  <div v-if="authStore.isExpiringSoon" class="expiry-warning">
    <i class="bi bi-exclamation-triangle"></i>
    {{ expiryMessage }}
    <a :href="contactHref" class="contact-link">
      <i class="bi bi-envelope"></i> {{ t('profile.contactAdminButton') }}
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { formatLongDate } from '@/utils/formatters'


const { t } = useI18n()

const authStore = useAuthStore()

const CONTACT_CONFIG = {
  type: 'mailto',
  email: 'admin@hospital.org',
  url: '',
}

const contactHref = computed(() => {
  if (CONTACT_CONFIG.type === 'url' && CONTACT_CONFIG.url) {
    return CONTACT_CONFIG.url
  }
  const subject = encodeURIComponent(t('profile.contactEmailSubject'))
  const body = encodeURIComponent(t('profile.contactEmailBody'))
  return `mailto:${CONTACT_CONFIG.email}?subject=${subject}&body=${body}`
})

// The parent `v-if` already guarantees `authStore.expiresAt` is a
// valid date in the "expiring soon" window (0 < days <= 7). No
// other branch is reachable, so this is a straight format call.
const expiryMessage = computed(() =>
  t('profile.expiryMessage', { date: formatLongDate(authStore.expiresAt) })
)
</script>