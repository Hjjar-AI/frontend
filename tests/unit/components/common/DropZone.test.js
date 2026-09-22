// frontend/tests/unit/components/common/DropZone.test.js
//
// Tests for the drop zone's file-type filter.
//
// The `accept` attribute filter runs on drop. It supports three
// shapes — extension (`.json`), wildcard MIME (`image/*`), and
// exact MIME (`application/json`) — and each has a distinct code
// path. This is a UX gate, not a security boundary; the server-side
// MIME check is the authoritative one.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { notifyMock } = vi.hoisted(() => ({ notifyMock: vi.fn() }))

vi.mock('@/composables/useNotify', () => ({
  useNotify: () => ({ notify: notifyMock }),
}))

import DropZone from '@/components/common/DropZone.vue'
import { mountWithGlobals } from '../../../helpers/mountWithGlobals'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

function makeFile(name, type = '') {
  return new File(['content'], name, { type })
}

function mountZone(props = {}) {
  // `mountWithGlobals` is synchronous — see the helper's docstring.
  return mountWithGlobals(DropZone, {
    props: {
      accept: '',
      label: 'Drop a file',
      hint: '',
      browseLabel: 'Browse',
      disabled: false,
      ...props,
    },
  })
}

function simulateDrop(wrapper, files) {
  const event = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    configurable: true,
    value: { files },
  })
  wrapper.find('.drop-zone').element.dispatchEvent(event)
}

describe('DropZone — no accept attribute', () => {
  it('accepts any file when accept is empty', () => {
    const wrapper = mountZone({ accept: '' })
    const file = makeFile('anything.pdf', 'application/pdf')
    simulateDrop(wrapper, [file])
    const events = wrapper.emitted('file-selected')
    expect(events).toBeTruthy()
    expect(events[0][0]).toBe(file)
    wrapper.unmount()
  })
})

describe('DropZone — extension matching', () => {
  it('accepts a matching extension', () => {
    const wrapper = mountZone({ accept: '.json' })
    simulateDrop(wrapper, [makeFile('data.json', 'application/json')])
    expect(wrapper.emitted('file-selected')).toBeTruthy()
    wrapper.unmount()
  })

  it('is case-insensitive on the extension', () => {
    const wrapper = mountZone({ accept: '.json' })
    simulateDrop(wrapper, [makeFile('DATA.JSON', 'application/json')])
    expect(wrapper.emitted('file-selected')).toBeTruthy()
    wrapper.unmount()
  })

  it('rejects a non-matching extension and does not emit', () => {
    const wrapper = mountZone({ accept: '.json' })
    simulateDrop(wrapper, [makeFile('image.png', 'image/png')])
    expect(wrapper.emitted('file-selected')).toBeFalsy()
    wrapper.unmount()
  })

  it('shows an error toast on rejection', () => {
    const wrapper = mountZone({ accept: '.json' })
    simulateDrop(wrapper, [makeFile('x.pdf', 'application/pdf')])
    expect(notifyMock).toHaveBeenCalledTimes(1)
    const [, type] = notifyMock.mock.calls[0]
    expect(type).toBe('error')
    wrapper.unmount()
  })

  it('accepts any of several extensions in a comma-separated list', () => {
    const wrapper = mountZone({ accept: '.json,.csv,.xlsx' })
    simulateDrop(wrapper, [makeFile('a.csv')])
    expect(wrapper.emitted('file-selected')).toBeTruthy()
    wrapper.unmount()
  })

  it('trims whitespace around accept entries', () => {
    const wrapper = mountZone({ accept: '.json , .csv , .xlsx' })
    simulateDrop(wrapper, [makeFile('a.csv')])
    expect(wrapper.emitted('file-selected')).toBeTruthy()
    wrapper.unmount()
  })
})

describe('DropZone — wildcard MIME matching', () => {
  it('accepts any image when accept is image/*', () => {
    const wrapper = mountZone({ accept: 'image/*' })
    simulateDrop(wrapper, [makeFile('x.png', 'image/png')])
    expect(wrapper.emitted('file-selected')).toBeTruthy()
    wrapper.unmount()
  })

  it('accepts a different subtype of the same top-level type', () => {
    const wrapper = mountZone({ accept: 'image/*' })
    simulateDrop(wrapper, [makeFile('x.jpeg', 'image/jpeg')])
    expect(wrapper.emitted('file-selected')).toBeTruthy()
    wrapper.unmount()
  })

  it('rejects a file whose MIME top level does not match', () => {
    const wrapper = mountZone({ accept: 'image/*' })
    simulateDrop(wrapper, [makeFile('x.pdf', 'application/pdf')])
    expect(wrapper.emitted('file-selected')).toBeFalsy()
    wrapper.unmount()
  })
})

describe('DropZone — exact MIME matching', () => {
  it('accepts the exact MIME', () => {
    const wrapper = mountZone({ accept: 'application/json' })
    simulateDrop(wrapper, [makeFile('x.json', 'application/json')])
    expect(wrapper.emitted('file-selected')).toBeTruthy()
    wrapper.unmount()
  })

  it('rejects a different subtype of the same top-level type', () => {
    const wrapper = mountZone({ accept: 'application/json' })
    simulateDrop(wrapper, [makeFile('x.xml', 'application/xml')])
    expect(wrapper.emitted('file-selected')).toBeFalsy()
    wrapper.unmount()
  })
})

describe('DropZone — mixed accept shapes', () => {
  it('accepts when any of the shapes match', () => {
    const wrapper = mountZone({ accept: '.json,image/*,application/pdf' })
    simulateDrop(wrapper, [makeFile('photo.png', 'image/png')])
    expect(wrapper.emitted('file-selected')).toBeTruthy()
    wrapper.unmount()
  })

  it('rejects when none of the shapes match', () => {
    const wrapper = mountZone({ accept: '.json,image/*,application/pdf' })
    simulateDrop(wrapper, [makeFile('movie.mp4', 'video/mp4')])
    expect(wrapper.emitted('file-selected')).toBeFalsy()
    wrapper.unmount()
  })
})

describe('DropZone — disabled state', () => {
  it('does not emit when the zone is disabled', () => {
    const wrapper = mountZone({ accept: '.json', disabled: true })
    simulateDrop(wrapper, [makeFile('x.json', 'application/json')])
    expect(wrapper.emitted('file-selected')).toBeFalsy()
    wrapper.unmount()
  })

  it('does not emit an error toast when disabled and dropped on', () => {
    const wrapper = mountZone({ accept: '.json', disabled: true })
    simulateDrop(wrapper, [makeFile('x.pdf')])
    expect(notifyMock).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('DropZone — empty drop', () => {
  it('does nothing when the drop carries no file', () => {
    const wrapper = mountZone({ accept: '.json' })
    simulateDrop(wrapper, [])
    expect(wrapper.emitted('file-selected')).toBeFalsy()
    expect(notifyMock).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})