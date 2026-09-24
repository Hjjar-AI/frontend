<!-- frontend/src/components/common/ImportPreviewTable.vue -->
<template>
  <div class="import-preview-table">
    <div class="import-preview-table__header">
      <h5><i class="bi bi-eye"></i> {{ t('admin.import.preview.title') }}</h5>
      <BaseBadge variant="info">{{ t('admin.import.preview.badge', { total }) }}</BaseBadge>
    </div>

    <BaseEmptyState
      v-if="preview.length === 0"
      :title="t('admin.import.preview.empty')"
      icon="bi-file-earmark-x"
    />

    <BaseTableShell v-else density="compact" striped>
      <table class="table-shared import-preview-table__table">
        <thead>
          <tr>
            <th>{{ t('admin.import.preview.colIndex') }}</th>
            <th>{{ t('admin.import.preview.colQuestion') }}</th>
            <th>{{ t('admin.import.preview.colChoices') }}</th>
            <th>{{ t('admin.import.preview.colAnswer') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(q, idx) in preview.slice(0, 10)" :key="idx">
            <td>{{ idx + 1 }}</td>
            <td class="import-preview-table__question-cell">{{ truncate(q.question, 80) }}</td>
            <td>
              <ul class="import-preview-table__choices">
                <li
                  v-for="(choice, cidx) in q.choices.slice(0, 4)"
                  :key="cidx"
                  :class="{ 'import-preview-table__choice--correct': cidx + 1 === q.correctAnswer }"
                >
                  {{ cidx + 1 }}. {{ truncate(choice, 40) }}
                </li>
                <li v-if="q.choices.length > 4" class="import-preview-table__more">
                  {{ t('admin.import.preview.moreChoices', { n: q.choices.length - 4 }) }}
                </li>
              </ul>
            </td>
            <td><BaseBadge variant="success">{{ q.correctAnswer }}</BaseBadge></td>
          </tr>
        </tbody>
      </table>
    </BaseTableShell>

    <p v-if="total > 10" class="import-preview-table__more-info">
      {{ t('admin.import.preview.moreQuestions', { n: total - 10 }) }}
    </p>
  </div>
</template>

<script setup>
import { truncate } from '@/utils/formatters'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import BaseTableShell from '@/components/common/BaseTableShell.vue'


const { t } = useI18n()

defineProps({
  preview: { type: Array, required: true },
  total: { type: Number, required: true },
})
</script>
