import { describe, expect, it } from 'vitest'

import { buildExportUrl } from '@/utils/exportUrl'

describe('buildExportUrl', () => {
  it('sends the active theme with PDF exports', () => {
    const url = buildExportUrl('/api/export/pdf/', {
      format: 'pdf',
      filterParams: { difficulty: ['easy', 'hard'] },
      theme: 'dark',
    })

    const parsed = new URL(url, 'https://example.test')
    expect(parsed.searchParams.get('difficulty')).toBe('easy,hard')
    expect(parsed.searchParams.get('theme')).toBe('dark')
  })

  it('does not attach a presentation theme to data exports', () => {
    const url = buildExportUrl('/api/export/csv/', {
      format: 'csv',
      theme: 'blossom',
    })

    expect(url).toBe('/api/export/csv/')
  })

  it('normalizes unknown PDF themes to Stone', () => {
    const url = buildExportUrl('/api/export/pdf/?verified=true', {
      format: 'pdf',
      theme: 'unknown',
    })

    const parsed = new URL(url, 'https://example.test')
    expect(parsed.searchParams.get('verified')).toBe('true')
    expect(parsed.searchParams.get('theme')).toBe('stone')
  })
})
