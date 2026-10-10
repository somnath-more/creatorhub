import { cp, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export function deploymentConfig(value) {
  let backend
  try { backend = new URL(value) } catch { throw new Error('Set BACKEND_URL to your public HTTPS Spring Boot origin.') }
  if (backend.protocol !== 'https:' || backend.username || backend.password ||
      backend.pathname !== '/' || backend.search || backend.hash ||
      ['localhost', '127.0.0.1', '[::1]'].includes(backend.hostname)) {
    throw new Error('BACKEND_URL must be a public HTTPS origin without credentials, path, query or fragment.')
  }
  return {
    version: 3,
    routes: [
      { src: '(/api(?:/.*)?)', dest: `${backend.origin}$1`, headers: { 'Cache-Control': 'private, no-store', 'CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store' } },
      { src: '/assets/.*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
      { handle: 'filesystem' },
      { src: '/assets/.*', status: 404 },
      { src: '/.*', dest: '/index.html', headers: { 'Cache-Control': 'no-cache' } },
    ],
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = deploymentConfig(process.env.BACKEND_URL)
  const frontend = new URL('../', import.meta.url)
  const output = new URL('.vercel/output/', frontend)
  await mkdir(output, { recursive: true })
  await cp(new URL('dist/', frontend), new URL('static/', output), { recursive: true })
  await writeFile(new URL('config.json', output), JSON.stringify(config, null, 2))
  console.log('Vercel output ready: static frontend and same-origin API proxy.')
}
