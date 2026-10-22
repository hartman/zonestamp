import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const DIST = fileURLToPath(new URL('./dist/', import.meta.url))
const PORT = Number(process.env.PORT) || 8000

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.ico', '.txt'])

// Everything is read up front: only paths in this map can ever be served.
const files = new Map()
for (const entry of readdirSync(DIST, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue
  const full = join(entry.parentPath, entry.name)
  const urlPath = '/' + full.slice(DIST.length).split(sep).join('/')
  const ext = extname(full)
  const body = readFileSync(full)
  files.set(urlPath, {
    body,
    gz: COMPRESSIBLE.has(ext) ? gzipSync(body) : null,
    type: TYPES[ext] ?? 'application/octet-stream',
    etag: '"' + createHash('sha1').update(body).digest('hex') + '"',
  })
}
const index = files.get('/index.html')
if (!index) {
  console.error(`${DIST}index.html not found; run the build first`)
  process.exit(1)
}

const server = createServer((req, res) => {
  const pathname = req.url.split('?')[0]
  if (pathname !== '/healthz') console.log(`${req.method} ${req.url}`)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end(req.method === 'HEAD' ? undefined : 'ok')
    return
  }

  const file = files.get(pathname)
  // A stale hashed chunk must fail loudly instead of being answered with HTML.
  if (!file && pathname.startsWith('/assets/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }).end(req.method === 'HEAD' ? undefined : 'Not found')
    return
  }
  const served = file ?? index

  const gzip = served.gz && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')
  const etag = gzip ? served.etag.slice(0, -1) + '-gz"' : served.etag
  const headers = {
    'Content-Type': served.type,
    ETag: etag,
    'Cache-Control': file && pathname.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Accept-Encoding',
  }
  const ifNoneMatch = (req.headers['if-none-match'] ?? '').split(',').map((t) => t.trim().replace(/^W\//, ''))
  if (ifNoneMatch.includes(etag) || ifNoneMatch.includes('*')) {
    res.writeHead(304, headers).end()
    return
  }
  let body = served.body
  if (gzip) {
    body = served.gz
    headers['Content-Encoding'] = 'gzip'
  }
  headers['Content-Length'] = body.length
  res.writeHead(200, headers).end(req.method === 'HEAD' ? undefined : body)
})

server.listen(PORT, '0.0.0.0', () => console.log(`listening on ${PORT}`))
process.on('SIGTERM', () => server.close(() => process.exit(0)))
