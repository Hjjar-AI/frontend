// frontend/src/utils/markdown.js
import MarkdownIt from 'markdown-it'
import MarkdownItTable from 'markdown-it-multimd-table'
import DOMPurify from 'dompurify'

let md = null
let hookRegistered = false

function patchMarkdownItUtils(instance) {
  if (!instance || !instance.utils) return
  if (typeof instance.utils.assign === 'function') return

  const merged = { ...instance.utils, assign: Object.assign }

  try {
    instance.utils = merged
  } catch {
    try {
      Object.defineProperty(instance, 'utils', {
        value: merged,
        writable: true,
        configurable: true,
        enumerable: true,
      })
    } catch {
    }
  }
}

function tryUsePlugin(instance, plugin, options, label) {
  try {
    instance.use(plugin, options)
  } catch (err) {
    // Only in dev. In production the plugin-load path is exercised
    // on every cold start; a permanent `console.error` there is
    // noise, not signal — the render path below already degrades
    // gracefully when a plugin is missing.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error(`[markdown] failed to load plugin "${label}":`, err)
    }
  }
}

export function getMarkdownRenderer() {
  if (!md) {
    md = new MarkdownIt({
      html: false,          // raw HTML disabled – sanitised via DOMPurify
      linkify: true,
      typographer: true,
      breaks: true,
    })

    // Must run BEFORE `use(...)`: the plugin reads `md.utils.assign`
    // during its own initialisation, not at first render.
    patchMarkdownItUtils(md)

    tryUsePlugin(md, MarkdownItTable, {
      multiline: true,
      rowspan: true,
      headerless: false,
    }, 'markdown-it-multimd-table')

    // Add lazy loading to images
    const defaultRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.image = function (tokens, idx, options, env, self) {
      const token = tokens[idx]
      token.attrSet('loading', 'lazy')
      token.attrSet('class', 'markdown-image')
      return defaultRender(tokens, idx, options, env, self)
    }
  }
  return md
}

export function ensureHooks() {
  if (hookRegistered) return
  hookRegistered = true

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
      node.classList.add('external-link')

      // Defense in depth: strictly validate href
      const href = node.getAttribute('href')
      if (href) {
        // Allow ONLY: http(s), mailto, tel, relative paths (/), and anchors (#)
        // Blocks javascript:, data:, vbscript:, etc.
        if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href.trim())) {
          node.removeAttribute('href')
        }
      }
    }

    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src')
      if (src) {
        // Allow ONLY: http(s) and relative paths (/)
        if (!/^(https?:|\/)/i.test(src.trim())) {
          node.removeAttribute('src')
        }
      }
    }
  })
}

// Centralized sanitize config
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'a', 'img', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'mark', 'sup', 'sub',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'loading', 'target', 'rel',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: [
    'style', 'script', 'iframe', 'frame', 'frameset',
    'form', 'input', 'button', 'textarea', 'select', 'option',
    'svg', 'math', 'video', 'audio', 'embed', 'object', 'applet',
    'meta', 'link', 'base', 'template',
  ],
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup',
    'style', 'srcdoc', 'formaction', 'xlink:href',
  ],
}

const INLINE_ALLOWED_TAGS = [
  'strong', 'em', 'u', 's', 'a', 'code', 'img', 'mark', 'sup', 'sub',
]

export function renderMarkdown(text) {
  if (!text) return ''
  ensureHooks()
  const renderer = getMarkdownRenderer()
  const html = renderer.render(text)
  return DOMPurify.sanitize(html, SANITIZE_CONFIG)
}

export function renderInlineMarkdown(text) {
  if (!text) return ''
  ensureHooks()
  const renderer = getMarkdownRenderer()
  const html = renderer.renderInline(text)
  return DOMPurify.sanitize(html, {
    ...SANITIZE_CONFIG,
    ALLOWED_TAGS: INLINE_ALLOWED_TAGS,
  })
}