<!-- frontend/src/features/legal/views/PrivacyPolicy.vue -->
<template>
  <Layout>
    <div class="privacy-page">
      <BaseCard class="privacy-header-card">
        <PageHeader :title="t('content.privacy.title')">
          <template #badges>
            <BaseBadge variant="info">
              <i class="bi bi-calendar-check"></i>
              {{ t('content.privacy.lastUpdateBadge', { date: content?.lastUpdate || '' }) }}
            </BaseBadge>
            <BaseBadge variant="success">
              <i class="bi bi-shield-check"></i>
              {{ t('content.privacy.effectiveBadge') }}
            </BaseBadge>
          </template>
        </PageHeader>

        <div v-if="!content" class="privacy-page__loading">
          <i class="bi bi-hourglass-split"></i>
          {{ loadError ? t('content.privacy.loadFailed') : t('content.privacy.loading') }}
        </div>

        <template v-else>
          <div class="policy-intro">
            <i class="bi bi-shield-lock"></i>
            <div v-html="sanitizedIntroLead" class="policy-intro-body"></div>
          </div>

          <!-- Table of Contents -->
          <div class="toc">
            <h4><i class="bi bi-list-ol"></i> {{ t('content.privacy.tocTitle') }}</h4>
            <div class="toc-grid">
              <a
                v-for="section in sanitizedSections"
                :key="section.id"
                :href="`#${section.id}`"
                class="toc-link"
              >
                <i class="bi bi-dot"></i> {{ section.num }}. {{ section.title }}
              </a>
            </div>
          </div>
        </template>
      </BaseCard>

      <!-- Sections -->
      <div
        v-for="section in sanitizedSections"
        :key="section.id"
        :id="section.id"
        class="policy-section"
      >
        <BaseCard>
          <h2 class="section-title">
            <i :class="section.icon"></i>
            <span>{{ section.num }}. {{ section.title }}</span>
          </h2>
          <div class="section-content prose" v-html="section.content"></div>
        </BaseCard>
      </div>

      <!-- Summary Card -->
      <BaseCard v-if="content" variant="success" class="summary-card">
        <div class="summary-content">
          <i class="bi bi-check-circle-fill"></i>
          <div>
            <h3>{{ t('content.privacy.summaryTitle') }}</h3>
            <ul class="summary-list">
              <li v-for="(item, i) in content.summaryItems" :key="i">
                <i class="bi bi-check2"></i> {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </BaseCard>

      <!-- Contact Section -->
      <BaseCard v-if="content" class="contact-section">
        <h2 class="section-title">
          <i class="bi bi-envelope-paper"></i>
          <span>{{ t('content.privacy.contactTitle') }}</span>
        </h2>
        <p v-html="sanitizedContactIntro"></p>
        <div class="contact-box">
          <div
            v-for="(item, i) in content.contactItems"
            :key="i"
            class="contact-item"
          >
            <i :class="item.icon"></i>
            <span v-html="sanitizeItemText(item.text)"></span>
          </div>
        </div>
      </BaseCard>

      <div v-if="content" class="policy-footer">
        <p>
          <i class="bi bi-info-circle"></i>
          {{ content.footerMain }}
        </p>
        <p class="footer-disclaimer">
          <i class="bi bi-exclamation-circle"></i>
          {{ content.footerDisclaimer }}
        </p>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import '@/assets/privacy.css'
import '@/assets/about.css'
import { computed } from 'vue'

import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'

import { useContentLoader } from '@/composables/useContentLoader'
import { createSanitizer } from '@/utils/richTextSanitizer'

const { t } = useI18n()

// ── Content loading ──────────────────────────────────────────────
//
// `useContentLoader('privacy')` owns the reactive refs, the
// monotonic token that guards against out-of-order locale switches,
// the `watch(locale, load)`, and the initial load at setup.
const { content, loadError } = useContentLoader('privacy')

const sanitizeHtml = createSanitizer('privacy')

const sanitizedIntroLead = computed(() =>
  sanitizeHtml(content.value?.introLead || '')
)

const sanitizedContactIntro = computed(() =>
  sanitizeHtml(content.value?.contactIntro || '')
)

const sanitizedSections = computed(() => {
  const sections = content.value?.sections
  if (!Array.isArray(sections)) return []
  return sections.map((s) => ({
    ...s,
    // `icon` is a Bootstrap-Icon class, bound via `:class` on an
    // `<i>` — never v-html. Only `content` is sanitized.
    content: sanitizeHtml(s.content),
  }))
})

// Contact-item text is rendered via v-html in the template because
// some items carry inline emphasis. Wrap the sanitizer for a single
// string so the template call site is uniform with the others.
function sanitizeItemText(text) {
  return sanitizeHtml(text || '')
}
</script>