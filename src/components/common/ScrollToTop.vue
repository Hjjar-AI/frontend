<!-- frontend/src/components/common/ScrollToTop.vue -->
<template>
  <BaseIconButton
    v-show="visible"
    class="scroll-to-top"
    icon="bi bi-arrow-up"
    :label="t('ui.goToTop')"
    @click="scrollToTop"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'

const { t } = useI18n()

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>
