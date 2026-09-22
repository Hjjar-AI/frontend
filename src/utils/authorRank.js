// frontend/src/utils/authorRank.js
//
// Shared author-rank display registry.
//
// WHAT THIS REPLACES
// ------------------
// Two views rendered the same six-rank presentation data with six
// parallel switch statements:
//
//   • QuestionCard.vue read `question.authored_by_rank.{key,label}`
//     (a structured object on the question payload).
//   • Profile.vue read `user.author_rank` (a plain string) and
//     `user.author_rank_label_ar` for the fallback label.
//
// The two views access the rank through different shapes, but the
// mapping from rank key to {badge variant, icon, i18n label key} is
// identical. Six switch cases x two views x three properties = 36
// lines of duplicated logic that had to be updated together.
//
// The registry below owns the mapping once. The two views keep
// their own access path (structured object vs. flat string) and
// their own fallback label, because those genuinely differ.
//
// RANK VALUES
// -----------
// The keys are the backend's `author_rank` codes. They are stable:
// see `apps/users/models.py` and the rank computation in
// `apps/questions/services/reputation.py`.

export const AUTHOR_RANKS = {
  admin: {
    variant: 'danger',
    icon: 'bi bi-shield-lock-fill',
    labelKey: 'profile.rankAdmin',
  },
  authority: {
    variant: 'success',
    icon: 'bi bi-award-fill',
    labelKey: 'profile.rankAuthority',
  },
  expert: {
    variant: 'primary',
    icon: 'bi bi-star-fill',
    labelKey: 'profile.rankExpert',
  },
  contributor: {
    variant: 'info',
    icon: 'bi bi-star-half',
    labelKey: 'profile.rankContributor',
  },
  apprentice: {
    variant: 'warning',
    icon: 'bi bi-star',
    labelKey: 'profile.rankApprentice',
  },
  newcomer: {
    variant: 'secondary',
    icon: 'bi bi-person-plus',
    labelKey: 'profile.rankNewcomer',
  },
}

// Defaults used when the key is missing or unrecognised. These match
// the `default` arm of the switch statements they replace.
export const DEFAULT_AUTHOR_RANK_VARIANT = 'secondary'
export const DEFAULT_AUTHOR_RANK_ICON = 'bi bi-person'

/**
 * Badge variant for an author rank.
 *
 * Falls through to `'secondary'` for an unknown or missing key, the
 * same value the original switches used.
 */
export function authorRankVariantFor(key) {
  return AUTHOR_RANKS[key]?.variant || DEFAULT_AUTHOR_RANK_VARIANT
}

/**
 * Bootstrap-Icon class for an author rank.
 *
 * Falls through to the generic person glyph, the same value the
 * original switches used.
 */
export function authorRankIconFor(key) {
  return AUTHOR_RANKS[key]?.icon || DEFAULT_AUTHOR_RANK_ICON
}

/**
 * Localized label for an author rank.
 *
 * @param {string}   key       the rank code from the payload
 * @param {Function} t         the i18n `t` function — passed in so
 *                             the helper works in both a component
 *                             scope and a plain module
 * @param {string}   fallback  string to use when the key is missing
 *                             or unrecognised. Each caller supplies
 *                             its own:
 *                             • QuestionCard → rank.label
 *                             • Profile      → author_rank_label_ar
 *                             Defaults to '' so a caller that has
 *                             no fallback renders an empty string
 *                             rather than the raw key.
 */
export function authorRankLabelFor(key, t, fallback = '') {
  const entry = key ? AUTHOR_RANKS[key] : null
  return entry ? t(entry.labelKey) : fallback
}