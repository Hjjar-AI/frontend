// frontend/src/utils/richTextSanitizer.js
//
// Shared DOMPurify policy for the rich-text content modules
// (`Manual.vue`, `PrivacyPolicy.vue`).
//
// WHAT THIS REPLACES
// ------------------
// The two pages each declared their own `SANITIZE_CONFIG` object,
// their own `sanitizeHtml` helper, and their own `ensureHooks()`
// call. Comparing the two, they differed on exactly three axes:
//
//   • Manual allows `<img>`; Privacy does not.
//   • Manual allows `loading` in ALLOWED_ATTR; Privacy does not.
//   • Manual allows `mark`, `sup`, `sub`; Privacy does not.
//
// Everything else — base tag set, base attribute set, URI regexp,
// FORBID_TAGS, FORBID_ATTR — was byte-identical between them.
//
// The base config below is the SMALLEST COMMON SET. Each named
// preset spreads the base and adds only the tags/attributes that
// genuinely differ. Both presets therefore produce the exact same
// allowed and forbidden sets the two page files produced before
// this consolidation.
//
// WHY NAMED PRESETS AND NOT A BASE + EXTRA LIST
// ---------------------------------------------
// Passing an "extras" array from each caller would leave the caller
// responsible for knowing what to add. Passing a preset name makes
// the caller say what it is — `createSanitizer('manual')` — and the
// module owns the mapping.
//
// RENDER-TIME ENFORCEMENT
// -----------------------
// The `sanitize` function returned by `createSanitizer` is called at
// render time from each page's computed properties — never at load
// time on the imported module. That is the same contract the two
// page-level implementations had.

import DOMPurify from 'dompurify'
import { ensureHooks } from '@/utils/markdown'

// ── Base policy ────────────────────────────────────────────────────
//
// The smallest common set. Every tag, attribute, URI pattern, and
// forbid list in this block was present VERBATIM in both page
// files. Do not add anything here that is not shared by every
// content page; put it in the page's preset instead.
//
// Note on FORBID_TAGS / FORBID_ATTR: these lists overlap with the
// default DOMPurify deny lists in some browsers and replace them in
// others. Keeping them short and matching the original page files
// exactly means the consolidation is a pure refactor.
const BASE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'a', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'button', 'svg', 'math'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
}

// ── Named presets ──────────────────────────────────────────────────
export const SANITIZE_PRESETS = {
  // User Manual. The manual embeds screenshots and reference images
  // inside its section bodies, so `img` is on the allowlist and the
  // `loading` attribute is passed through (the markdown renderer
  // sets `loading="lazy"` on every image it emits). It also uses
  // `<mark>` for highlights and `<sup>`/`<sub>` for the Markdown
  // guide's inline examples.
  manual: {
    ...BASE_CONFIG,
    ALLOWED_TAGS: [
      ...BASE_CONFIG.ALLOWED_TAGS,
      'img', 'mark', 'sup', 'sub',
    ],
    ALLOWED_ATTR: [
      ...BASE_CONFIG.ALLOWED_ATTR,
      'loading',
    ],
  },

  // Privacy Policy. The policy text is prose and tables only — no
  // images, no highlights, no superscripts. The preset is the base
  // config unchanged, matching the previous page-level policy
  // exactly.
  privacy: {
    ...BASE_CONFIG,
  },
}

/**
 * Create a sanitizer bound to a named preset.
 *
 * The returned function is safe to call at render time — it calls
 * `ensureHooks()` on the DOMPurify instance (idempotent after the
 * first call) and then sanitises `html` against the preset's policy.
 *
 * @param {'manual'|'privacy'} presetName
 * @returns {(html: string) => string}
 */
export function createSanitizer(presetName) {
  const config = SANITIZE_PRESETS[presetName]
  if (!config) {
    throw new Error(
      `[richTextSanitizer] unknown preset "${presetName}". ` +
      `Available: ${Object.keys(SANITIZE_PRESETS).join(', ')}.`,
    )
  }
  return function sanitize(html) {
    if (!html) return ''
    ensureHooks()
    return DOMPurify.sanitize(html, config)
  }
}