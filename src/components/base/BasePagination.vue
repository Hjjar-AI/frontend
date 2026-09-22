<!-- frontend/src/components/base/BasePagination.vue -->
<!--
  Pagination control.

  PROP: `totalPages` (was `total` before this revision)
  -----------------------------------------------------
  The prop was called `total` while every call site passed it a
  page COUNT, not an item count. The backend's own `total` field
  means the item count — the two names disagreed about what they
  were naming, and the mismatch was inviting exactly the sort of
  silent bug where someone passes `total` (items) where
  `totalPages` (pages) is expected. Renamed across the component
  and all four call sites (Users.vue, QuestionListPage.vue,
  History.vue, BaseDataTable.vue).

  Every other prop is unchanged.
-->
<template>
  <nav class="base-pagination" v-if="totalPages > 1">
    <button
      class="base-pagination__btn"
      :disabled="current === 1"
      @click="$emit('page-change', current - 1)"
      :aria-label="t('ui.previousPage')"
    >
      <DirectionalIcon ltr="bi bi-chevron-left" rtl="bi bi-chevron-right" />
      {{ t('common.previous') }}
    </button>

    <span class="base-pagination__info">{{ current }} / {{ totalPages }}</span>

    <button
      class="base-pagination__btn"
      :disabled="current === totalPages"
      @click="$emit('page-change', current + 1)"
      :aria-label="t('ui.nextPage')"
    >
      {{ t('common.next') }}
      <DirectionalIcon ltr="bi bi-chevron-right" rtl="bi bi-chevron-left" />
    </button>

    <div class="base-pagination__jump" v-if="totalPages > 10">
      <input
        type="number"
        v-model.number="jumpTo"
        :min="1"
        :max="totalPages"
        :placeholder="t('ui.jumpToNumber')"
        class="form-control form-control--compact base-pagination__jump-input"
        @keyup.enter="jump"
        @blur="validateJumpInput"
        :aria-label="t('ui.goToPage')"
      />
      <button
        class="base-pagination__btn"
        @click="jump"
        :aria-label="t('ui.goToPage')"
      >{{ t('ui.go') }}</button>
    </div>

    <div class="base-pagination__per-page" v-if="showPerPage">
      <label class="base-pagination__per-page-label">{{ t('ui.perPageLabel') }}</label>
      <select
        :value="perPage"
        @change="$emit('per-page-change', Number($event.target.value))"
        class="form-control form-control--compact base-pagination__per-page-select"
      >
        <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const { t } = useI18n()

const props = defineProps({
  current: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  perPage: { type: Number, default: 20 },
  perPageOptions: { type: Array, default: () => [10, 20, 50, 100] },
  showPerPage: { type: Boolean, default: false },
})

const emit = defineEmits(['page-change', 'per-page-change'])

const jumpTo = ref(null)

function jump() {
  if (jumpTo.value === null || jumpTo.value === undefined || isNaN(jumpTo.value)) {
    return
  }

  const page = Math.max(1, Math.min(props.totalPages, Math.floor(jumpTo.value)))
  emit('page-change', page)
  jumpTo.value = null
}

function validateJumpInput() {
  if (jumpTo.value === null || jumpTo.value === undefined || isNaN(jumpTo.value)) {
    jumpTo.value = null
    return
  }
  const page = Math.floor(jumpTo.value)
  if (page < 1) jumpTo.value = 1
  else if (page > props.totalPages) jumpTo.value = props.totalPages
}
</script>