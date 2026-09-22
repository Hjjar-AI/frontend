<!-- frontend/src/App.vue -->
<template>
  <div id="app">
    
    <a href="#main-content" class="skip-link">{{ t('a11y.skipLink') }}</a>
    <Transition name="banner">
      <div v-if="!isOnline" class="offline-banner">
        <i class="bi bi-wifi-off"></i>
        <span>{{ t('app.offline') }}</span>
      </div>
    </Transition>
    <div id="a11y-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>
    <ErrorBoundary>
      <router-view v-slot="{ Component, route }">
        <transition :name="route.meta.transition || 'page-fade'" mode="out-in">
          <component :is="Component" :is-navigating="isNavigating" />
        </transition>
      </router-view>
    </ErrorBoundary>
    <ToastContainer />
    <AppDialogs />
    <ScrollToTop />
  </div>
</template>

<script setup>

import { ref, onErrorCaptured } from 'vue'
import { useOnline } from '@/composables/useOnline'
import { setNavigatingRef } from '@/router/guards'
import AppDialogs from '@/components/common/AppDialogs.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

const { t } = useI18n()
const { isOnline } = useOnline()
const isNavigating = ref(false)
setNavigatingRef(isNavigating)

onErrorCaptured((err) => {
  console.error('App-level error (ErrorBoundary may have failed):', err)
  return false
})
</script>