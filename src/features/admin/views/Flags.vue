<!-- frontend/src/features/admin/views/Flags.vue -->
<template>
<Layout>
<PageShell :title="t('admin.flags.title')" icon="bi bi-flag-fill" page-class="admin-flags">
<template #badges>
<BaseBadge variant="warning">{{ t('admin.flags.badge', { count: flagStore.flags.length }) }}</BaseBadge>
</template>
<template #actions>
<BaseButton variant="secondary" size="small" @click="refresh" :loading="isRefreshing">
<i class="bi bi-arrow-repeat"></i> {{ t('common.refresh') }}
</BaseButton>
</template>
<FeedbackRegion :error="flagStore.error" @dismiss="flagStore.error = null" />

<BulkActions
v-if="selectedIds.length > 0"
:count="selectedIds.length"
:item-label="t('admin.flags.itemLabel')"
:verify-label="t('admin.flags.bulkResolve')"
:unverify-label="t('admin.flags.bulkUnverify')"
:clear-label="t('admin.flags.bulkClear')"
@verify="bulkResolve"
@unverify="clearSelection"
@clear="clearSelection"
/>

<BaseListContainer
:loading="flagStore.isLoading"
:items="flagStore.flags"
:empty-title="t('admin.flags.empty')"
:empty-message="t('admin.flags.emptyDesc')"
empty-icon="bi-flag"
>
<template #default="{ items }">
<ModerationCard
v-for="flag in items"
:key="flag.id"
:label="truncate(flag.question_text, 80)"
:subtitle="t('admin.flags.reporter', { name: flag.flagger_username })"
icon="bi-flag-fill"
:selected="isSelected(flag.id)"
:show-select="true"
@toggle-select="toggleSelection(flag.id)"
>
<template #actions>
<BaseButton variant="secondary" size="small" @click="resolve(flag.id)"><i class="bi bi-check-circle"></i> {{ t('admin.flags.resolve') }}</BaseButton>
</template>
<template #meta>
<span><i class="bi bi-pencil"></i> {{ t('admin.flags.author', { name: flag.question_author || t('questions.unknownAuthor') }) }}</span>
<span><i class="bi bi-calendar"></i> {{ formatDate(flag.created_at) }}</span>
<span v-if="flag.reason"><i class="bi bi-chat-dots"></i> {{ t('admin.flags.reason', { reason: flag.reason }) }}</span>
</template>
<template #body>
<router-link :to="`/questions/edit/${flag.question_id}`" class="question-link"><i class="bi bi-eye"></i> {{ t('admin.flags.viewQuestion') }}</router-link>
</template>
</ModerationCard>
</template>
</BaseListContainer>
</PageShell>
</Layout>
</template>

<script setup>
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'
import ModerationCard from '@/components/common/ModerationCard.vue'
import BulkActions from '@/components/common/BulkActions.vue'
import { useFlagStore } from '@/stores/flagStore'
import { useNotify } from '@/composables/useNotify'
import { useDialog } from '@/composables/useDialog'
import { useSelection } from '@/composables/useSelection'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { formatDate, truncate } from '@/utils/formatters'

const { t } = useI18n()

const flagStore = useFlagStore()
const { notify } = useNotify()
const { confirm } = useDialog()
const { selectedIds, toggle: toggleSelection, clear: clearSelection, isSelected } = useSelection()

const { isRefreshing, refresh } = useAutoRefresh(
  () => flagStore.fetchPending(),
  30000,
  true,
)

async function resolve(flagId) {
  const ok = await confirm(t('admin.flags.resolveConfirm'))
  if (!ok) return
  await flagStore.resolveFlag(flagId)
  clearSelection()
}

async function bulkResolve() {
  if (selectedIds.value.length === 0) return
  if (!await confirm(t('admin.flags.bulkConfirm', { count: selectedIds.value.length }))) return

  const { resolved, failed } = await flagStore.bulkResolve(selectedIds.value)

  clearSelection()

  if (failed > 0) {
    notify(t('admin.flags.bulkSummaryPartial', { success: resolved, fail: failed }), 'warning')
  } else {
    notify(t('admin.flags.bulkSummaryOk', { count: resolved }), 'success')
  }
}
</script>
