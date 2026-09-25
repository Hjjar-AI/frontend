<!-- frontend/src/features/preferences/views/Preferences.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('preferences.title')"
      icon="bi bi-sliders"
      :subtitle="t('preferences.subtitle')"
      size="narrow"
      page-class="preferences-page"
    >
      <BaseCard>
        <form @submit.prevent class="preferences-form">
          <FormGrid>
     
            <BaseSelect
              :model-value="prefs.defaultPerPage"
              @update:model-value="prefs.update('defaultPerPage', $event)"
              :label="t('preferences.defaultPerPage')"
              :options="perPageOptions"
            />
            <BaseSelect
              :model-value="prefs.defaultDifficulty"
              @update:model-value="prefs.update('defaultDifficulty', $event)"
              :label="t('preferences.defaultDifficulty')"
              :options="difficultyOptions"
            />
            <BaseSelect
              :model-value="prefs.density"
              @update:model-value="prefs.update('density', $event)"
              :label="t('preferences.density')"
              :hint="t('preferences.densityHint')"
              :options="densityOptions"
            />
            <BaseCheckbox
              :model-value="prefs.autoAdvance"
              @update:model-value="prefs.update('autoAdvance', $event)"
              :label="t('preferences.autoAdvance')"
            />
            <BaseCheckbox
              :model-value="prefs.soundEffects"
              @update:model-value="prefs.update('soundEffects', $event)"
              :label="t('preferences.soundEffects')"
            />
          </FormGrid>
        </form>
      </BaseCard>
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/profile.css'
import { computed } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import { usePreferencesStore } from '@/stores/preferencesStore'

import { PER_PAGE_OPTIONS, DIFFICULTY_OPTIONS } from '@/utils/constants'


const { t } = useI18n()

const prefs = usePreferencesStore()

const perPageOptions = PER_PAGE_OPTIONS.map(v => ({ value: v, label: String(v) }))
const difficultyOptions = computed(() => [
  { value: '', label: t('preferences.allDifficulties') },
  ...DIFFICULTY_OPTIONS.map(opt => ({ value: opt.value, label: t(opt.labelKey) })),
])
const densityOptions = computed(() => [
  { value: 'comfortable', label: t('preferences.densityComfortable') },
  { value: 'compact', label: t('preferences.densityCompact') },
])
</script>
