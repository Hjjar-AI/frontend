<template>
  <Layout>
    <PageShell
      title="UI component showcase"
      subtitle="Development-only reference for shared states, density, hierarchy, and interaction."
      icon="bi bi-grid-3x3-gap"
      page-class="component-showcase"
    >
      <template #badges><BaseBadge variant="warning">DEV</BaseBadge></template>
      <template #actions>
        <BaseButton variant="ghost" icon="bi bi-arrow-repeat">Refresh action</BaseButton>
        <BaseButton variant="primary" icon="bi bi-plus-lg">Primary action</BaseButton>
      </template>

      <FeedbackRegion
        info="Page feedback belongs below the title and above page content."
      />

      <section class="showcase-section">
        <SectionHeader title="Actions and states" description="One primary action per scope." />
        <BaseCard>
          <CardHeader title="Buttons" icon="bi bi-cursor" />
          <div class="showcase-row">
            <BaseButton variant="primary">Primary</BaseButton>
            <BaseButton variant="secondary">Secondary</BaseButton>
            <BaseButton variant="ghost">Ghost</BaseButton>
            <BaseButton variant="danger">Destructive</BaseButton>
            <BaseIconButton icon="bi bi-three-dots" label="More actions" />
          </div>
          <div class="showcase-row">
            <BaseBadge variant="success" status>Ready</BaseBadge>
            <BaseBadge variant="warning" status>Pending</BaseBadge>
            <BaseBadge variant="danger" status>Failed</BaseBadge>
            <BaseChip interactive :active="chipActive" @click="chipActive = !chipActive">
              Interactive chip
            </BaseChip>
          </div>
        </BaseCard>
      </section>

      <section class="showcase-section">
        <SectionHeader title="Form controls" description="Shared sizes and validation rhythm." />
        <BaseCard>
          <FormGrid>
            <BaseInput v-model="form.small" label="Compact input" size="small" autocomplete="off" />
            <BaseInput v-model="form.normal" label="Default input" hint="Hints occupy the feedback row." />
            <BaseInput v-model="form.large" label="Large input" size="large" />
            <BaseSelect v-model="form.option" label="Select" :options="options" />
            <BaseInput label="Invalid field" error="Validate after blur or submit." />
            <BaseTextarea v-model="form.notes" label="Bidirectional notes" :maxlength="120" />
          </FormGrid>
        </BaseCard>
      </section>

      <section class="showcase-section">
        <SectionHeader title="Cards and metadata" />
        <div class="showcase-grid">
          <BaseCard>
            <CardHeader title="Neutral card" description="Default cards carry no semantic accent." />
            <MetadataList :items="metadata" />
          </BaseCard>
          <BaseCard
            interactive
            aria-label="Activate the sample card"
            @activate="cardActivated = !cardActivated"
          >
            <CardHeader title="Interactive card" description="Keyboard and pointer activation are explicit." />
            <BaseBadge :variant="cardActivated ? 'success' : 'secondary'">
              {{ cardActivated ? 'Activated' : 'Inactive' }}
            </BaseBadge>
          </BaseCard>
        </div>
      </section>

      <section class="showcase-section">
        <SectionHeader title="Async and empty content" />
        <div class="showcase-grid">
          <BaseCard><BaseEmptyState title="Create the first item" reason="first-use" /></BaseCard>
          <BaseCard><BaseEmptyState title="No matching results" reason="filtered" /></BaseCard>
        </div>
      </section>

      <section class="showcase-section">
        <SectionHeader title="Responsive table" />
        <BaseCard>
          <BaseTableShell density="compact" striped mobile-mode="columns">
            <table class="table-shared">
              <thead><tr><th>Name</th><th>Status</th><th>Score</th></tr></thead>
              <tbody>
                <tr><td dir="auto">Mixed نص text</td><td>Ready</td><td class="numeric">92%</td></tr>
                <tr><td dir="auto">Second item</td><td>Pending</td><td class="numeric">—</td></tr>
              </tbody>
            </table>
          </BaseTableShell>
        </BaseCard>
      </section>

      <BaseButton variant="secondary" @click="modalOpen = true">Open modal focus example</BaseButton>
      <BaseModal v-model:is-open="modalOpen" title="Initial focus example">
        <BaseInput v-model="modalValue" label="Focused first" autofocus />
        <template #footer>
          <BaseButton variant="secondary" @click="modalOpen = false">Close</BaseButton>
          <BaseButton variant="primary" @click="modalOpen = false">Save</BaseButton>
        </template>
      </BaseModal>
    </PageShell>
  </Layout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import SectionHeader from '@/components/common/SectionHeader.vue'
import CardHeader from '@/components/common/CardHeader.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import MetadataList from '@/components/common/MetadataList.vue'
import BaseTableShell from '@/components/common/BaseTableShell.vue'

const chipActive = ref(false)
const cardActivated = ref(false)
const modalOpen = ref(false)
const modalValue = ref('')
const form = reactive({ small: '', normal: '', large: '', option: '', notes: '' })
const options = [
  { value: 'one', label: 'Option one' },
  { value: 'two', label: 'Option two' },
]
const metadata = [
  { key: 'author', icon: 'bi bi-person', label: 'Author', value: 'Dr. Example' },
  { key: 'date', icon: 'bi bi-calendar', label: 'Updated', value: '2026-09-25' },
]
</script>

<style scoped>
.component-showcase { padding-block-end: var(--space-2xl); }
.showcase-section { margin-block-end: var(--space-xl); }
.showcase-row { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-sm); }
.showcase-row + .showcase-row { margin-block-start: var(--space-md); }
.showcase-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); gap: var(--space-md); }
</style>
