<!-- frontend/src/features/dashboard/views/Dashboard.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('dashboard.title')"
      icon="bi bi-speedometer2"
      page-class="dashboard"
    >

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

      <!-- Unified Study Now queue -->
      <BaseCard class="dashboard__study-now">
        <div class="study-now-card">
          <div class="study-now-card__icon">
            <i class="bi bi-lightning-charge-fill"></i>
          </div>
          <div class="study-now-card__body">
            <h3 class="study-now-card__title">{{ t('dashboard.studyNow') }}</h3>
            <p class="study-now-card__desc">{{ t('dashboard.studyNowDesc') }}</p>
            <div v-if="studyNowBreakdownLine" class="study-now-card__breakdown">
              <i class="bi bi-info-circle"></i>
              <span>{{ studyNowBreakdownLine }}</span>
            </div>
          </div>
          <BaseButton
            variant="primary"
            :loading="wrongAnswerStore.isStudyNowLoading"
            @click="startStudyNow"
          >
            <i class="bi bi-play-circle"></i> {{ t('dashboard.startButton') }}
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Master exam cards -->
      <section
        v-if="masterExamStore.needsAckItems.length > 0"
        class="dashboard__master-exams"
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

      <!-- Streak card -->
      <div class="streak-card" :class="{ 'streak-card--empty': !groupStore.currentStreak }">
        <div class="streak-card__flame">🔥</div>
        <div class="streak-card__body">
          <div class="streak-card__current">{{ groupStore.currentStreak }}</div>
          <div class="streak-card__label">
            {{
              groupStore.currentStreak > 0
                ? t('dashboard.streakDays', { count: groupStore.currentStreak })
                : t('dashboard.startStreak')
            }}
          </div>
          <div v-if="groupStore.longestStreak > 0" class="streak-card__best">
            <i class="bi bi-trophy"></i>
            {{ t('dashboard.longestStreak', { days: groupStore.longestStreak }) }}
          </div>
        </div>
      </div>

      <!-- SRS due card -->
      <div v-if="wrongAnswerStore.srsDueCount > 0" class="srs-card">
        <div class="srs-card__icon">
          <i class="bi bi-arrow-repeat"></i>
        </div>
        <div class="srs-card__body">
          <h3 class="srs-card__title">
            <span class="srs-card__count">{{ wrongAnswerStore.srsDueCount }}</span>
            {{ t('dashboard.srsDue', { count: wrongAnswerStore.srsDueCount }) }}
          </h3>
          <p class="srs-card__subtitle">{{ t('dashboard.srsDesc') }}</p>
        </div>
        <BaseButton variant="primary" @click="startSRS" :loading="testSessionStore.isLoading">
          <i class="bi bi-play-circle"></i> {{ t('dashboard.srsStart') }}
        </BaseButton>
      </div>

      <BaseCard v-if="resumableSession" class="dashboard__continue">
        <div class="continue-card">
          <div class="continue-card__ring">
            <svg class="progress-ring" viewBox="0 0 36 36">
              <path
                class="progress-ring__bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                class="progress-ring__circle"
                :stroke-dasharray="`${resumableSession.progress}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span class="continue-card__ring-text">{{ resumableSession.progress }}%</span>
          </div>
          <div class="continue-card__info">
            <h3>{{ t('dashboard.continue') }}</h3>
            <p class="text-muted">
              {{
                t('dashboard.continueAt', {
                  current: resumableSession.currentIndex + 1,
                  total: resumableSession.totalQuestions,
                })
              }}
            </p>
          </div>
          <BaseButton variant="primary" @click="resume(resumableSession.mode)">
            <i class="bi bi-play-circle"></i> {{ t('dashboard.resume') }}
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Attempt summary tiles -->
      <div v-if="wrongAnswerStore.summary" class="attempt-summary">
        <router-link
          to="/questions/mistakes"
          class="attempt-tile attempt-tile--open"
        >
          <div class="attempt-tile__icon"><i class="bi bi-journal-x"></i></div>
          <div class="attempt-tile__body">
            <div class="attempt-tile__value">{{ wrongAnswerStore.summary.wrong_open }}</div>
            <div class="attempt-tile__label">{{ t('dashboard.attemptOpen') }}</div>
          </div>
        </router-link>
        <router-link
          to="/questions/fragile"
          class="attempt-tile attempt-tile--fragile"
        >
          <div class="attempt-tile__icon"><i class="bi bi-shield-slash"></i></div>
          <div class="attempt-tile__body">
            <div class="attempt-tile__value">{{ wrongAnswerStore.summary.fragile_correct }}</div>
            <div class="attempt-tile__label">{{ t('dashboard.attemptFragile') }}</div>
          </div>
        </router-link>
        <div class="attempt-tile attempt-tile--mastered attempt-tile--static">
          <div class="attempt-tile__icon"><i class="bi bi-check-circle"></i></div>
          <div class="attempt-tile__body">
            <div class="attempt-tile__value">{{ wrongAnswerStore.summary.ever_correct }}</div>
            <div class="attempt-tile__label">{{ t('dashboard.attemptMastered') }}</div>
          </div>
        </div>
        <div class="attempt-tile attempt-tile--seen attempt-tile--static">
          <div class="attempt-tile__icon"><i class="bi bi-eye"></i></div>
          <div class="attempt-tile__body">
            <div class="attempt-tile__value">{{ wrongAnswerStore.summary.total_seen }}</div>
            <div class="attempt-tile__label">{{ t('dashboard.attemptSeen') }}</div>
          </div>
        </div>
      </div>

      <!-- Test mode cards -->
      <div class="dashboard__tests">
        <div
          v-for="(test, idx) in testModes"
          :key="test.mode"
          class="test-card"
          :style="{ '--card-accent': test.color, '--i': idx }"
          @click="router.push(test.path)"
        >
          <div class="test-card__icon"><i :class="test.icon"></i></div>
          <div class="test-card__title">{{ test.label }}</div>
          <div class="test-card__desc">{{ test.desc }}</div>
        </div>
      </div>

      <div class="stat-grid">
        <StatTile :value="questionStore.pagination.total || 0" :label="t('dashboard.statTotal')" />
        <StatTile :value="verifiedCount" :label="t('dashboard.statVerified')" />
        <StatTile :value="unverifiedCount" :label="t('dashboard.statUnverified')" />
        <StatTile :value="bookmarkCount" :label="t('dashboard.statBookmarks')" />
      </div>

      <div v-if="currentTip" class="dashboard__tip" :key="tipKey">
        <i class="bi bi-lightbulb"></i>
        <span
          ><strong>{{ t('dashboard.didYouKnow') }}</strong> {{ currentTip }}</span
        >
      </div>

      <div class="dashboard__actions">
        <BaseButton variant="primary" @click="router.push('/questions/add')">
          <i class="bi bi-plus-circle"></i> {{ t('nav.addQuestion') }}
        </BaseButton>
        <BaseButton variant="secondary" @click="router.push('/questions')">
          <i class="bi bi-list"></i> {{ t('nav.questions') }}
        </BaseButton>
        <BaseButton variant="secondary" @click="router.push('/questions/review')">
          <i class="bi bi-check2-all"></i> {{ t('nav.review') }} ({{ unverifiedCount }})
        </BaseButton>
        <BaseButton v-if="weakCategories.length > 0" variant="secondary" @click="startWeakAreasDrill">
          <i class="bi bi-graph-down"></i> {{ t('dashboard.weakCategoriesDrill') }}
        </BaseButton>
        <BaseButton variant="secondary" @click="router.push('/bookmarks')">
          <i class="bi bi-bookmark-heart"></i> {{ t('nav.bookmarks') }}
        </BaseButton>
      </div>

      <div v-if="questionStore.items.length" class="dashboard__recent">
        <SectionHeader :title="t('dashboard.recentQuestions')" icon="bi bi-clock-history" compact />
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
      </div>

      <StudyActivityHeatmap
        v-if="groupStore.heatmap"
        :data="groupStore.heatmap"
        class="dashboard__heatmap"
      />
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
import { useDashboardController } from '../composables/useDashboardController'

const {
  t,
  router,
  authStore,
  questionStore,
  bookmarkStore,
  testSessionStore,
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
  resumableSession,
  studyNowBreakdownLine,
  testModes,
  currentTip,
  tipKey,
  startStudyNow,
  resume,
  handleBookmark,
  handleDelete,
  handleVerify,
  startSRS,
  startWeakAreasDrill,
  handleMasterExamAction,
  fetchData,
} = useDashboardController()
</script>
