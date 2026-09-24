# UI conventions

These contracts keep feature screens visually and behaviorally consistent.

## Hierarchy and actions

- Every routed page has one `PageShell`/`PageHeader` `h1`.
- Use `SectionHeader` (`h2`) for page sections and `CardHeader` (`h3`) inside cards.
- Put page commands in the `PageShell` `actions` slot. Use one primary action per page or section.
- Use primary for the main commit/create action, secondary or ghost for navigation, refresh, and export, and danger only for destructive commands.
- Feature, navigation, toolbar, and editor actions use `BaseButton`/`BaseIconButton`; native buttons are reserved for shared primitive internals. Use `raw-content` only when an established compound control needs to preserve its internal layout.

## Feedback and async states

- Field validation belongs in `BaseField` through the control's `error` prop.
- Section/page failures use `FeedbackRegion` or `PageShell` feedback props.
- Short confirmation after a completed command uses the notification/toast service.
- Loading, failure, empty, and content branches use `AsyncContent` or `BaseListContainer`.
- Empty states identify their cause with `first-use`, `no-results`, `filtered`, `unavailable`, or `generic`; creation CTAs belong only on first-use states.

## Forms

- Validate a field after its first blur, then revalidate it on input. Submit validates all fields.
- Protect long or destructive-to-recreate forms with `useUnsavedChanges` and mark them clean after a successful save.
- Use the `small`, `medium`, and `large` control sizes and `auto`/`full` width APIs instead of feature-specific heights.
- Native attributes such as `name`, `autocomplete`, `pattern`, and `autofocus` belong on `BaseInput`, `BaseSelect`, or `BaseTextarea`; the primitives forward them to the native control.

## Lists and content

- Search fields use `ListSearchInput`: 400 ms debounce, immediate Enter, Escape-to-clear.
- Keep filter and pagination state in the route query so detail navigation and browser Back restore the list.
- Repeated title/description/status/action records use `EntityRow`; repeated icon/label/value facts use `MetadataList`.
- Passive state/count values use `BaseBadge`; interactive and removable values use `BaseChip`.
- Data tables live in `BaseTableShell`. Choose `scroll`, `columns`, or `cards` deliberately and supply `data-label` values for card-mode cells.

## Responsive and international content

- Breakpoint tiers are 360, 480, 640, 768, and 900 px; JavaScript equivalents live in `constants/layout.js`.
- Pointer targets are at least 44 px on coarse pointers, even when the visual density is compact.
- Use `useLocaleFormatters` in components for dates, numbers, and percentages. Missing formatted values render as an em dash.
- User-entered or mixed-script strings use `dir="auto"`, `BidiText`, or a primitive that applies that behavior.

## Cards

- `BaseCard` is neutral by default. Semantic variants communicate real state.
- A whole card is keyboard/clickable only when `interactive` is set and it emits `activate`; nested buttons and links remain independent.
