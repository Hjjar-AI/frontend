<!-- frontend/src/features/testCommon/TestSetupPage.vue -->
<template>
  <TestSetup
    :mode="routeMode"
    :has-saved-progress="store.isActive || store.questionIds.length > 0"
    :loading="isLoading"
    :max-available="maxAvailable"
    :initial-use-bookmarks="initialUseBookmarks"
    @max-update="maxAvailable = $event"
    @start="start"
    @resume="resume"
    @discard="discardProgress"
    @update:mode="onModeChange"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TestSetup from './TestSetup.vue'
import { useTestPage } from '@/composables/useTestPage'
import { useTestSessionStore } from '@/stores/testSessionStore'

const props = defineProps({
  mode: { type: String, required: true },
})

const router = useRouter()
const route = useRoute()
const testSessionStore = useTestSessionStore()

// Local mode ref, seeded from the route-derived prop. This is the
// single source of truth for `useTestPage`, and it also stays in
// sync with the URL when the user toggles mode inside the unified
// setup form.
const routeMode = ref(props.mode)

// Keep local mode in sync if the user arrives via a route change
// (e.g. mobile nav /exam → desktop nav /study).
watch(() => props.mode, (m) => {
  if (m !== routeMode.value) routeMode.value = m
})

const { store, isLoading, start, resume, discardProgress } = useTestPage(
  () => routeMode.value
)

const maxAvailable = ref(0)
const initialUseBookmarks = computed(() => route.query.use_bookmarks === 'on')

watch(() => routeMode.value, (newMode) => {
  store.prepareForMode(newMode)
  maxAvailable.value = 0
}, { immediate: true })

if (store.sessionId && !store.isActive && store.questionIds.length === 0) {
  store.restoreFullState().catch(() => {})
}

// The unified setup component emits `update:mode` when the user
// toggles the radio. Reflect that into the URL so deep links and
// back/forward remain meaningful. `router.replace` (not push) so a
// toggle does not pollute the history stack — back should go to the
// previous page, not to the previous mode.
function onModeChange(next) {
  if (next === routeMode.value) return
  routeMode.value = next
  const target = `/${next}`
  if (route.path !== target) {
    router.replace({ path: target, query: route.query })
  }
}
</script>
