// @vitest-environment jsdom
// frontend/tests/unit/utils/markdown.test.js
//
// Tests for the Markdown rendering pipeline.
//
// WHY jsdom AND NOT happy-dom
// ---------------------------
// DOMPurify depends on a browser-grade DOM — specifically, on
// `document.implementation.createHTMLDocument()` and an HTML parser
// that behaves like a real browser's. happy-dom provides a partial
// implementation that is enough for Vue components but not for
// DOMPurify's sanitisation pass. Under happy-dom, DOMPurify runs in
// a degraded mode: it silently strips some tags, keeps others, and
// does not fire its `afterSanitizeAttributes` hooks. None of those
// failures produce an error — the sanitizer just returns the wrong
// output.
//
// jsdom provides the full DOM API DOMPurify needs. It boots slower
// than happy-dom, so the switch is scoped to this file via the
// `@vitest-environment` comment on the first line. Every other test
// file continues to run under happy-dom.
//
// THE TWO XSS DEFENSES
// --------------------
// The pipeline has two layers, and this file tests both:
//
//   1. markdown-it with `html: false` escapes all raw HTML in the
//      input BEFORE DOMPurify sees it. `<script>alert(1)</script>`
//      becomes the string `&lt;script&gt;alert(1)&lt;/script&gt;`.
//      A browser rendering that string shows the literal text; it
//      does not execute a script.
//
//   2. DOMPurify sanitises the HTML that markdown-it produces from
//      markdown syntax — headings, lists, tables, links, images —
//      and applies the `afterSanitizeAttributes` hook that hardens
//      external links.
//
// The tests below are organised by which layer is doing the work.
// A test for "javascript: URLs" belongs to layer 1 when the URL
// came from a raw HTML attribute (markdown-it does not parse it),
// and to layer 2 when the URL came from a markdown link.

import { describe, it, expect } from 'vitest'
import { renderMarkdown, renderInlineMarkdown } from '@/utils/markdown'

// ── Layer 2: markdown-it produces HTML, DOMPurify sanitises it ────

describe('renderMarkdown — markdown syntax produces safe HTML', () => {
  it('renders bold', () => {
    const html = renderMarkdown('**bold**')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('renders italic', () => {
    const html = renderMarkdown('*italic*')
    expect(html).toContain('<em>italic</em>')
  })

  it('renders strikethrough', () => {
    const html = renderMarkdown('~~gone~~')
    expect(html).toContain('<s>gone</s>')
  })

  it('renders inline code', () => {
    const html = renderMarkdown('`code`')
    expect(html).toContain('<code>code</code>')
  })

  it('renders headings', () => {
    const html = renderMarkdown('## Section')
    expect(html).toContain('<h2')
    expect(html).toContain('Section')
  })

  it('renders unordered lists', () => {
    const html = renderMarkdown('- a\n- b')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>a</li>')
    expect(html).toContain('<li>b</li>')
  })

  it('renders tables', () => {
    const html = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>A</th>')
    expect(html).toContain('<td>1</td>')
  })

  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('')
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown(undefined)).toBe('')
  })

  it('linkifies bare urls', () => {
    const html = renderMarkdown('see https://example.com')
    expect(html).toContain('<a')
    expect(html).toContain('https://example.com')
  })
})

// ── Layer 1: markdown-it escapes raw HTML ─────────────────────────
//
// With `html: false`, markdown-it does NOT parse raw HTML in the
// input. It escapes the angle brackets, so the browser renders the
// markup as text. This is a stronger, earlier defense than "let
// DOMPurify strip it later" — the tag never reaches the DOM as a
// tag in the first place.
//
// The tests below assert the ESCAPE, not the strip.

describe('renderMarkdown — raw HTML is escaped, not executed', () => {
  it('escapes <script> so it cannot execute', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    // The literal `<script` tag never appears in the output.
    expect(html).not.toContain('<script')
    // But the text is preserved (escaped), because markdown-it
    // treats it as literal content.
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes <iframe>', () => {
    const html = renderMarkdown('<iframe src="https://evil.example"></iframe>')
    expect(html).not.toContain('<iframe')
    expect(html).toContain('&lt;iframe')
  })

  it('escapes <style>', () => {
    const html = renderMarkdown('<style>body{display:none}</style>')
    expect(html).not.toContain('<style')
    expect(html).toContain('&lt;style&gt;')
  })

  it('escapes <form> and its children', () => {
    const html = renderMarkdown('<form action="/x"><input name="a"></form>')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<input')
  })

  it('escapes <meta> and <link>', () => {
    const html = renderMarkdown(
      '<meta http-equiv="refresh" content="0"><link rel="stylesheet" href="//evil">',
    )
    expect(html).not.toContain('<meta')
    expect(html).not.toContain('<link')
  })

  it('escapes <svg> and its contents', () => {
    const html = renderMarkdown('<svg onload="alert(1)"><circle r="1"/></svg>')
    expect(html).not.toContain('<svg')
    expect(html).toContain('&lt;svg')
  })

  it('escapes onerror on a raw <img>', () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)">')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('escapes onclick on a raw <a>', () => {
    const html = renderMarkdown('<a href="#" onclick="alert(1)">x</a>')
    expect(html).not.toContain('<a ')
    expect(html).toContain('&lt;a ')
  })

  it('escapes style= on a raw tag', () => {
    const html = renderMarkdown('<a href="#" style="color:red">x</a>')
    expect(html).not.toContain('style="color:red"')
  })
})

// ── Layer 2: markdown links and their URLs ────────────────────────
//
// `[click](javascript:alert(1))` — markdown-it's `validateLink`
// rejects `javascript:` before the link is produced. The result is
// text, not an anchor. The output therefore has no `href` at all.

describe('renderMarkdown — dangerous URIs', () => {
  it('does not produce a link for a javascript: URL', () => {
    const html = renderMarkdown('[click](javascript:alert(1))')
    expect(html).not.toMatch(/href\s*=\s*["']?javascript:/i)
    // No anchor is produced.
    expect(html).not.toContain('<a ')
  })

  it('does not produce an image for a data: URL', () => {
    const html = renderMarkdown(
      '![x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    )
    expect(html).not.toMatch(/src\s*=\s*["']?data:/i)
  })

  it('does not produce a link for a vbscript: URL', () => {
    const html = renderMarkdown('[click](vbscript:msgbox(1))')
    expect(html).not.toMatch(/href\s*=\s*["']?vbscript:/i)
  })

  it('keeps https: hrefs', () => {
    const html = renderMarkdown('[ok](https://example.com)')
    expect(html).toMatch(/href\s*=\s*["']?https:\/\/example\.com/i)
  })

  it('keeps mailto: hrefs', () => {
    const html = renderMarkdown('[mail](mailto:someone@example.com)')
    expect(html).toContain('mailto:someone@example.com')
  })

  it('keeps relative hrefs', () => {
    const html = renderMarkdown('[rel](/docs)')
    expect(html).toContain('href="/docs"')
  })

  it('keeps anchor hrefs', () => {
    const html = renderMarkdown('[top](#section)')
    expect(html).toContain('href="#section"')
  })
})

// ── Layer 2: DOMPurify hardening hook ─────────────────────────────

describe('renderMarkdown — external link hardening', () => {
  it('adds target=_blank to external anchors', () => {
    const html = renderMarkdown('[ok](https://example.com)')
    expect(html).toMatch(/target\s*=\s*["']_blank["']/)
  })

  it('adds rel=noopener noreferrer to external anchors', () => {
    const html = renderMarkdown('[ok](https://example.com)')
    expect(html).toMatch(/rel\s*=\s*["']noopener noreferrer["']/)
  })

  it('adds the external-link class to external anchors', () => {
    const html = renderMarkdown('[ok](https://example.com)')
    expect(html).toContain('external-link')
  })
})

// ── renderInlineMarkdown ──────────────────────────────────────────

describe('renderInlineMarkdown', () => {
  it('renders inline formatting', () => {
    const html = renderInlineMarkdown('**bold** and *italic*')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('does not wrap output in a paragraph', () => {
    const html = renderInlineMarkdown('plain text')
    expect(html).not.toContain('<p>')
    expect(html).toContain('plain text')
  })

  it('does not emit block-level tags', () => {
    // `h1` is in the block allowlist but NOT in the inline allowlist.
    const html = renderInlineMarkdown('# heading')
    expect(html).not.toContain('<h1')
  })

  it('returns an empty string for empty input', () => {
    expect(renderInlineMarkdown('')).toBe('')
    expect(renderInlineMarkdown(null)).toBe('')
  })

  it('does not produce a link for a javascript: URL', () => {
    const html = renderInlineMarkdown('[x](javascript:alert(1))')
    expect(html).not.toMatch(/href\s*=\s*["']?javascript:/i)
  })
})