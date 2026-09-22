<!-- frontend/src/features/categories/views/Categories.vue -->
<template>
  <Layout>
    <div class="categories-page">
      <PageHeader :title="t('categories.title')" icon="bi bi-folder2-open">
        <template #actions>
          <BaseButton
            v-if="authStore.can('categories.manage')"
            variant="primary"
            @click="openAddModal"
          >
            <i class="bi bi-plus-circle"></i> {{ t('categories.addButton') }}
          </BaseButton>
        </template>
      </PageHeader>

      <ErrorBanner
        :error="categoryStore.error"
        :retry="categoryStore.error ? true : false"
        @dismiss="categoryStore.error = null"
        @retry="fetchCategories"
      />

      <BaseListContainer
        :loading="categoryStore.isLoading"
        :error="categoryStore.error"
        :items="categoryStore.items"
        :empty-title="t('categories.empty')"
        empty-icon="bi-folder2-open"
        @retry="fetchCategories"
      >
        <template #emptyActions v-if="authStore.can('categories.manage')">
          <BaseButton variant="primary" @click="openAddModal">
            <i class="bi bi-plus-circle"></i> {{ t('categories.addButton') }}
          </BaseButton>
        </template>
        <template #default="{ items }">
          <div class="categories-page__grid stagger-list">
            <CategoryCard
              v-for="cat in items"
              :key="cat.id"
              :category="cat"
              :is-admin="authStore.can('categories.manage')"
              @edit="openEditModal(cat)"
              @delete="handleDelete(cat.id)"
            />
          </div>
        </template>
      </BaseListContainer>
    </div>
    <CategoryForm ref="categoryFormRef" @saved="handleCategorySaved" />
  </Layout>
</template>

<script setup>
import '@/assets/categories.css'
import { ref, onMounted } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import CategoryCard from '../components/CategoryCard.vue'
import CategoryForm from '../components/CategoryForm.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { useAuthStore } from '@/stores/authStore'
import { confirmAction } from '@/composables/confirmAction'

const { t } = useI18n()

const categoryStore = useCategoryStore()
const authStore = useAuthStore()
const categoryFormRef = ref(null)

const openAddModal = () => { categoryFormRef.value?.open() }
const openEditModal = (category) => { categoryFormRef.value?.open(category) }
const fetchCategories = () => categoryStore.fetchAll()

const handleDelete = async (id) => {
  const category = categoryStore.items.find(c => c.id === id)
  const name = category?.name || t('categories.title')
  await confirmAction({
    message: t('categories.deleteConfirm', { name }),
    action: () => categoryStore.remove(id),
  })
  await fetchCategories()
}

const handleCategorySaved = () => { fetchCategories() }

onMounted(fetchCategories)
</script>