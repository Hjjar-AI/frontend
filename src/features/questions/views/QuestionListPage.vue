<!-- frontend/src/features/questions/views/QuestionListPage.vue -->
<!--
  Unified question list.

  Renders four previously-separate pages that shared the same skeleton
  (header + error banner + paginated QuestionCard loop + optional bulk
  actions + pagination). Each is selected by the `mode` prop:

    mode='all'       — /questions
    mode='review'    — /questions/review
    mode='mistakes'  — /questions/mistakes
    mode='fragile'   — /questions/fragile

  ERROR SURFACE
  -------------
  ErrorBanner is the sole error surface. BaseListContainer renders
  loading / empty / content only.
-->
<template>
  <Layout>
    <PageShell
      :title="headerTitle"
      :icon="headerIcon"
      :page-class="containerClass"
    >
        <template v-if="headerBadge" #badges>
          <BaseBadge :variant="headerBadge.variant">
            {{ headerBadge.label }}
          </BaseBadge>
        </template>
        <template v-if="showHeaderActions" #actions>
          <div
            v-if="mode === 'mistakes' || mode === 'fragile'"
            class="notebook-page__header-actions"
          >
            <BaseButton
              variant="primary"
              size="small"
              :disabled="items.length === 0"
              @click="startDrill"
            >
              <i class="bi bi-play-circle"></i> {{ drillButtonLabel }}
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="small"
              @click="() => fetchPage(currentPage)"
            >
              <i class="bi bi-arrow-repeat"></i> {{ t('common.refresh') }}
            </BaseButton>
          </div>
          <BaseButton
            v-else-if="mode === 'all' && authStore.can('questions.create')"
            variant="primary"
            @click="router.push('/questions/add')"
          >
            <i class="bi bi-plus-circle"></i> {{ t('questions.addButton') }}
          </BaseButton>
        </template>
      <!-- Last-viewed chip (all only) -->
      <div v-if="mode === 'all' && lastViewedId" class="last-viewed-chip">
        <i class="bi bi-clock-history"></i>
        <span>{{ t('questions.lastViewed') }}</span>
        <router-link
          :to="`/questions/edit/${lastViewedId}`"
          class="last-viewed-link"
        >
          {{ t('questions.lastViewedLink', { id: lastViewedId }) }}
          <DirectionalIcon ltr="bi bi-arrow-left" rtl="bi bi-arrow-right" />
        </router-link>
        <BaseIconButton
          class="last-viewed-clear"
          icon="bi bi-x"
          size="small"
          :label="t('questions.lastViewedClear')"
          @click="clearLastViewed"
        />
      </div>

      <!-- Filter bar + chips (all only) -->
      <FilterBar
        v-if="mode === 'all'"
        :filters="filters"
        :categories="categories"
        :tags="tags"
        @update:filters="onFiltersUpdate"
        @search="handleSearch"
        @reset="handleReset"
      />

      <div v-if="mode === 'all' && activeFilterCount > 0" class="filter-chips">
        <BaseChip
          v-for="chip in filterChips"
          :key="chip.key"
          removable
          :remove-label="t('common.clear')"
          @remove="removeFilter(chip.key)"
        >
          {{ chip.label }}
        </BaseChip>
        <BaseButton variant="ghost" size="small" @click="handleReset">{{ t('common.clearAll') }}</BaseButton>
      </div>

      <!-- Meta row with per-page select (all only) -->
      <div v-if="mode === 'all'" class="questions-list__meta">
        <span>
          {{ t('questions.showingOf', {
            count: items.length,
            total: totalItems,
          }) }}
        </span>
        <span>
          {{ t('questions.pageOf', {
            page: currentPage,
            pages: totalPages,
          }) }}
        </span>
        <BaseSelect
          :model-value="perPage"
          :options="perPageOptions"
          @update:model-value="perPage = Number($event); handlePerPageChange()"
        />
      </div>

      <!-- Review-queue bulk verify. -->
      <div
        v-if="mode === 'review' && authStore.can('questions.bulk_verify')"
        class="review-queue__bulk"
      >
        <BaseButton
          variant="primary"
          size="small"
          :disabled="selectedIds.length === 0"
          @click="handleBulkVerify('verify')"
        >
          <i class="bi bi-patch-check"></i>
          {{ t('questions.bulkVerifyWithCount', { count: selectedIds.length }) }}
        </BaseButton>
        <BaseButton variant="secondary" size="small" @click="clearSelection">
          <i class="bi bi-x-circle"></i> {{ t('questions.bulkClear') }}
        </BaseButton>
      </div>

      <!-- Bulk actions for 'all' mode -->
      <BulkActions
        v-if="mode === 'all' && selectedIds.length > 0"
        :count="selectedIds.length"
        :item-label="t('questions.itemLabelDefault')"
        @verify="handleBulkVerify('verify')"
        @unverify="handleBulkVerify('unverify')"
        @clear="clearSelection"
      >
        <template #extra-actions>
          <BaseButton
            variant="secondary"
            size="small"
            @click="bulkTagModalOpen = true"
          >
            <i class="bi bi-tags"></i> {{ t('questions.bulkTagsShort') }}
          </BaseButton>
        </template>
      </BulkActions>

      <!-- Fragile-knowledge callout (fragile only) -->
      <div v-if="mode === 'fragile'" class="fragile-callout">
        <i class="bi bi-info-circle"></i>
        <div class="fragile-callout__body">
          <span class="fragile-callout__title">
            {{ t('questions.fragileCalloutTitle') }}
          </span>
          <p class="fragile-callout__text">
            {{ t('questions.fragileCalloutBody') }}
          </p>
        </div>
      </div>

      <!-- Main list -->
      <BaseListContainer
        :loading="isLoading"
        :error="error"
        :items="items"
        :empty-title="emptyTitle"
        :empty-message="emptyMessage"
        :empty-icon="emptyIcon"
        :empty-reason="emptyReason"
        @retry="() => fetchPage(currentPage)"
      >
        <template v-if="mode === 'all'" #emptyActions>
          <BaseButton
            v-if="activeFilterCount === 0 && authStore.can('questions.create')"
            variant="primary"
            @click="router.push('/questions/add')"
          >
            {{ t('questions.emptyAddNow') }}
          </BaseButton>
          <BaseButton v-else-if="activeFilterCount > 0" variant="ghost" @click="handleReset">
            {{ t('common.clearAll') }}
          </BaseButton>
        </template>

        <template #default="{ items: listItems }">
          <div class="stagger-list">
            <QuestionCard
              v-for="q in listItems"
              :key="q.id"
              :question="q"
              :bookmarked="bookmarkedIds.includes(q.id)"
              :selected="supportsSelect ? isSelected(q.id) : false"
              :show-select="supportsSelect && authStore.can('questions.bulk_verify')"
              @toggle-select="toggleSelection(q.id)"
              @bookmark="handleBookmark(q.id)"
              @edit="router.push(`/questions/edit/${q.id}`)"
              @delete="handleDelete(q.id)"
              @verify="handleVerify(q.id)"
              @flag="handleFlag(q.id)"
              @duplicate="handleDuplicate(q.id)"
            />
          </div>
        </template>
      </BaseListContainer>

      <!-- Pagination -->
      <Pagination
        v-if="totalPages > 1"
        :current="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </PageShell>

    <!-- Bulk tag editor (all only) -->
    <BulkTagEditor
      v-if="mode === 'all'"
      :is-open="bulkTagModalOpen"
      :count="selectedIds.length"
      :loading="questionStore.isLoading"
      @apply="handleBulkTags"
      @close="bulkTagModalOpen = false"
    />
  </Layout>
</template>

<script setup>
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BulkActions from '@/components/common/BulkActions.vue'
import BulkTagEditor from '@/components/common/BulkTagEditor.vue'
import FilterBar from '../components/FilterBar.vue'
import QuestionCard from '../components/QuestionCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BaseChip from '@/components/base/BaseChip.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import Pagination from '@/components/base/BasePagination.vue'
import { useQuestionListController } from '../composables/useQuestionListController'
import { PER_PAGE_OPTIONS } from '@/utils/constants'

const { t } = useI18n()
const perPageOptions = PER_PAGE_OPTIONS.map(value => ({ value, label: String(value) }))

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (v) => ['all', 'review', 'mistakes', 'fragile'].includes(v),
  },
})

const {
  router,
  authStore,
  questionStore,
  selectedIds,
  toggleSelection,
  clearSelection,
  isSelected,
  bulkTagModalOpen,
  currentPage,
  perPage,
  totalItems,
  filters,
  categories,
  tags,
  lastViewedId,
  containerClass,
  headerTitle,
  headerIcon,
  supportsSelect,
  headerBadge,
  showHeaderActions,
  drillButtonLabel,
  items,
  isLoading,
  error,
  bookmarkedIds,
  emptyTitle,
  emptyMessage,
  emptyIcon,
  emptyReason,
  totalPages,
  activeFilterCount,
  filterChips,
  onFiltersUpdate,
  handleSearch,
  handleReset,
  removeFilter,
  handlePerPageChange,
  fetchPage,
  handlePageChange,
  handleBookmark,
  handleDelete,
  handleVerify,
  handleDuplicate,
  handleFlag,
  handleBulkVerify,
  handleBulkTags,
  startDrill,
  clearLastViewed,
} = useQuestionListController(() => props.mode, t)
</script>
