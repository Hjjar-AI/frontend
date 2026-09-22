// Stable, presentation-only tone assignment for dense user lists.
// The same identity always receives the same slot; CSS maps that slot
// through the active theme's avatar palette.
export function avatarToneClass(identity) {
  const value = String(identity ?? '')
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return `avatar-tone-${hash % 6}`
}
