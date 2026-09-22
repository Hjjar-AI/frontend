<!-- frontend/src/features/masterExams/views/MasterExamEditor.vue -->
<template>
  <Layout>
    <div class="master-exam-editor">
      <PageHeader
        :title="isEdit ? t('masterExams.editTitle') : t('masterExams.newTitle')"
        icon="bi bi-pencil-square"
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
      </PageHeader>

      <div
        v-if="isFrozen"
        class="master-exam-runner__preview-banner master-exam-editor__frozen-banner"
      >
        <i class="bi bi-lock"></i>
        <span>{{ t('masterExams.frozen') }}</span>
      </div>

      <ErrorBanner
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
        <BaseField v-slot="{ id, describedBy }" :label="t('masterExams.instructions')">
          <textarea
            :id="id"
            :aria-describedby="describedBy"
            v-model="form.instructions"
            class="form-control"
            rows="3"
            :disabled="isFrozen"
          ></textarea>
        </BaseField>
      </BaseCard>

      <BaseCard>
        <h3 class="master-exam-editor__section-title">
          <i class="bi bi-calendar-event"></i>
          {{ t('masterExams.sectionSchedule') }}
        </h3>
        <FormGrid>
          <BaseField v-slot="{ id }" :label="t('masterExams.opensAt')">
            <input
              :id="id"
              type="datetime-local"
              v-model="form.opens_at_local"
              class="form-control"
              :disabled="isFrozen"
            />
          </BaseField>
          <BaseField v-slot="{ id }" :label="t('masterExams.closesAt')">
            <input
              :id="id"
              type="datetime-local"
              v-model="form.closes_at_local"
              class="form-control"
              :disabled="isFrozen"
            />
          </BaseField>
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
        <BaseField v-slot="{ id }" :label="t('masterExams.audienceGroups')">
          <select
            :id="id"
            v-model="form.audience_group_ids"
            class="form-control"
            multiple
            :disabled="isFrozen"
          >
            <option v-for="g in availableGroups" :key="g.id" :value="g.id">
              {{ g.name }} ({{ g.member_count }})
            </option>
          </select>
        </BaseField>
        <BaseField v-slot="{ id }" :label="t('masterExams.audienceUsers')">
          <select
            :id="id"
            v-model="form.audience_user_ids"
            class="form-control"
            multiple
            :disabled="isFrozen"
          >
            <option v-for="u in availableUsers" :key="u.id" :value="u.id">
              {{ u.full_name || u.username }}
            </option>
          </select>
        </BaseField>
        <BaseField v-slot="{ id }" :label="t('masterExams.coAttendings')">
          <select
            :id="id"
            v-model="form.co_attending_ids"
            class="form-control"
            multiple
            :disabled="isFrozen"
          >
            <option v-for="u in availableAttendings" :key="u.id" :value="u.id">
              {{ u.full_name || u.username }}
            </option>
          </select>
        </BaseField>
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
              <button
                type="button"
                :disabled="idx === 0 || isFrozen"
                @click="moveUp(idx)"
                :aria-label="t('masterExams.moveUpAria')"
              >
                <i class="bi bi-chevron-up"></i>
              </button>
              <button
                type="button"
                :disabled="idx === form.question_ids.length - 1 || isFrozen"
                @click="moveDown(idx)"
                :aria-label="t('masterExams.moveDownAria')"
              >
                <i class="bi bi-chevron-down"></i>
              </button>
            </div>
            <div class="master-exam-question-row__reorder">
              <button
                type="button"
                :disabled="idx === 0 || isFrozen"
                @click="moveTop(idx)"
                :aria-label="t('masterExams.moveTopAria')"
              >
                <i class="bi bi-chevron-double-up"></i>
              </button>
              <button
                type="button"
                :disabled="idx === form.question_ids.length - 1 || isFrozen"
                @click="moveBottom(idx)"
                :aria-label="t('masterExams.moveBottomAria')"
              >
                <i class="bi bi-chevron-double-down"></i>
              </button>
            </div>
            <span class="master-exam-question-row__index">{{ idx + 1 }}</span>
            <div class="master-exam-question-row__body">
              <p class="master-exam-question-row__text">
                {{ questionsById[qid]?.question || `#${qid}` }}
              </p>
              <div class="master-exam-question-row__meta">
                <span
                  v-if="questionsById[qid]?.is_draft"
                  class="master-exam-question-row__draft-badge"
                >
                  <i class="bi bi-pencil"></i> {{ t('masterExams.draftBadge') }}
                </span>
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
              <button
                type="button"
                class="danger"
                :disabled="isFrozen"
                @click="removeQuestion(idx)"
                :aria-label="t('masterExams.removeQuestionAria')"
              >
                <i class="bi bi-x-lg"></i>
              </button>
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
            variant="warning"
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
            <button
              class="btn-icon"
              @click="draftFormOpen = false"
              :aria-label="t('masterExams.closeDraftFormAria')"
            >
              <i class="bi bi-x-lg"></i>
            </button>
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
              @update:model-value="onPickerSearch"
              :placeholder="t('masterExams.pickerSearch')"
              class="master-exam-picker__search"
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
                  <span class="master-exam-picker__row-badge">
                    <i class="bi bi-speedometer"></i> {{ difficultyLabel(q.difficulty) }}
                  </span>
                  <span v-if="q.category_name" class="master-exam-picker__row-badge">
                    <i class="bi bi-folder2"></i> {{ q.category_name }}
                  </span>
                  <span
                    v-if="form.question_ids.includes(q.id)"
                    class="master-exam-picker__row-badge"
                  >
                    <i class="bi bi-check-lg"></i> {{ t('masterExams.pickerAlready') }}
                  </span>
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
    </div>
  </Layout>
</template>

<script setup>
import '@/assets/master.css'
import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseField from '@/components/base/BaseField.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
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
</script>
