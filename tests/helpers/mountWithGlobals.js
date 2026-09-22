// frontend/tests/helpers/mountWithGlobals.js
//
// Shared mount wrapper for component tests.
//
// WHY THIS EXISTS
// ---------------
// Every component in this codebase calls `useI18n()`. A test that
// calls `mount(Component)` without installing the plugin throws
// "Need to install with `app.use` function" from vue-i18n's
// `useI18n`.
//
// This helper installs the two plugins every component test needs
// (i18n and a minimal router) and creates a fresh Pinia per mount.
//
// WHY IT IS SYNCHRONOUS
// ---------------------
// Vue Router's `router.push()` returns a promise, and awaiting it
// would force every caller to `await mountWithGlobals(...)` — which
// makes every `it` block async and, more importantly, is unnecessary
// because the mount does not depend on the navigation resolving.
// The push is fired and forgotten; the route resolves on its own
// microtask. Components using `<router-link>` will warn if the
// route has not resolved, but they still render — the target
// lookup falls through to a default href.

import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import ar from '@/i18n/locales/ar/index.js'
import en from '@/i18n/locales/en/index.js'

let _i18n = null
let _router = null

function ensurePlugins() {
  if (!_i18n) {
    _i18n = createI18n({
      legacy: false,
      globalInjection: true,
      locale: 'ar',
      fallbackLocale: 'en',
      messages: { ar, en },
      missingWarn: false,
      fallbackWarn: false,
    })
  }
  if (!_router) {
    _router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Dashboard', component: { template: '<div/>' } },
        { path: '/login', name: 'Login', component: { template: '<div/>' } },
        { path: '/questions', name: 'QuestionsList', component: { template: '<div/>' } },
        { path: '/questions/edit/:id', name: 'QuestionEdit', component: { template: '<div/>' } },
        { path: '/exam', name: 'ExamSetup', component: { template: '<div/>' } },
        { path: '/exam/question', name: 'ExamQuestion', component: { template: '<div/>' } },
        { path: '/exam/results', name: 'ExamResults', component: { template: '<div/>' } },
        { path: '/study', name: 'TestSetup', component: { template: '<div/>' } },
        { path: '/study/question', name: 'StudyQuestion', component: { template: '<div/>' } },
        { path: '/study/results', name: 'StudyResults', component: { template: '<div/>' } },
        { path: '/master-exams', name: 'MasterExamsList', component: { template: '<div/>' } },
        { path: '/admin/users', name: 'AdminUsers', component: { template: '<div/>' } },
        { path: '/:pathMatch(.*)*', name: 'NotFound', component: { template: '<div/>' } },
      ],
    })
  }
}

export function mountWithGlobals(Component, options = {}) {
  ensurePlugins()
  setActivePinia(createPinia())
  if (!_router.currentRoute.value.matched.length) {
    // Fire and forget. The route resolves on its own microtask;
    // the mount below does not depend on it.
    _router.push('/')
  }
  return mount(Component, {
    ...options,
    global: {
      plugins: [_i18n, _router],
      ...(options.global || {}),
    },
  })
}

export { mount }