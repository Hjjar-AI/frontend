<!-- frontend/src/features/groups/views/MyGroups.vue -->
<!-- FEATURE #9 — member-facing groups + leaderboard. -->
<template>
  <Layout>
    <PageShell :title="t('groups.title')" icon="bi bi-people-fill" page-class="groups-page">
        <template #badges>
          <BaseBadge variant="info">{{ t('groups.badge', { count: groupStore.myGroupCount }) }}</BaseBadge>
        </template>
      <AsyncContent
        :loading="groupStore.isLoading && groupStore.myGroups.length === 0"
        :error="groupStore.error || ''"
        :empty="!groupStore.isLoading && groupStore.myGroups.length === 0"
        :empty-title="t('groups.empty')"
        :empty-message="t('groups.emptyDesc')"
        empty-icon="bi-people"
        @retry="loadGroups"
      >
        <div class="groups-grid">
          <div
            v-for="group in groupStore.myGroups"
            :key="group.id"
            class="group-card"
            @click="selectGroup(group.id)"
          >
            <div class="group-card__header">
              <div class="group-card__icon">
                <i class="bi bi-people-fill"></i>
              </div>
              <div class="group-card__title">
                <h4 class="group-card__name">{{ group.name }}</h4>
                <span class="group-card__meta">{{ t('groups.membersCount', { count: group.member_count }) }}</span>
              </div>
            </div>
            <p v-if="group.description" class="group-card__description">
              {{ group.description }}
            </p>
          </div>
        </div>

        <BaseCard
          v-if="selectedGroupId"
          class="groups-page__leaderboard-card"
        >
          <CardHeader
            :title="t('groups.leaderboardLast', { name: selectedGroupName, days: currentDays })"
            icon="bi bi-trophy"
          >
            <template #actions>
              <BaseSelect
                :model-value="currentDays"
                @update:model-value="changeDays"
                :options="dayOptions"
                class="groups-page__leaderboard-period"
              />
            </template>
          </CardHeader>

          <div class="group-visibility-row">
            <BaseCheckbox
              :model-value="!isHidden"
              @update:model-value="toggleVisibility"
              :label="t('groups.visibilityToggle')"
            />
            <span class="text-muted group-visibility-row__hint">
              {{ t('groups.visibilityHint') }}
            </span>
          </div>

          <BaseListContainer
            :loading="groupStore.isLoading"
            :items="leaderboardRows"
            :empty-title="t('groups.leaderboardEmpty')"
            :empty-message="t('groups.leaderboardEmptyDesc')"
            empty-icon="bi-bar-chart"
          >
            <template #default="{ items }">
              <BaseTableShell density="compact" striped>
                <table class="table-shared leaderboard">
                  <thead>
                    <tr>
                      <th class="leaderboard__rank">{{ t('groups.colRank') }}</th>
                      <th>{{ t('groups.colName') }}</th>
                      <th>{{ t('groups.colQuestions') }}</th>
                      <th>{{ t('groups.colAccuracy') }}</th>
                      <th>{{ t('groups.colStreak') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in items"
                      :key="row.user_id"
                      :class="{ 'leaderboard__self': row.user_id === currentUserId }"
                    >
                      <td class="leaderboard__rank" :class="rankClass(row.rank)">
                        <span v-if="row.rank === 1">🥇</span>
                        <span v-else-if="row.rank === 2">🥈</span>
                        <span v-else-if="row.rank === 3">🥉</span>
                        <span v-else>{{ row.rank }}</span>
                      </td>
                      <td class="leaderboard__name">
                        {{ row.full_name }}

                        <span
                          v-if="row.user_id === currentUserId"
                          class="leaderboard__self-marker"
                        >({{ t('groups.self') }})</span>
                      </td>
                      <td>{{ row.questions_answered }}</td>
                      <td class="leaderboard__accuracy" :class="accuracyClass(row.accuracy)">
                        {{ row.accuracy }}%
                      </td>
                      <td>
                        <span v-if="row.current_streak > 0" class="leaderboard__streak">
                          🔥 {{ row.current_streak }}
                        </span>
                        <span v-else class="text-muted">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </BaseTableShell>
            </template>
          </BaseListContainer>
        </BaseCard>
      </AsyncContent>
    </PageShell>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import AsyncContent from '@/components/common/AsyncContent.vue'
import CardHeader from '@/components/common/CardHeader.vue'
import BaseTableShell from '@/components/common/BaseTableShell.vue'
import { useGroupStore } from '@/stores/groupStore'
import { useAuthStore } from '@/stores/authStore'

const { t } = useI18n()

const groupStore = useGroupStore()
const authStore = useAuthStore()

const selectedGroupId = ref(null)
const currentDays = ref(7)

const dayOptions = computed(() => [
  { value: 7,  label: t('groups.days7') },
  { value: 30, label: t('groups.days30') },
  { value: 90, label: t('groups.days90') },
])

const currentUserId = computed(() => authStore.user?.id || null)

const selectedGroupName = computed(() => {
  const g = groupStore.myGroups.find(g => g.id === selectedGroupId.value)
  return g ? g.name : ''
})

const leaderboardRows = computed(() => {
  if (!selectedGroupId.value) return []
  const entry = groupStore.leaderboards[selectedGroupId.value]
  return entry ? entry.rows : []
})

const isHidden = computed(() => {
  if (!selectedGroupId.value) return false
  return groupStore.visibilityByGroupId[selectedGroupId.value] === false
})

function rankClass(rank) {
  if (rank === 1) return 'leaderboard__rank--gold'
  if (rank === 2) return 'leaderboard__rank--silver'
  if (rank === 3) return 'leaderboard__rank--bronze'
  return ''
}

function accuracyClass(acc) {
  if (acc >= 80) return 'leaderboard__accuracy--great'
  if (acc >= 50) return 'leaderboard__accuracy--ok'
  return 'leaderboard__accuracy--low'
}

async function loadGroups() {
  await groupStore.fetchMyGroups()
  if (!selectedGroupId.value && groupStore.myGroups.length > 0) {
    selectGroup(groupStore.myGroups[0].id)
  }
}

async function selectGroup(groupId) {
  selectedGroupId.value = groupId
  await groupStore.fetchLeaderboard(groupId, currentDays.value)
}

async function changeDays(days) {
  currentDays.value = days
  if (selectedGroupId.value) {
    await groupStore.fetchLeaderboard(selectedGroupId.value, days)
  }
}

async function toggleVisibility(visible) {
  if (!selectedGroupId.value) return
  await groupStore.setVisibility(selectedGroupId.value, visible)
  await groupStore.fetchLeaderboard(selectedGroupId.value, currentDays.value)
}

onMounted(loadGroups)
</script>
