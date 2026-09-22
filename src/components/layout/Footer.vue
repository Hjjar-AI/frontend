<!-- frontend/src/components/layout/Footer.vue -->
<template>
  <footer class="footer no-print">
    <div class="footer__shell">
      <div class="footer__brand">
        <i class="bi bi-journal-medical footer__brand-icon"></i>
        <span class="footer__brand-name">{{ t('app.name') }}</span>
        <span
          class="footer__version"
          :title="t('app.version', { version: APP_VERSION })"
        >v{{ APP_VERSION }}</span>
      </div>

      <span class="footer__divider"></span>

      <p class="footer__credit">
        <strong>{{ APP_AUTHOR }}</strong> — {{ APP_HOSPITAL }}
      </p>

      <span class="footer__divider"></span>

      <nav class="footer__links" :aria-label="t('a11y.footerNav')">
        <router-link to="/about">{{ t('nav.about') }}</router-link>
        <router-link to="/privacy">{{ t('nav.privacy') }}</router-link>
        <router-link to="/manual">{{ t('nav.manual') }}</router-link>
      </nav>
    </div>
  </footer>
</template>

<script setup>
import { APP_VERSION } from '@/utils/constants'

const { t } = useI18n()

// APP_AUTHOR and APP_HOSPITAL are proper nouns — do not translate.
// They are declared here rather than in constants.js to keep the
// localisation surface obvious.
const APP_AUTHOR = 'الطبيب محمد علي حجار'
const APP_HOSPITAL = 'مستشفى ابن رشد'
</script>