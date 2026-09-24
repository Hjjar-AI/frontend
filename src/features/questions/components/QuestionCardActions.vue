<!-- frontend/src/features/questions/components/QuestionCardActions.vue -->
<!--
  Question card action bar.

  Extracted from QuestionCard.vue. The bar keeps the four most-used
  actions visible and moves the rest into a "…" overflow menu:

    Primary (always visible)     Overflow menu
    ------------------------     ---------------------
    Select (if show-select)      Duplicate (cap-gated)
    Bookmark                     Export
    Edit                         Flag
    Verify (cap-gated)           ── divider ──
                                 Delete (destructive)

  Delete is in the menu on purpose: an extra click is the right
  friction for a destructive action.

  MENU STATE (second-review item 6)
  ---------------------------------
  `useDropdown` owns menu open state, outside-click, Escape, and
  focus return, plus single-open coordination across every dropdown
  in the app.

  IN-FLIGHT VERIFY STATE (this revision)
  --------------------------------------
  The verify button dims and its icon spins ONLY while THIS card's
  question is being verified, not while any store action runs.

  The first version of this component bound the disabled state to
  `questionStore.isLoading` — the store-wide flag. On a list page
  with twenty cards, that disabled and spun all twenty verify
  buttons during any store action (list load, delete, duplicate,
  bulk operations). Wrong on two counts: the disable was not
  necessary for cards whose question was not being verified, and
  the spin appeared on buttons the user had not clicked.

  The store now exposes `isVerifying(id)` backed by a reactive
  in-flight map (see questionStore.js), so this component asks about
  one specific id and only that id's button reacts.
-->
<template>
  <div class="question-card__actions no-print">
    <!-- ── Primary actions ──────────────────────────────────────── -->
    <div class="question-card__actions-group">
      <BaseIconButton
        v-if="showSelect"
        :class="{ 'base-button--active': selected }"
        :icon="selected ? 'bi bi-check-square' : 'bi bi-square'"
        :label="selected ? t('ui.deselectItem') : t('ui.selectItem')"
        @click="$emit('toggle-select')"
      />

      <BaseIconButton
        :icon="bookmarkIcon"
        :label="bookmarked ? t('questions.unbookmark') : t('questions.bookmark')"
        @click="onBookmark"
      />

      <BaseIconButton
        icon="bi bi-pencil"
        :label="t('common.edit')"
        @click="$emit('edit')"
      />

      <BaseIconButton
        v-if="authStore.can('questions.verify')"
        icon="bi bi-patch-check"
        :label="t('questions.verify')"
        :loading="verifying"
        @click="$emit('verify')"
      />
    </div>

    <!-- ── Overflow menu ────────────────────────────────────────── -->
    <div class="question-card__actions-group question-card__actions-group--end">
      <div ref="rootRef" class="question-card-actions__menu-wrap">
        <BaseIconButton
          icon="bi bi-three-dots"
          :label="t('ui.moreActions')"
          :aria-expanded="isOpen"
          aria-haspopup="menu"
          @click.stop="toggle"
        />

        <BasePopoverPanel
            :open="isOpen"
            panel-class="question-card-actions__menu"
            role="menu"
            @click.stop
          >
            <BaseButton
              v-if="authStore.can('questions.duplicate')"
              variant="ghost"
              size="small"
              raw-content
              class="question-card-actions__item"
              role="menuitem"
              @click="run('duplicate')"
            >
              <i class="bi bi-files"></i>
              <span>{{ t('questions.duplicate') }}</span>
            </BaseButton>

            <BaseButton
              variant="ghost"
              size="small"
              raw-content
              class="question-card-actions__item"
              role="menuitem"
              @click="run('export')"
            >
              <i class="bi bi-download"></i>
              <span>{{ t('questions.exportSingle') }}</span>
            </BaseButton>

            <BaseButton
              variant="ghost"
              size="small"
              raw-content
              class="question-card-actions__item"
              role="menuitem"
              @click="run('flag')"
            >
              <i class="bi bi-flag"></i>
              <span>{{ t('questions.flag') }}</span>
            </BaseButton>

            <div class="question-card-actions__divider" role="separator"></div>

            <BaseButton
              variant="ghost"
              size="small"
              raw-content
              class="question-card-actions__item question-card-actions__item--danger"
              role="menuitem"
              @click="run('delete')"
            >
              <i class="bi bi-trash"></i>
              <span>{{ t('common.delete') }}</span>
            </BaseButton>
        </BasePopoverPanel>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useDropdown } from '@/composables/useDropdown'
import { downloadBlob } from '@/utils/downloadFile'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BasePopoverPanel from '@/components/base/BasePopoverPanel.vue'

const { t } = useI18n()

const props = defineProps({
  question: { type: Object, required: true },
  bookmarked: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  showSelect: { type: Boolean, default: false },
})

const emit = defineEmits([
  'toggle-select',
  'bookmark',
  'edit',
  'delete',
  'verify',
  'flag',
  'duplicate',
])

const authStore = useAuthStore()
const questionStore = useQuestionStore()

// ──────────────────────────────────────────────────────────────────
// In-flight guard for THIS card's verify button.
//
// `questionStore.isVerifying(id)` is a getter backed by a reactive
// Map (questionStore.js). The computed below calls it with this
// card's question id, so Vue's reactivity tracks reads against that
// specific id. A verify on question 42 invalidates the computed for
// the component rendering question 42 and nothing else — the other
// nineteen cards on a list page do not re-render and their buttons
// remain enabled.
//
// The store's `toggleVerify` action also carries an in-flight dedup
// map, so a second call for the same id is a no-op at the network
// layer. The disable binding here is the visible half of that
// contract: the user sees the button respond to their click rather
// than the second press appearing to do nothing.
// ──────────────────────────────────────────────────────────────────
const verifying = computed(() => questionStore.isVerifying(props.question.id))

const { isOpen, rootRef, close, toggle } = useDropdown()

const bookmarkAnim = ref(false)
const bookmarkedIcon = computed(() => props.bookmarked ? 'bi bi-bookmark-heart-fill' : 'bi bi-bookmark-heart')
const bookmarkIcon = computed(() => [
  bookmarkedIcon.value,
  bookmarkAnim.value ? 'question-card-actions__bookmark--animated' : '',
].filter(Boolean).join(' '))

function onBookmark() {
  bookmarkAnim.value = true
  setTimeout(() => (bookmarkAnim.value = false), 400)
  emit('bookmark')
}

function run(action) {
  close()
  if (action === 'export') {
    exportQuestion()
    return
  }
  emit(action)
}

// ──────────────────────────────────────────────────────────────────
// Export flow routes through the shared `downloadBlob` helper so
// the object URL is revoked after a short delay, matching the
// behaviour `ExportButtons.vue` established. See
// `utils/downloadFile.js` for the rationale.
// ──────────────────────────────────────────────────────────────────
function exportQuestion() {
  const q = props.question
  const data = {
    id: q.id,
    uuid: q.uuid,
    question: q.question,
    choices: q.choices || [],
    correct_answer: q.correct_answer,
    explanation: q.explanation || '',
    source: q.source || '',
    tags: Array.isArray(q.tags) ? q.tags.join(',') : (q.tags || ''),
    difficulty: q.difficulty || '',
    category_id: q.category ?? null,
    verified: q.verified || false,
    case: q.case
      ? {
          key: q.case.key,
          title: q.case.title,
          stem: q.case.stem,
        }
      : null,
    case_order: q.case_order ?? null,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  downloadBlob(blob, `question_${q.id}.json`)
}
</script>
