<!-- frontend/src/features/categories/components/CategoryCard.vue -->
<template>
<BaseCard
class="category-card"
:accent-color="category.color"
hover
tabindex="0"
role="button"
:aria-label="t('categories.editAria', { name: category.name })"
@keydown.enter="$emit('edit')"
>
<div class="category-card__content">
<div class="category-card__info">
<span class="category-card__icon" :style="{ color: category.color }"><i :class="`bi ${category.icon}`"></i></span>
<div>
<h4 class="category-card__name">{{ category.name }}</h4>
<p class="category-card__description">{{ category.description || t('categories.noDescription') }}</p>
<small class="category-card__meta">{{ t('categories.createdAt', { date: formatDate(category.created_at) }) }}</small>
</div>
</div>
<div v-if="isAdmin" class="category-card__actions">
<BaseIconButton icon="bi bi-pencil" :label="t('categories.editButtonAria')" @click="$emit('edit')" />
<BaseIconButton variant="danger" icon="bi bi-trash" :label="t('categories.deleteButtonAria')" @click="$emit('delete')" />
</div>
</div>
</BaseCard>
</template>

<script setup>
import { formatDate } from '@/utils/formatters'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'


const { t } = useI18n()

defineProps({
category: { type: Object, required: true },
isAdmin: { type: Boolean, default: false },
})

defineEmits(['edit', 'delete'])
</script>
