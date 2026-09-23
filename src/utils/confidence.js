export function normalizeConfidenceScore(value, fallback = 3) {
  if (value === true) return 3
  if (value === false) return 2
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 3 ? parsed : fallback
}

export function isHighConfidence(value) {
  return normalizeConfidenceScore(value) === 3
}
