<!-- frontend/src/components/markdown/MarkdownToolbar.vue -->
<template>
  <div class="markdown-toolbar">
    <BaseButton
      v-for="btn in buttons"
      :key="btn.action"
      class="btn-icon"
      variant="ghost"
      size="small"
      icon-only
      :icon="btn.icon || ''"
      :title="btn.title"
      :aria-label="btn.title"
      @click="$emit('insert', btn.action)"
    >
      <span v-if="!btn.icon">{{ btn.label }}</span>
    </BaseButton>
    <router-link
      to="/manual#markdown"
      class="markdown-toolbar__help"
      :title="t('markdown.helpLink')"
      :aria-label="t('markdown.helpLinkAria')"
    >
      <i class="bi bi-question-circle"></i>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'


const { t } = useI18n()

const buttons = computed(() => [
  { action: 'bold',          label: 'B',    title: t('markdown.toolbar.bold') },
  { action: 'italic',        label: 'I',    title: t('markdown.toolbar.italic') },
  { action: 'underline',     label: 'U',    title: t('markdown.toolbar.underline') },
  { action: 'strikethrough', label: 'S',    title: t('markdown.toolbar.strikethrough') },
  { action: 'superscript',   label: 'x²',   title: t('markdown.toolbar.superscript') },
  { action: 'subscript',     label: 'x₂',   title: t('markdown.toolbar.subscript') },
  { action: 'highlight',     label: 'H',    title: t('markdown.toolbar.highlight') },
  { action: 'code',          label: '‹/›',  title: t('markdown.toolbar.code') },
  { action: 'link',          icon: 'bi bi-link-45deg', title: t('markdown.toolbar.link') },
  { action: 'image',         icon: 'bi bi-image',      title: t('markdown.toolbar.image') },
  { action: 'table',         icon: 'bi bi-table',      title: t('markdown.toolbar.table') },
  { action: 'ul',            icon: 'bi bi-list-ul',    title: t('markdown.toolbar.ul') },
  { action: 'ol',            icon: 'bi bi-list-ol',    title: t('markdown.toolbar.ol') },
])

defineEmits(['insert'])
</script>
