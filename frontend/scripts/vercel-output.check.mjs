import test from 'node:test'
import assert from 'node:assert/strict'
import { deploymentConfig } from './vercel-output.mjs'

test('frontend demo needs no backend and never proxies API requests', () => {
  const config = deploymentConfig(undefined, true)
  assert.equal(config.routes[0].status, 404)
  assert.equal(config.routes[0].dest, undefined)
  assert.equal(config.routes.at(-1).dest, '/index.html')
})

test('deployment rejects missing, insecure and malformed backend origins', () => {
  for (const value of [undefined, '', 'http://api.example.com', 'https://localhost', 'https://127.0.0.1', 'https://user:password@api.example.com', 'https://api.example.com/api', 'https://api.example.com?q=1', 'https://api.example.com/#fragment']) {
    assert.throws(() => deploymentConfig(value), /BACKEND_URL/)
  }
})

test('API routing precedes SPA fallback, preserves paths and disables caching', () => {
  const { routes } = deploymentConfig('https://api.example.com/')
  const route = routes[0]
  for (const path of ['/api', '/api/auth/refresh', '/api/content/123']) {
    assert.equal(path.replace(new RegExp(`^${route.src}$`), route.dest), `https://api.example.com${path}`)
  }
  assert.equal(route.headers['Vercel-CDN-Cache-Control'], 'no-store')
  assert.equal(new RegExp(`^${route.src}$`).test('/apiary'), false)
  assert.deepEqual(routes[2], { handle: 'filesystem' })
  assert.equal(routes[3].status, 404)
  assert.equal(routes[4].dest, '/index.html')
})
