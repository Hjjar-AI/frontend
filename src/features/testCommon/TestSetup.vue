<!-- frontend/src/features/testCommon/TestSetup.vue -->
<template>
  <Layout>
    <div class="test-setup">
      <BaseCard>
        <div class="test-setup__header">
          <h2>{{ setupTitle }}</h2>
          <p class="text-muted test-setup__description">
            {{ setupDescription }}
          </p>
        </div>

        <div v-if="hasSavedProgress" class="resume-box">
          <BaseButton @click="$emit('resume')">{{ safeT('tests.resume') }}</BaseButton>
          <BaseButton variant="danger" @click="$emit('discard')">
            {{ safeT('tests.discard') }}
          </BaseButton>
        </div>

        <UnifiedTestSetup
          :initial-mode="mode"
          :initial-use-bookmarks="initialUseBookmarks"
          :max-available="maxAvailable"
          :loading="loading"
          @max-update="$emit('max-update', $event)"
          @start="$emit('start', $event)"
          @update:mode="$emit('update:mode', $event)"
        />
      </BaseCard>
    </div>
  </Layout>
</template>

<script setup>
import { computed } from 'vue'
import Layout from '@/components/common/Layout.vue'
import UnifiedTestSetup from './UnifiedTestSetup.vue'
import { useSafeI18n } from '@/composables/useSafeI18n'

const props = defineProps({
  mode: { type: String, required: true },
  hasSavedProgress: Boolean,
  loading: { type: Boolean, default: false },
  maxAvailable: Number,
  initialUseBookmarks: Boolean,
})

defineEmits(['start', 'resume', 'discard', 'max-update', 'update:mode'])

// ── Safe i18n ─────────────────────────────────────────────────────
//
// Wraps vue-i18n's `t()` so an unescaped reserved character (`@`,
// `|`, `{`, `}`) in a catalog value degrades to a visible key
// placeholder instead of throwing and blanking the page. See
// `useSafeI18n` for the full rationale.
//
// The local alias `safeT` preserves the name used throughout this
// template and script so the migration is a drop-in replacement
// rather than a rename that has to be threaded through every call
// site.
const { t: safeT } = useSafeI18n('TestSetup')

// The setup page's header. Keys are resolved directly rather than
// through `MODES[mode].titleKey`, because `MODES` no longer carries
// per-mode title/description keys (see the trimmed MODES comment in
// modes.js). A single title/description pair serves both modes; the
// mode itself is chosen inside UnifiedTestSetup.

const setupTitle = computed(() => safeT('tests.setupTitle'))
const setupDescription = computed(() => safeT('tests.setupDesc'))
</script>
