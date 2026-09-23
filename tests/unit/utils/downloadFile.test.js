import { describe, expect, it } from 'vitest'

import { getResponseFilename } from '@/utils/downloadFile'

describe('getResponseFilename', () => {
  it('decodes an RFC 5987 UTF-8 filename', () => {
    const response = {
      headers: new Headers({
        'content-disposition': "attachment; filename*=UTF-8''%D8%A8%D9%86%D9%83.pdf",
      }),
    }

    expect(getResponseFilename(response)).toBe('بنك.pdf')
  })

  it('accepts the Axios plain-object header shape', () => {
    const response = {
      headers: { 'content-disposition': 'attachment; filename="state.json"' },
    }

    expect(getResponseFilename(response)).toBe('state.json')
  })

  it('returns null when no attachment filename is present', () => {
    expect(getResponseFilename({ headers: {} })).toBeNull()
  })
})
