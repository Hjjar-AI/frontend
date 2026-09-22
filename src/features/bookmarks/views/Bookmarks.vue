<!-- frontend/src/features/bookmarks/views/Bookmarks.vue -->
<template>
  <Layout>
    <div class="bookmarks-page">
      <BaseCard>
        <PageHeader :title="t('questions.bookmarksTitle')" icon="bi bi-bookmark-heart-fill">
          <template #actions>
            <!-- MERGE: single study button replaces the two old buttons -->
            <BaseButton variant="success" size="small" @click="startFromBookmarks">
              <i class="bi bi-book-half"></i> {{ t('questions.startFromBookmarks') }}
            </BaseButton>
          </template>
        </PageHeader>

        <ErrorBanner
          :error="bookmarkStore.error || questionStore.error"
          :retry="bookmarkStore.error || questionStore.error ? true : false"
          @dismiss="dismissErrors"
          @retry="loadBookmarks"
        />

        <BaseListContainer
          :loading="bookmarkStore.isLoading"
          :items="questions"
          :empty-title="t('questions.emptyBookmarks')"
          empty-icon="bi-bookmark-heart"
        >
          <template #emptyActions>
            <BaseButton variant="primary" @click="router.push('/questions')">
              {{ t('questions.browseQuestions') }}
            </BaseButton>
          </template>
          <template #default="{ items }">
            <div class="bookmarks-page__list">
              <QuestionCard
                v-for="q in items"
                :key="q.id"
                :question="q"
                :bookmarked="true"
                @bookmark="handleBookmark(q.id)"
                @edit="router.push(`/questions/edit/${q.id}`)"
                @delete="handleDelete(q.id)"
                @verify="handleVerify(q.id)"
              />
            </div>
          </template>
        </BaseListContainer>
      </BaseCard>
    </div>
  </Layout>
</template>

<script setup>
import '@/assets/bookmarks.css'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import QuestionCard from '@/features/questions/components/QuestionCard.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useDialog } from '@/composables/useDialog'

const { t } = useI18n()

const router = useRouter()
const bookmarkStore = useBookmarkStore()
const questionStore = useQuestionStore()
const { confirm } = useDialog()
const questions = ref([])

function dismissErrors() {
  bookmarkStore.error = null
  questionStore.error = null
}

async function loadBookmarks() {
  await bookmarkStore.fetchBookmarks()
  const ids = bookmarkStore.bookmarkedIds
  if (ids.length === 0) {
    questions.value = []
    return
  }
  try {
    const CHUNK_SIZE = 500
    const items = []
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const response = await questionStore.fetchBatch(ids.slice(i, i + CHUNK_SIZE))
      items.push(...(response.items || []))
    }
    questions.value = items
  } catch {
    questions.value = []
  }
}

async function handleBookmark(id) {
  const result = await bookmarkStore.toggle(id)
  if (result && result.added === false) {
    questions.value = questions.value.filter((q) => q.id !== id)
  }
}

async function handleDelete(id) {
  if (!(await confirm(t('questions.deleteConfirm')))) return
  await questionStore.remove(id)
  questions.value = questions.value.filter((q) => q.id !== id)
}

async function handleVerify(id) {
  await questionStore.toggleVerify(id)
  const q = await questionStore.fetchOne(id)
  if (q) {
    const idx = questions.value.findIndex((item) => item.id === id)
    if (idx !== -1) questions.value[idx] = q
  }
}

function startFromBookmarks() {
  router.push({ path: '/study', query: { use_bookmarks: 'on' } })
}

onMounted(loadBookmarks)
</script>
