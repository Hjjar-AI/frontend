<!-- frontend/src/features/testCommon/UnifiedTestSetup.vue -->
<!--
  Unified exam/study setup.

  Mode is a required radio at the top; source is a required tab
  strip; refinements collapse into an optional <details>. The backend
  accepts the union of both modes' filter sets, so a single payload
  shape works for both.

  MODE STATE OWNERSHIP
  --------------------
  This component owns the local `mode` ref, seeded from `initialMode`.
  It emits `update:mode` when the user toggles, and the parent
  (TestSetupPage) is responsible for reflecting that into the router
  so that `useTestPage`'s mode getter returns the right value at Start
  time.

  MULTI-TAG SOURCE
  ----------------
  The tag source is a multi-select grid, matching the category
  picker. It emits `tags_filter` (comma-joined) rather than the
  single-value `tag` key. The backend's
  `QuestionService.get_questions` already handles `tags_filter`
  via `tags__name__in` with OR semantics, so no backend change was
  required to support this.
-->
<template>
  <form @submit.prevent="submit" class="unified-setup">

    <!-- ═══ Mode (required) ═══════════════════════════════════════ -->
    <fieldset class="unified-setup__fieldset unified-setup__fieldset--mode">
      <legend class="unified-setup__legend">
        {{ t('tests.modeLabel') }}
        <span class="unified-setup__required" aria-hidden="true">*</span>
      </legend>

      <div class="mode-grid">
        <label
          v-for="m in MODE_OPTIONS"
          :key="m.value"
          class="mode-card"
          :class="{ 'mode-card--active': mode === m.value }"
        >
          <input
            type="radio"
            class="mode-card__input"
            name="test-mode"
            :value="m.value"
            :checked="mode === m.value"
            @change="setMode(m.value)"
          />
          <span class="mode-card__icon"><i :class="m.icon"></i></span>
          <span class="mode-card__body">
            <strong class="mode-card__title">{{ t(m.titleKey) }}</strong>
            <small class="mode-card__desc">{{ t(m.descKey) }}</small>
          </span>
        </label>
      </div>
    </fieldset>

    <!-- ═══ Source (required) ═════════════════════════════════════ -->
    <fieldset class="unified-setup__fieldset">
      <legend class="unified-setup__legend">
        {{ t('tests.sourceLabel') }}
        <span class="unified-setup__required" aria-hidden="true">*</span>
      </legend>

      <div class="source-tabs" role="tablist">
        <BaseChip
          v-for="s in availableSources"
          :key="s.value"
          interactive
          variant="primary"
          :active="source === s.value"
          role="tab"
          class="source-tab"
          :class="{ 'source-tab--active': source === s.value }"
          :disabled="s.disabled"
          :title="s.disabled ? s.disabledReason : ''"
          :aria-selected="source === s.value"
          @click="setSource(s.value)"
        >
          <i :class="s.icon"></i>
          <span>{{ t(s.labelKey) }}</span>
          <BaseBadge v-if="s.badge != null" small class="source-tab__badge">{{ s.badge }}</BaseBadge>
        </BaseChip>
      </div>

      <!-- Source-specific value picker. Category and Tag both use the
           generic SourceGridPicker with multiple=true. Blueprint is a
           single-select dropdown because the backend samples from one
           blueprint at a time. -->
      <div class="source-body">
        <SourceGridPicker
          v-if="source === 'tag'"
          v-model="selectedTags"
          :items="tagItems"
          :loading="tagsLoading"
          :multiple="true"
          :label="t('tests.sourceTagShort')"
          icon="bi bi-tag"
          :empty-text="t('tests.noTagsAvailable')"
        />

        <SourceGridPicker
          v-else-if="source === 'category'"
          v-model="selectedCategories"
          :items="categoryItems"
          :loading="categoriesLoading"
          :multiple="true"
          :label="t('tests.sourceCategoryShort')"
          icon="bi bi-folder2"
          :empty-text="t('categories.empty')"
        />

        <BaseSelect
          v-else-if="source === 'blueprint'"
          v-model="selectedBlueprintId"
          :options="blueprintOptions"
          :placeholder="t('tests.blueprintNone')"
        />

        <p v-else-if="source === 'bookmarks'" class="source-note">
          <i class="bi bi-bookmark-heart"></i>
          {{ t('tests.sourceBookmarksNote', { count: bookmarkStore.count }) }}
        </p>

        <p v-else-if="source === 'srs'" class="source-note">
          <i class="bi bi-arrow-repeat"></i>
          {{ t('tests.sourceSrsNote', { count: wrongAnswerStore.srsDueCount }) }}
        </p>

        <p v-else class="source-note source-note--muted">
          <i class="bi bi-info-circle"></i>
          {{ t('tests.chooseSource') }}
        </p>
      </div>
    </fieldset>

    <!-- ═══ Refinements (optional, collapsed) ════════════════════ -->
    <details class="unified-setup__refinements">
      <summary class="unified-setup__refinements-summary">
        <i class="bi bi-sliders"></i>
        {{ t('tests.refinements') }}
        <span class="unified-setup__optional">{{ t('common.optional') }}</span>
        <i class="bi bi-chevron-down unified-setup__refinements-arrow"></i>
      </summary>

      <div class="unified-setup__refinements-body">
        <FormGrid>
          <div class="form-group">
            <label>{{ t('difficulty.label') }}</label>
            <DifficultySelector v-model="filters.difficulty" />
          </div>
          <BaseInput
            v-model="filters.tags"
            :label="t('tests.additionalTags')"
            :placeholder="t('questions.tagsPlaceholder')"
          />
          <BaseCheckbox
            v-model="filters.verified_only"
            :label="t('tests.verifiedOnly')"
          />
        </FormGrid>
      </div>
    </details>

    <!-- ═══ Count ═════════════════════════════════════════════════ -->
    <BaseInput
      v-model.number="numQuestions"
      type="number"
      :label="t('tests.numQuestions')"
      :min="1"
      :max="maxAvailable > 0 ? maxAvailable : undefined"
      :hint="maxAvailable > 0
        ? t('tests.numAvailable', { count: maxAvailable })
        : t('tests.numLoading')"
    />

    <!-- ═══ Start ═════════════════════════════════════════════════ -->
    <div class="form-actions">
      <BaseButton
        type="submit"
        variant="primary"
        :loading="loading"
        :disabled="!canStart || loading"
      >
        {{ t(mode === 'exam'
          ? 'tests.examStart'
          : mode === 'recall'
            ? 'tests.recallStart'
            : 'tests.studyStart') }}
      </BaseButton>
    </div>

    <p v-if="!canStart && !loading" class="no-questions-hint">
      <i class="bi bi-info-circle"></i> {{ hintForDisabled }}
    </p>
  </form>
</template>

<script setup>
import '@/assets/blueprints.css'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseChip from '@/components/base/BaseChip.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import SourceGridPicker from '@/components/common/SourceGridPicker.vue'
import DifficultySelector from '@/features/questions/components/DifficultySelector.vue'
import { useTestSetupState } from './composables/useTestSetupState'

const { t } = useI18n()

const props = defineProps({
  maxAvailable: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  initialMode: { type: String, default: 'exam' },
  initialUseBookmarks: { type: Boolean, default: false },
})

const emit = defineEmits(['start', 'max-update', 'update:mode'])

const {
  MODE_OPTIONS,
  mode,
  source,
  selectedTags,
  selectedCategories,
  selectedBlueprintId,
  filters,
  numQuestions,
  tagItems,
  tagsLoading,
  categoryItems,
  categoriesLoading,
  blueprintOptions,
  availableSources,
  bookmarkStore,
  wrongAnswerStore,
  canStart,
  hintForDisabled,
  setMode,
  setSource,
  submit,
} = useTestSetupState(props, emit, t)
</script>
