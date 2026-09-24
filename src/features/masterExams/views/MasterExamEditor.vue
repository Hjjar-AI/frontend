<!-- frontend/src/features/masterExams/views/MasterExamEditor.vue -->
<template>
  <Layout>
    <PageShell
      :title="isEdit ? t('masterExams.editTitle') : t('masterExams.newTitle')"
      icon="bi bi-pencil-square"
      page-class="master-exam-editor"
    >
        <template #actions>
          <BaseButton variant="secondary" @click="router.push('/master-exams')">
            <i class="bi bi-x-lg"></i> {{ t('common.cancel') }}
          </BaseButton>
          <BaseButton
            variant="primary"
            :loading="masterExamStore.isLoading"
            :disabled="isFrozen"
            @click="save"
          >
            <i class="bi bi-check-lg"></i> {{ t('common.save') }}
          </BaseButton>
        </template>
      <div
        v-if="isFrozen"
        class="master-exam-runner__preview-banner master-exam-editor__frozen-banner"
      >
        <i class="bi bi-lock"></i>
        <span>{{ t('masterExams.frozen') }}</span>
      </div>

      <FeedbackRegion
        :error="masterExamStore.error"
        :retry="masterExamStore.error ? true : false"
        @dismiss="masterExamStore.error = null"
        @retry="loadExam"
      />

      <BaseCard>
        <h3 class="master-exam-editor__section-title">
          <i class="bi bi-info-circle"></i>
          {{ t('masterExams.sectionInfo') }}
        </h3>
        <FormGrid>
          <BaseInput
            v-model="form.name"
            :label="t('masterExams.name')"
            required
            :disabled="isFrozen"
          />
          <BaseInput
            v-model="form.exam_topic_tag"
            :label="t('masterExams.examTopicTag')"
            :disabled="isFrozen"
          />
        </FormGrid>
        <BaseInput
          v-model="form.description"
          :label="t('masterExams.description')"
          :disabled="isFrozen"
        />
        <!--
          BaseField slot props: `id` binds to the control's `id`
          attribute so the label's `for` finds it; `describedBy`
          binds to `aria-describedby` so the hint is announced
          alongside the control. Both are optional but here every
          field has a hint or a label, so both are used.
        -->
        <BaseTextarea
          v-model="form.instructions"
          :label="t('masterExams.instructions')"
          :rows="3"
          :disabled="isFrozen"
        />
      </BaseCard>

      <BaseCard>
        <h3 class="master-exam-editor__section-title">
          <i class="bi bi-calendar-event"></i>
          {{ t('masterExams.sectionSchedule') }}
        </h3>
        <FormGrid>
          <BaseInput
            v-model="form.opens_at_local"
            type="datetime-local"
            :label="t('masterExams.opensAt')"
            :disabled="isFrozen"
          />
          <BaseInput
            v-model="form.closes_at_local"
            type="datetime-local"
            :label="t('masterExams.closesAt')"
            :disabled="isFrozen"
          />
          <BaseInput
            v-model.number="form.duration_minutes"
            type="number"
            :label="t('masterExams.durationMinutes')"
            min="1"
            max="600"
            :disabled="isFrozen"
          />
          <BaseCheckbox
            v-model="form.allow_makeup"
            :label="t('masterExams.allowMakeup')"
            :disabled="isFrozen"
          />
        </FormGrid>
      </BaseCard>

      <BaseCard>
        <h3 class="master-exam-editor__section-title">
          <i class="bi bi-people"></i>
          {{ t('masterExams.sectionAudience') }}
        </h3>
        <FormGrid>
          <BaseCheckbox
            v-model="form.audience_all_doctors"
            :label="t('masterExams.audienceAll')"
            :disabled="isFrozen"
          />
        </FormGrid>
        <BaseSelect
          v-model="form.audience_group_ids"
          :label="t('masterExams.audienceGroups')"
          :options="audienceGroupOptions"
          multiple
          :disabled="isFrozen"
        />
        <BaseSelect
          v-model="form.audience_user_ids"
          :label="t('masterExams.audienceUsers')"
          :options="audienceUserOptions"
          multiple
          :disabled="isFrozen"
        />
        <BaseSelect
          v-model="form.co_attending_ids"
          :label="t('masterExams.coAttendings')"
          :options="attendingOptions"
          multiple
          :disabled="isFrozen"
        />
      </BaseCard>

      <BaseCard>
        <h3 class="master-exam-editor__section-title">
          <i class="bi bi-sliders"></i>
          {{ t('masterExams.sectionAdvanced') }}
        </h3>
        <FormGrid>
          <BaseInput
            v-model.number="form.weight_easy"
            type="number"
            step="0.1"
            :label="t('masterExams.weightEasy')"
            :disabled="isFrozen"
          />
          <BaseInput
            v-model.number="form.weight_medium"
            type="number"
            step="0.1"
            :label="t('masterExams.weightMedium')"
            :disabled="isFrozen"
          />
          <BaseInput
            v-model.number="form.weight_hard"
            type="number"
            step="0.1"
            :label="t('masterExams.weightHard')"
            :disabled="isFrozen"
          />
          <BaseCheckbox
            v-model="form.shuffle_questions"
            :label="t('masterExams.shuffleQuestions')"
            :disabled="isFrozen"
          />
          <BaseCheckbox
            v-model="form.shuffle_choices"
            :label="t('masterExams.shuffleChoices')"
            :disabled="isFrozen"
          />
        </FormGrid>
      </BaseCard>

      <BaseCard>
        <h3 class="master-exam-editor__section-title">
          <i class="bi bi-list-ol"></i>
          {{ t('masterExams.sectionQuestions') }}
          <span class="master-exam-editor__section-title-count">
            {{ t('masterExams.questionCount', { n: form.question_ids.length }) }}
          </span>
        </h3>

        <div v-if="form.question_ids.length" class="master-exam-question-list">
          <div
            v-for="(qid, idx) in form.question_ids"
            :key="qid"
            class="master-exam-question-row"
            :class="{ 'master-exam-question-row--draft': questionsById[qid]?.is_draft }"
          >
            <div class="master-exam-question-row__reorder">
              <BaseIconButton
                icon="bi bi-chevron-up"
                size="small"
                :label="t('masterExams.moveUpAria')"
                :disabled="idx === 0 || isFrozen"
                @click="moveUp(idx)"
              />
              <BaseIconButton
                icon="bi bi-chevron-down"
                size="small"
                :label="t('masterExams.moveDownAria')"
                :disabled="idx === form.question_ids.length - 1 || isFrozen"
                @click="moveDown(idx)"
              />
            </div>
            <div class="master-exam-question-row__reorder">
              <BaseIconButton
                icon="bi bi-chevron-double-up"
                size="small"
                :label="t('masterExams.moveTopAria')"
                :disabled="idx === 0 || isFrozen"
                @click="moveTop(idx)"
              />
              <BaseIconButton
                icon="bi bi-chevron-double-down"
                size="small"
                :label="t('masterExams.moveBottomAria')"
                :disabled="idx === form.question_ids.length - 1 || isFrozen"
                @click="moveBottom(idx)"
              />
            </div>
            <span class="master-exam-question-row__index">{{ idx + 1 }}</span>
            <div class="master-exam-question-row__body">
              <p class="master-exam-question-row__text">
                {{ questionsById[qid]?.question || `#${qid}` }}
              </p>
              <div class="master-exam-question-row__meta">
                <BaseBadge
                  v-if="questionsById[qid]?.is_draft"
                  variant="warning"
                  small
                  class="master-exam-question-row__draft-badge"
                >
                  <i class="bi bi-pencil"></i> {{ t('masterExams.draftBadge') }}
                </BaseBadge>
                <span v-if="questionsById[qid]?.difficulty">
                  <i class="bi bi-speedometer"></i>
                  {{ difficultyLabel(questionsById[qid].difficulty) }}
                </span>
                <span v-if="questionsById[qid]?.category_name">
                  <i class="bi bi-folder2"></i> {{ questionsById[qid].category_name }}
                </span>
                <span v-if="questionsById[qid]?.case?.key">
                  <i class="bi bi-journal-medical"></i> {{ questionsById[qid].case.key }}
                </span>
              </div>
            </div>
            <div class="master-exam-question-row__actions">
              <BaseIconButton
                class="danger"
                icon="bi bi-x-lg"
                variant="danger"
                size="small"
                :label="t('masterExams.removeQuestionAria')"
                :disabled="isFrozen"
                @click="removeQuestion(idx)"
              />
            </div>
          </div>
        </div>
        <BaseEmptyState
          v-else
          :title="t('masterExams.noQuestionsYet')"
          :message="t('masterExams.noQuestionsHint')"
          icon="bi bi-question-circle"
        />

        <div class="master-exam-editor__toolbar">
          <BaseButton variant="primary" :disabled="isFrozen" @click="pickerOpen = true">
            <i class="bi bi-plus-circle"></i> {{ t('masterExams.addFromBank') }}
          </BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="isFrozen"
            @click="draftFormOpen = !draftFormOpen"
          >
            <i class="bi bi-pencil-square"></i> {{ t('masterExams.createDraft') }}
          </BaseButton>
        </div>

        <div v-if="draftFormOpen">
          <div class="master-exam-draft-form__header">
            <i class="bi bi-pencil-square"></i>
            <h4>{{ t('masterExams.draftNew') }}</h4>
            <BaseIconButton
              icon="bi bi-x-lg"
              :label="t('masterExams.closeDraftFormAria')"
              @click="draftFormOpen = false"
            />
          </div>
          <DraftQuestionForm
            v-model="draftForm"
            :categories="categoryStore.items"
            :cases="availableCases"
            :loading="masterExamStore.isLoading"
            :submit-label="t('masterExams.addDraftButton')"
            case-list-id="editor-case-key-suggestions"
            correct-answer-name="editor-draft-correct-answer"
            @submit="addDraft"
            @cancel="draftFormOpen = false"
          />
        </div>
      </BaseCard>

      <BaseModal
        :is-open="pickerOpen"
        :title="t('masterExams.pickerTitle')"
        size="lg"
        @update:is-open="pickerOpen = false"
      >
        <div class="master-exam-picker">
          <div class="master-exam-picker__filters">
            <BaseInput
              :model-value="pickerSearch"
              :placeholder="t('masterExams.pickerSearch')"
              class="master-exam-picker__search"
              @update:model-value="onPickerSearch"
            />
            <BaseButton variant="secondary" size="small" @click="loadPicker">
              <i class="bi bi-arrow-repeat"></i> {{ t('common.refresh') }}
            </BaseButton>
          </div>

          <div
            v-if="pickerLoading"
            class="d-flex align-center justify-center master-exam-picker__loading"
          >
            <BaseSkeleton :count="5" height="60px" stacked />
          </div>
          <div v-else class="master-exam-picker__list">
            <div
              v-for="q in pickerResults"
              :key="q.id"
              class="master-exam-picker__row"
              :class="{
                'master-exam-picker__row--selected': pickerSelected.has(q.id),
                'master-exam-picker__row--already-in': form.question_ids.includes(q.id),
              }"
              @click="togglePicker(q.id)"
            >
              <BaseCheckbox
                :model-value="pickerSelected.has(q.id)"
                :disabled="form.question_ids.includes(q.id)"
                @update:model-value="togglePicker(q.id)"
              />
              <div class="master-exam-picker__row-body">
                <div class="master-exam-picker__row-text">{{ q.question }}</div>
                <div class="master-exam-picker__row-meta">
                  <BaseBadge variant="secondary" small class="master-exam-picker__row-badge">
                    <i class="bi bi-speedometer"></i> {{ difficultyLabel(q.difficulty) }}
                  </BaseBadge>
                  <BaseBadge v-if="q.category_name" variant="info" small class="master-exam-picker__row-badge">
                    <i class="bi bi-folder2"></i> {{ q.category_name }}
                  </BaseBadge>
                  <BaseBadge
                    v-if="form.question_ids.includes(q.id)"
                    variant="success"
                    small
                    class="master-exam-picker__row-badge"
                  >
                    <i class="bi bi-check-lg"></i> {{ t('masterExams.pickerAlready') }}
                  </BaseBadge>
                </div>
              </div>
            </div>
            <BaseEmptyState
              v-if="pickerResults.length === 0"
              :title="t('masterExams.pickerEmpty')"
              :message="t('masterExams.pickerEmptyHint')"
              icon="bi-search"
            />
          </div>

          <div class="master-exam-picker__footer-info">
            <span>{{ t('masterExams.pickerSelected', { n: pickerSelected.size }) }}</span>
            <div class="d-flex gap-1">
              <BaseButton variant="secondary" @click="pickerOpen = false">{{
                t('common.cancel')
              }}</BaseButton>
              <BaseButton
                variant="primary"
                :disabled="pickerSelected.size === 0"
                @click="confirmPicker"
              >
                {{ t('masterExams.pickerAdd', { n: pickerSelected.size }) }}
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseModal>
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/master.css'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'
import DraftQuestionForm from '../components/DraftQuestionForm.vue'
import { useMasterExamEditor } from '../composables/useMasterExamEditor'

const { t } = useI18n()

const {
  router,
  masterExamStore,
  categoryStore,
  isEdit,
  isFrozen,
  form,
  questionsById,
  availableGroups,
  availableUsers,
  availableAttendings,
  availableCases,
  draftFormOpen,
  draftForm,
  pickerOpen,
  pickerSearch,
  pickerResults,
  pickerLoading,
  pickerSelected,
  difficultyLabel,
  moveUp,
  moveDown,
  moveTop,
  moveBottom,
  removeQuestion,
  loadExam,
  loadPicker,
  onPickerSearch,
  togglePicker,
  confirmPicker,
  addDraft,
  save,
} = useMasterExamEditor(t)

const audienceGroupOptions = computed(() => availableGroups.value.map(group => ({
  value: group.id,
  label: `${group.name} (${group.member_count})`,
})))
const audienceUserOptions = computed(() => availableUsers.value.map(user => ({
  value: user.id,
  label: user.full_name || user.username,
})))
const attendingOptions = computed(() => availableAttendings.value.map(user => ({
  value: user.id,
  label: user.full_name || user.username,
})))
</script>
