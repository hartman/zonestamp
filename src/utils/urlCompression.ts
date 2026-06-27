import { deflateSync, inflateSync } from 'fflate'

const COMPRESS_THRESHOLD = 100

function toBase64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export interface StampParams {
  name?: string
  description?: string
  location?: string
  url?: string
}

export function buildQueryString(params: StampParams): string {
  const usp = new URLSearchParams()
  if (params.url) usp.set('url', params.url)
  if (params.name) usp.set('name', params.name)
  if (params.description) usp.set('description', params.description)
  if (params.location) usp.set('location', params.location)

  const plain = usp.toString()
  if (!plain) return ''
  if (plain.length < COMPRESS_THRESHOLD) return `?${plain}`

  const compressed = deflateSync(new TextEncoder().encode(plain))
  return `?zdl=${toBase64url(compressed)}`
}

export function decompressZdl(zdl: string): StampParams {
  try {
    const plain = new TextDecoder().decode(inflateSync(fromBase64url(zdl)))
    const usp = new URLSearchParams(plain)
    return {
      name: usp.get('name') ?? undefined,
      description: usp.get('description') ?? undefined,
      location: usp.get('location') ?? undefined,
      url: usp.get('url') ?? undefined,
    }
  } catch {
    return {}
  }
}
