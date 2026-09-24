<!-- frontend/src/features/admin/views/Settings.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('admin.settings.title')"
      icon="bi bi-gear"
      size="narrow"
      page-class="admin-settings"
    >
      <BaseCard>
        <FeedbackRegion :error="adminSettingsStore.error" @dismiss="adminSettingsStore.error = null" />

        <form @submit.prevent="saveSettings" class="settings-form">
          <fieldset class="settings-section">
            <legend>{{ t('admin.settings.sectionGeneral') }}</legend>
            <FormGrid>
              <BaseInput v-model.number="settings.default_expiry_days" type="number" :label="t('admin.settings.expiryDays')" :hint="t('admin.settings.expiryDaysHint')" min="0" required />
              <BaseInput v-model.number="settings.default_renewal_days" type="number" :label="t('admin.settings.renewalDays')" :hint="t('admin.settings.renewalDaysHint')" min="0" required />
            </FormGrid>
          </fieldset>

          <fieldset class="settings-section">
            <legend>{{ t('admin.settings.sectionTests') }}</legend>
            <FormGrid>
              <BaseInput v-model.number="settings.exam_duration_minutes" type="number" :label="t('admin.settings.examDuration')" :hint="t('admin.settings.examDurationHint')" min="1" required />
            </FormGrid>
          </fieldset>

          <div class="form-actions">
            <BaseButton type="submit" variant="primary" :loading="adminSettingsStore.isLoading">
              <i class="bi bi-check-lg"></i> {{ t('admin.settings.save') }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!--
        Maintenance card.

        Both operations below are gated server-side by the
        'admin.seed' capability (see RefreshAuthorRanksView and
        SeedSampleQuestionsView in apps/core/views.py). The page
        itself is reached via the '/admin/settings' route, which
        requires only 'admin.settings'. A deployment could
        legitimately grant one capability without the other — e.g.
        a moderator who can adjust policy numbers but should not be
        able to trigger bulk recalculations.

        Rendering the card unconditionally used to produce buttons
        that always 403'd for such a user. The whole card is now
        gated on 'admin.seed'; the section is present only when at
        least one of its operations is permitted. If a future
        operation lands here with a different capability, gate that
        individual operation rather than opening the whole card.
      -->
      <BaseCard v-if="authStore.can('admin.seed')">
        <h4 class="card-title">
          <i class="card-title__icon bi bi-tools"></i>
          {{ t('admin.settings.sectionOps') }}
        </h4>
        <p class="text-muted settings-ops__intro">
          {{ t('admin.settings.opsIntro') }}
        </p>

        <div class="settings-ops">
          <div class="settings-op">
            <div class="settings-op__info">
              <strong class="settings-op__title">
                <i class="bi bi-arrow-repeat"></i>
                {{ t('admin.settings.rankRefreshTitle') }}
              </strong>
              <p class="settings-op__desc">
                {{ t('admin.settings.rankRefreshDesc') }}
              </p>
              <div v-if="adminSettingsStore.lastRankRefreshResult" class="settings-op__result">
                <i class="bi bi-info-circle"></i>
                {{ t('admin.settings.rankRefreshLast', {
                  updated: adminSettingsStore.lastRankRefreshResult.updated,
                  scanned: adminSettingsStore.lastRankRefreshResult.scanned,
                }) }}
              </div>
            </div>
            <BaseButton
              variant="secondary"
              :loading="adminSettingsStore.isRankRefreshLoading"
              @click="handleRefreshRanks"
            >
              <i class="bi bi-arrow-repeat"></i> {{ t('admin.settings.runNow') }}
            </BaseButton>
          </div>

          <div class="settings-op">
            <div class="settings-op__info">
              <strong class="settings-op__title">
                <i class="bi bi-database-add"></i>
                {{ t('admin.settings.seedTitle') }}
              </strong>
              <p class="settings-op__desc">
                {{ t('admin.settings.seedDesc') }}
              </p>
              <div v-if="adminSettingsStore.lastSeedResult?.stdout" class="settings-op__result">
                <i class="bi bi-info-circle"></i>
                {{ lastSeedSummary }}
              </div>
            </div>
            <BaseButton
              variant="secondary"
              :loading="adminSettingsStore.isSeedQuestionsLoading"
              @click="handleSeedQuestions"
            >
              <i class="bi bi-database-add"></i> {{ t('admin.settings.runNow') }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </PageShell>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import { useAdminSettingsStore } from '@/stores/adminSettingsStore'
import { useAuthStore } from '@/stores/authStore'


const { t } = useI18n()

const adminSettingsStore = useAdminSettingsStore()
const authStore = useAuthStore()
const settings = ref({ default_expiry_days: 60, default_renewal_days: 30, exam_duration_minutes: 60 })

function parseIntOr(raw, fallback) {
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? fallback : n
}

async function loadSettings() {
  const data = await adminSettingsStore.fetchSettings()
  if (data) {
    settings.value = {
      default_expiry_days: parseIntOr(data.default_expiry_days, 60),
      default_renewal_days: parseIntOr(data.default_renewal_days, 30),
      exam_duration_minutes: parseIntOr(data.exam_duration_minutes, 60),
    }
  }
}

async function saveSettings() {

  await adminSettingsStore.updateSettings(settings.value)
}

const lastSeedSummary = computed(() => {
  const stdout = adminSettingsStore.lastSeedResult?.stdout
  if (!stdout) return ''
  const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean)
  return lines[lines.length - 1] || ''
})

function handleRefreshRanks() {
  adminSettingsStore.refreshAuthorRanks()
}

function handleSeedQuestions() {
  adminSettingsStore.seedSampleQuestions()
}

onMounted(() => { loadSettings() })
</script>
