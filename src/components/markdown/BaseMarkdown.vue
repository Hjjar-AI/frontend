<!-- frontend/src/components/markdown/BaseMarkdown.vue -->
<template>
  <!--
    INLINE MODE RENDERS A <span> WITH NO `dir` ATTRIBUTE.

    WHY THIS IS LOAD-BEARING
    ------------------------
    A `dir="auto"` element computes its direction from the first
    strong directional character among its descendant text nodes,
    EXCLUDING text that lives inside a descendant that itself
    carries a `dir` attribute.

    Block mode (`inline === false`) satisfies this by construction:
    the <div> it renders is a block-level box, is the outermost
    element of its own text, and is self-sufficient — `dir="auto"`
    on it drives `text-align: start` for the block, and no caller
    wrapper is required.

    Inline mode is different. A <span> is inline; `text-align` has
    no effect on it. Only the CONTAINING BLOCK's `direction`
    positions an inline run horizontally. So the element whose
    direction actually produces visible alignment is the CALLER'S
    block-level wrapper.

    The previous version of this component rendered a <div> for
    BOTH modes and set `dir="auto"` on it. Because
    `markdown.css` declares `.base-markdown--inline { display:
    inline; }`, that <div> was an INLINE element with a `dir`. The
    consequences in every caller of `:inline="true"` were:

      • The caller's `dir="auto"` wrapper found no eligible text
        (the inner inline <div> blocked it) and defaulted to
        inheriting from <html dir> — i.e. from the app language.
      • The caller's inline-block text container inherited that
        wrong direction and aligned its content to the app's
        language, not to the question's script.

    Rendering as a bare <span> with no `dir` removes both halves
    of the failure: the caller's wrapper can auto-detect (nothing
    in between has its own `dir`), and the outer block's direction
    correctly propagates to the inline span.

    CALLER CONTRACT FOR INLINE MODE
    -------------------------------
    Wrap `<BaseMarkdown :inline="true">` in a block-level element
    that carries `dir="auto"`, and put no `dir` on any element
    between that wrapper and this component. Both callers today —
    `QuestionCard.vue` and `ReviewItem.vue` — already do.

    CSS NOTE
    --------
    `.base-markdown--inline { display: inline; }` in markdown.css
    is now redundant (a <span> is inline by default). It is left in
    place so a future rule that changes `display` on
    `.base-markdown` does not accidentally turn the inline variant
    into a block.
  -->
  <span
    v-if="inline"
    class="base-markdown base-markdown--inline"
    v-html="rendered"
  ></span>
  <div
    v-else
    class="base-markdown"
    v-html="rendered"
    dir="auto"
  ></div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown, renderInlineMarkdown } from '@/utils/markdown'

const props = defineProps({
  text: { type: String, default: '' },
  inline: { type: Boolean, default: false },
})

const rendered = computed(() => {
  if (!props.text) return ''
  return props.inline ? renderInlineMarkdown(props.text) : renderMarkdown(props.text)
})
</script>