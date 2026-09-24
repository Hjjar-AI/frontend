<!-- frontend/src/features/manual/views/Manual.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('content.manual.title')"
      icon="bi bi-book"
      size="base"
      page-class="manual-page"
    >
      <template #badges>
        <BaseBadge variant="info">
          {{ t('content.manual.badgeSections', { count: sanitizedSections.length }) }}
        </BaseBadge>
        <BaseBadge variant="secondary">
          {{ t('content.manual.badgeVersion', { version: APP_VERSION }) }}
        </BaseBadge>
      </template>

      <BaseCard class="manual-page__card">
        <div v-if="!content" class="manual-page__loading">
          <i class="bi bi-hourglass-split"></i>
          {{ loadError ? t('content.manual.loadFailed') : t('content.manual.loading') }}
        </div>

        <template v-else>
          <div class="manual-page__lead" v-html="sanitizedLead"></div>

          <!-- Table of Contents -->
          <div class="manual-page__toc">
            <div class="manual-page__toc-header">
              <i class="bi bi-list-ol"></i>
              <h4>{{ t('content.manual.tocTitle') }}</h4>
            </div>
            <div class="manual-page__toc-grid">
              <ul v-for="(group, gi) in tocGroups" :key="gi" class="manual-page__toc-group">
                <li v-for="s in group" :key="s.id" class="manual-page__toc-item">
                  <a :href="`#${s.id}`" class="manual-page__toc-link">
                    <span class="manual-page__toc-num">{{ s.num }}</span>
                    <span class="manual-page__toc-label">{{ s.title }}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <!-- Sections -->
          <div
            v-for="s in sanitizedSections"
            :key="s.id"
            :id="s.id"
            class="manual-page__section"
          >
            <div class="manual-page__section-header">
              <span class="manual-page__section-icon"><i :class="s.icon"></i></span>
              <h2 class="manual-page__section-title">{{ s.num }}. {{ s.title }}</h2>
            </div>
            <div class="manual-page__section-body prose" v-html="s.content"></div>
          </div>

          <div class="manual-page__footer">
            <i class="bi bi-check-circle-fill"></i>
            <span v-html="sanitizedFooterNote"></span>
          </div>
        </template>
      </BaseCard>
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/privacy.css'
import { computed } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { APP_VERSION } from '@/utils/constants'

import { useContentLoader } from '@/composables/useContentLoader'
import { createSanitizer } from '@/utils/richTextSanitizer'

const { t } = useI18n()

// ── Content loading ──────────────────────────────────────────────
//
// `useContentLoader('manual')` owns the reactive refs, the
// monotonic token that guards against out-of-order locale switches,
// the `watch(locale, load)`, and the initial load at setup. See the
// composable's header for the full contract.
const { content, loadError } = useContentLoader('manual')

const sanitizeHtml = createSanitizer('manual')

const sanitizedLead = computed(() => sanitizeHtml(content.value?.lead || ''))

const sanitizedFooterNote = computed(() =>
  sanitizeHtml(content.value?.footerNote || '')
)

const sanitizedSections = computed(() => {
  const sections = content.value?.sections
  if (!Array.isArray(sections)) return []
  return sections.map((s) => ({
    ...s,
    // `icon` is a Bootstrap-Icon class, not sanitized content — it
    // is bound via `:class` on an `<i>` and never through v-html.
    // `content` is the sanitized payload.
    content: sanitizeHtml(s.content),
  }))
})

// The TOC is chunked into fixed-size columns for layout stability.
// Chunk size matches the original page's `groupSize = 7`; adjust
// here if the grid design changes. Sourced from the sanitized list
// so the TOC order matches the rendered section order by
// construction.
const TOC_GROUP_SIZE = 7
const tocGroups = computed(() => {
  if (!sanitizedSections.value.length) return []
  const groups = []
  const all = sanitizedSections.value
  for (let i = 0; i < all.length; i += TOC_GROUP_SIZE) {
    groups.push(all.slice(i, i + TOC_GROUP_SIZE))
  }
  return groups
})
</script>
