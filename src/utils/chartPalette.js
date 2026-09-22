// frontend/src/utils/chartPalette.js

export function getChartPalette() {
  const styles = getComputedStyle(document.documentElement)

    function token(name, altNames = []) {
    let val = styles.getPropertyValue(name).trim()
    if (val) return val
    for (const a of altNames) {
      val = styles.getPropertyValue(a).trim()
      if (val) return val
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        `[chartPalette] token "${name}" ` +
        `(alternatives: ${altNames.length ? altNames.join(', ') : 'none'}) ` +
        `resolved empty. Verify the token is defined on :root or [data-theme].`
      )
    }
    return ''
  }

  const primary = token('--color-primary', ['--color-info', '--color-primary-light'])
  const success = token('--color-success', ['--color-primary', '--color-success-light'])
  const info = token('--color-info', ['--color-primary', '--color-info-light'])
  const warning = token('--color-warning', ['--color-primary', '--color-warning-light'])
  const danger = token('--color-danger', ['--color-primary', '--color-danger-light'])
  const text = token('--color-text-primary', ['--color-text-secondary', '--color-text-muted'])
  const border = token('--color-border', ['--color-selected', '--color-text-muted'])

  // Standard metric colors: always same hue for same metric.
  // The `series` array order is load-bearing — see the CONTRACT above.
  return {
    primary,
    success,
    info,
    warning,
    danger,
    text,
    border,
    // Series palette for categorical data
    series: [primary, success, info, warning, danger],
  }
}