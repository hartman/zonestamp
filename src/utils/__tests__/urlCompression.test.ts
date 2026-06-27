import { describe, it, expect } from 'vitest'
import { buildQueryString, decompressZdl } from '../urlCompression'

describe('buildQueryString', () => {
  it('returns empty string when no params', () => {
    expect(buildQueryString({})).toBe('')
  })

  it('returns plain query string when under threshold', () => {
    const qs = buildQueryString({ name: 'My Event', location: 'Online' })
    expect(qs).toMatch(/^\?/)
    expect(qs).toContain('name=My+Event')
    expect(qs).toContain('location=Online')
    expect(qs).not.toContain('zdr=')
  })

  it('returns compressed ?zdl= param when over threshold', () => {
    const description = 'A'.repeat(200)
    const qs = buildQueryString({ name: 'Big Event', description })
    expect(qs).toMatch(/^\?zdl=/)
  })

  it('compressed output round-trips correctly', () => {
    const params = {
      name: 'Engineering All-Hands',
      description: 'Quarterly planning session. '.repeat(10),
      location: 'Zoom + Building 4 Room 201',
      url: 'https://company.example.com/calendar/q3',
    }
    const qs = buildQueryString(params)
    expect(qs).toMatch(/^\?zdl=/)

    const zdl = new URLSearchParams(qs.slice(1)).get('zdl')!
    const result = decompressZdl(zdl)

    expect(result.name).toBe(params.name)
    expect(result.description).toBe(params.description)
    expect(result.location).toBe(params.location)
    expect(result.url).toBe(params.url)
  })

  it('omits undefined fields from output', () => {
    const qs = buildQueryString({ name: 'Solo' })
    expect(qs).not.toContain('description')
    expect(qs).not.toContain('location')
    expect(qs).not.toContain('url')
  })
})

describe('decompressZdl', () => {
  it('returns empty object on garbage input', () => {
    expect(decompressZdl('not-valid-base64url!!!')).toEqual({})
  })

  it('returns empty object on empty string', () => {
    expect(decompressZdl('')).toEqual({})
  })
})
