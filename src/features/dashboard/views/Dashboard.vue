<!-- frontend/src/features/dashboard/views/Dashboard.vue -->
<template>
  <Layout>
    <PageShell :title="t('dashboard.title')" icon="bi bi-speedometer2" page-class="dashboard">
      <div class="dashboard__welcome" :class="{ 'dashboard__welcome--animated': bannerAnimated }">
        <h2>
          <i class="bi bi-hand-wave"></i> {{ t('dashboard.welcome', { name: authStore.fullName }) }}
        </h2>
        <p class="text-muted">{{ t('dashboard.overview') }}</p>
        <div
          v-if="daysSinceLastLogin !== null && daysSinceLastLogin > 0"
          class="welcome-back-banner"
        >
          <i class="bi bi-stars"></i>
          <span>{{
            t('dashboard.welcomeBack', {
              days: daysSinceLastLogin,
              count: authStore.user?.questions_count || 0,
            })
          }}</span>
        </div>
      </div>

      <FeedbackRegion :error="questionStore.error" @dismiss="questionStore.error = null" />
      <FeedbackRegion :error="bookmarkStore.error" @dismiss="bookmarkStore.error = null" />

      <section class="dashboard-section dashboard-section--today">
        <SectionHeader
          :title="t('dashboard.todayTitle')"
          :description="t('dashboard.todayDescription')"
          icon="bi bi-sun"
        />
        <BaseCard class="today-card" variant="primary">
          <div class="today-card__action">
            <div class="today-card__icon" aria-hidden="true">
              <i :class="todayAction.icon"></i>
            </div>
            <div class="today-card__copy">
              <span class="today-card__eyebrow">{{ t('dashboard.nextBestAction') }}</span>
              <h3>{{ todayAction.title }}</h3>
              <p>{{ todayAction.description }}</p>
            </div>
            <BaseButton
              variant="primary"
              :icon="todayAction.buttonIcon"
              :loading="todayAction.loading"
              @click="runTodayAction"
            >
              {{ todayAction.buttonLabel }}
            </BaseButton>
          </div>

          <div class="today-card__footer">
            <div class="today-card__progress">
              <span class="today-card__progress-title">{{ t('dashboard.todayProgress') }}</span>
              <ProgressBar :progress="todayProgressPercent" :label="todayProgressLabel" />
            </div>
            <div class="today-card__metric">
              <span class="today-card__metric-value">{{ groupStore.currentStreak }}</span>
              <span>{{ t('dashboard.todayStreakMetric') }}</span>
            </div>
          </div>
        </BaseCard>
      </section>

      <section
        v-if="masterExamStore.needsAckItems.length > 0"
        class="dashboard-section dashboard__master-exams"
      >
        <SectionHeader :title="t('dashboard.masterExamNeedsAck')" icon="bi bi-mortarboard" compact />
        <div class="master-exams-grid">
          <MasterExamCard
            v-for="exam in masterExamStore.needsAckItems"
            :key="exam.id"
            :exam="exam"
            context="participant"
            @action="handleMasterExamAction(exam, $event)"
          />
        </div>
      </section>

      <section class="dashboard-section">
        <SectionHeader
          :title="t('dashboard.studyModesTitle')"
          :description="t('dashboard.studyModesDescription')"
          icon="bi bi-journal-medical"
        />
        <div class="dashboard__tests">
          <button
            v-for="(test, idx) in testModes"
            :key="test.mode"
            type="button"
            class="test-card"
            :style="{ '--card-accent': test.color, '--i': idx }"
            @click="router.push(test.path)"
          >
            <div class="test-card__icon"><i :class="test.icon"></i></div>
            <div class="test-card__copy">
              <div class="test-card__title">{{ test.label }}</div>
              <div class="test-card__desc">{{ test.desc }}</div>
            </div>
            <i class="bi bi-chevron-right test-card__arrow" aria-hidden="true"></i>
          </button>
        </div>

        <div class="dashboard__actions" :aria-label="t('dashboard.secondaryActions')">
          <BaseButton variant="secondary" @click="router.push('/questions/add')">
            <i class="bi bi-plus-circle"></i> {{ t('nav.addQuestion') }}
          </BaseButton>
          <BaseButton variant="ghost" @click="router.push('/questions')">
            {{ t('nav.questions') }}
          </BaseButton>
          <BaseButton variant="ghost" @click="router.push('/questions/review')">
            {{ t('nav.review') }} ({{ unverifiedCount }})
          </BaseButton>
          <BaseButton v-if="weakCategories.length > 0" variant="ghost" @click="startWeakAreasDrill">
            {{ t('dashboard.weakCategoriesDrill') }}
          </BaseButton>
          <BaseButton variant="ghost" @click="router.push('/bookmarks')">
            {{ t('nav.bookmarks') }}
          </BaseButton>
        </div>
      </section>

      <section class="dashboard-section dashboard-section--secondary">
        <SectionHeader
          :title="t('dashboard.progressOverviewTitle')"
          :description="t('dashboard.progressOverviewDescription')"
          icon="bi bi-bar-chart"
        />

        <div v-if="wrongAnswerStore.summary" class="attempt-summary">
          <router-link to="/questions/mistakes" class="attempt-tile attempt-tile--open">
            <div class="attempt-tile__body">
              <div class="attempt-tile__value">{{ wrongAnswerStore.summary.wrong_open }}</div>
              <div class="attempt-tile__label">{{ t('dashboard.attemptOpen') }}</div>
            </div>
          </router-link>
          <router-link to="/questions/fragile" class="attempt-tile attempt-tile--fragile">
            <div class="attempt-tile__body">
              <div class="attempt-tile__value">{{ wrongAnswerStore.summary.fragile_correct }}</div>
              <div class="attempt-tile__label">{{ t('dashboard.attemptFragile') }}</div>
            </div>
          </router-link>
          <div class="attempt-tile attempt-tile--mastered attempt-tile--static">
            <div class="attempt-tile__body">
              <div class="attempt-tile__value">{{ wrongAnswerStore.summary.ever_correct }}</div>
              <div class="attempt-tile__label">{{ t('dashboard.attemptMastered') }}</div>
            </div>
          </div>
          <div class="attempt-tile attempt-tile--seen attempt-tile--static">
            <div class="attempt-tile__body">
              <div class="attempt-tile__value">{{ wrongAnswerStore.summary.total_seen }}</div>
              <div class="attempt-tile__label">{{ t('dashboard.attemptSeen') }}</div>
            </div>
          </div>
        </div>

        <div class="stat-grid dashboard__stat-grid">
          <StatTile :value="questionStore.pagination.total || 0" :label="t('dashboard.statTotal')" />
          <StatTile :value="verifiedCount" :label="t('dashboard.statVerified')" />
          <StatTile :value="unverifiedCount" :label="t('dashboard.statUnverified')" />
          <StatTile :value="bookmarkCount" :label="t('dashboard.statBookmarks')" />
        </div>
      </section>

      <section v-if="questionStore.items.length" class="dashboard-section dashboard__recent">
        <SectionHeader
          :title="t('dashboard.recentQuestions')"
          :description="t('dashboard.recentQuestionsDescription')"
          icon="bi bi-clock-history"
        />
        <BaseListContainer
          :loading="questionStore.isLoading"
          :error="questionStore.error"
          :items="questionStore.items.slice(0, 5)"
          :empty-title="t('dashboard.noRecentQuestions')"
          empty-icon="bi-question-circle"
          @retry="fetchData"
        >
          <template #default="{ items }">
            <QuestionCard
              v-for="q in items"
              :key="q.id"
              :question="q"
              :bookmarked="bookmarkedIds.includes(q.id)"
              @bookmark="handleBookmark(q.id)"
              @edit="router.push(`/questions/edit/${q.id}`)"
              @delete="handleDelete(q.id)"
              @verify="handleVerify(q.id)"
            />
          </template>
        </BaseListContainer>
      </section>

      <section v-if="groupStore.heatmap" class="dashboard-section dashboard-section--secondary">
        <StudyActivityHeatmap :data="groupStore.heatmap" class="dashboard__heatmap" />
      </section>

      <div v-if="currentTip" :key="tipKey" class="dashboard__tip">
        <i class="bi bi-lightbulb"></i>
        <span><strong>{{ t('dashboard.didYouKnow') }}</strong> {{ currentTip }}</span>
      </div>
    </PageShell>
  </Layout>
</template>

<script setup>
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import QuestionCard from '@/features/questions/components/QuestionCard.vue'
import MasterExamCard from '@/features/masterExams/components/MasterExamCard.vue'
import StudyActivityHeatmap from '@/components/dashboard/StudyActivityHeatmap.vue'
import StatTile from '@/components/base/StatTile.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'
import SectionHeader from '@/components/common/SectionHeader.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { useDashboardController } from '../composables/useDashboardController'

const {
  t,
  router,
  authStore,
  questionStore,
  bookmarkStore,
  groupStore,
  wrongAnswerStore,
  masterExamStore,
  bannerAnimated,
  bookmarkedIds,
  verifiedCount,
  unverifiedCount,
  bookmarkCount,
  weakCategories,
  daysSinceLastLogin,
  todayAction,
  todayProgressPercent,
  todayProgressLabel,
  testModes,
  currentTip,
  tipKey,
  runTodayAction,
  handleBookmark,
  handleDelete,
  handleVerify,
  startWeakAreasDrill,
  handleMasterExamAction,
  fetchData,
} = useDashboardController()
</script>
