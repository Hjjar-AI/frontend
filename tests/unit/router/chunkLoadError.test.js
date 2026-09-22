// frontend/tests/unit/router/chunkLoadError.test.js
//
// Tests for the SPA's chunk-load-failure fallback.
//
// WHAT THIS FILE COVERS
// ---------------------
// When a lazy-loaded route chunk fails to fetch (a deploy rotated
// the asset hashes, the CDN is unreachable, the user is offline at
// the moment of navigation), the loader returns this component
// instead of throwing. The user sees an icon, a heading, a body
// message, and a "Retry" button that reloads the page.
//
// Nothing about that fallback was tested before. A regression that
// broke the retry button, or that made the component crash on
// render, would be invisible until a real deploy incident.
//
// PRODUCTION DEPENDENCY
// ---------------------
// This file assumes `createChunkLoadErrorComponent` and `lazyLoad`
// are exported from `router/index.js`. See the note in the previous
// message — the change is two `export` keywords.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import {
  createChunkLoadErrorComponent,
  lazyLoad,
} from '@/router'

import ar from '@/i18n/locales/ar/index.js'
import en from '@/i18n/locales/en/index.js'

function makeI18n() {
  return createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'ar',
    fallbackLocale: 'en',
    messages: { ar, en },
    missingWarn: false,
    fallbackWarn: false,
  })
}

// The component renders a plain button and calls
// `window.location.reload()` on click. happy-dom does not permit
// navigating, so the reload is spied on.
let reloadSpy

beforeEach(() => {
  reloadSpy = vi.fn()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload: reloadSpy, pathname: '/' },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createChunkLoadErrorComponent — rendering', () => {
  it('renders without throwing', () => {
    const Comp = createChunkLoadErrorComponent()
    const wrapper = mount(Comp, {
      global: { plugins: [makeI18n()] },
    })
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders the icon, heading, and body text', () => {
    const Comp = createChunkLoadErrorComponent()
    const wrapper = mount(Comp, {
      global: { plugins: [makeI18n()] },
    })
    expect(wrapper.find('i.bi-wifi-off').exists()).toBe(true)
    expect(wrapper.find('h2').text().length).toBeGreaterThan(0)
    expect(wrapper.find('p').text().length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('renders a retry button labelled from the catalog', () => {
    const Comp = createChunkLoadErrorComponent()
    const wrapper = mount(Comp, {
      global: { plugins: [makeI18n()] },
    })
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.text().length).toBeGreaterThan(0)
    wrapper.unmount()
  })
})

describe('createChunkLoadErrorComponent — retry button', () => {
  it('reloads the page when the retry button is clicked', async () => {
    const Comp = createChunkLoadErrorComponent()
    const wrapper = mount(Comp, {
      global: { plugins: [makeI18n()] },
    })
    await wrapper.find('button').trigger('click')
    expect(reloadSpy).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('does not reload on render, only on click', () => {
    const Comp = createChunkLoadErrorComponent()
    const wrapper = mount(Comp, {
      global: { plugins: [makeI18n()] },
    })
    expect(reloadSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('lazyLoad — success path', () => {
  it('resolves to the imported module on success', async () => {
    const mod = { default: { name: 'Fake', render: () => null } }
    const importFn = vi.fn().mockResolvedValueOnce(mod)
    const loader = lazyLoad(importFn)
    const result = await loader()
    expect(result).toBe(mod)
  })

  it('does not call the import function until the returned loader is invoked', () => {
    const importFn = vi.fn().mockResolvedValue({ default: {} })
    lazyLoad(importFn)
    expect(importFn).not.toHaveBeenCalled()
  })
})

describe('lazyLoad — failure path', () => {
  it('resolves to a chunk-load-error component when the import rejects', async () => {
    const importFn = vi.fn().mockRejectedValueOnce(new Error('network down'))
    const loader = lazyLoad(importFn)

    // Silence the loader's own console.error for the expected failure.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const result = await loader()
      expect(result).toBeTruthy()
      expect(result.default).toBeTruthy()
      expect(typeof result.default).toBe('object')
    } finally {
      errSpy.mockRestore()
    }
  })

  it('the substituted component is the chunk-load-error component', async () => {
    const importFn = vi.fn().mockRejectedValueOnce(new Error('network down'))
    const loader = lazyLoad(importFn)

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const result = await loader()
      const wrapper = mount(result.default, {
        global: { plugins: [makeI18n()] },
      })
      // The chunk-load-error component renders the retry button.
      // That is the distinguishing feature; a plain stub would not
      // have one.
      expect(wrapper.find('button').exists()).toBe(true)
      wrapper.unmount()
    } finally {
      errSpy.mockRestore()
    }
  })

  it('logs the failure so an operator can see it', async () => {
    const importFn = vi.fn().mockRejectedValueOnce(new Error('boom'))
    const loader = lazyLoad(importFn)

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await loader()
      expect(errSpy).toHaveBeenCalled()
      const [msg] = errSpy.mock.calls[0]
      expect(String(msg)).toMatch(/chunk|failed to load/i)
    } finally {
      errSpy.mockRestore()
    }
  })
})