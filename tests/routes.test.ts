import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const { mock } = require('bun:test')
let user: { id: string } | null = null
let active = false
let admin = false
let imageUrl: string | null = 'photo.png'
let downloads = 0
let adminClients = 0
const id = '33333333-3333-4333-8333-333333333333'
mock.module('../utils/supabase/queries', () => ({
  getUser: async () => user,
  getProfile: async () => ({ is_active: active }),
  getIsAdmin: async () => admin,
  getSupabase: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: imageUrl ? { image_url: imageUrl } : null
          })
        })
      })
    })
  })
}))
mock.module('../utils/supabase/admin', () => ({
  getAdminSupabase: () => {
    adminClients++
    return {
      storage: {
        from: () => ({
          download: async () => {
            downloads++
            return {
              data: new Blob(['image'], { type: 'image/png' }),
              error: null
            }
          }
        })
      }
    }
  }
}))
const gallery = await import('../app/api/gallery/route')
const approval = await import('../app/api/admin/approve/[token]/route')
const request = () => new Request(`https://family.example/api/gallery?id=${id}`)

test('gallery requires authentication and an active profile before storage access', async () => {
  assert.equal((await gallery.GET(request())).status, 401)
  user = { id }
  assert.equal((await gallery.GET(request())).status, 403)
  assert.equal(downloads, 0)
  active = true
  const response = await gallery.GET(request())
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(response.headers.get('content-type'), 'image/png')
  active = false
  assert.equal((await gallery.GET(request())).status, 403)
  assert.equal(downloads, 1)
})

test('gallery rejects invalid id, unknown items, traversal, and external image URLs', async () => {
  active = true
  assert.equal(
    (
      await gallery.GET(
        new Request('https://family.example/api/gallery?id=bad')
      )
    ).status,
    400
  )
  imageUrl = null
  assert.equal((await gallery.GET(request())).status, 404)
  for (const path of ['../secret.png', 'https://attacker.example/track.png']) {
    imageUrl = path
    assert.equal((await gallery.GET(request())).status, 400)
  }
  assert.equal(downloads, 1)
})

test('approval GET and POST deny token holders without an active admin session', async () => {
  const previousAdminClients = adminClients
  const context = { params: Promise.resolve({ token: 'a'.repeat(43) }) }
  const url = 'https://family.example/api/admin/approve/' + 'a'.repeat(43)
  user = null
  assert.equal((await approval.GET(new Request(url), context)).status, 307)
  assert.equal(
    (await approval.POST(new Request(url, { method: 'POST' }), context)).status,
    403
  )
  user = { id }
  admin = false
  assert.equal((await approval.GET(new Request(url), context)).status, 403)
  assert.equal(
    (await approval.POST(new Request(url, { method: 'POST' }), context)).status,
    403
  )
  assert.equal(adminClients, previousAdminClients)
})
