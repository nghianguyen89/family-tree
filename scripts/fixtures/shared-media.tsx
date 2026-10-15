// Isolated UI fixture: all actions, uploads and file URLs are local synthetic data.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import ContentBody from '../../components/content/ContentBody'
import MediaManager from '../../components/content/MediaManager'
import MediaLibrary from '../../components/media/MediaLibrary'
import { I18nProvider } from '../../lib/i18n/I18nProvider'
import type { ContentImage, ContentInput } from '../../types/content'
import type { MediaAsset } from '../../types/media'

declare global {
  interface Window {
    sharedMediaFixture: {
      assets: MediaAsset[]
      placements: Record<string, ContentImage[]>
      requests: number
      stored: number
      urls: Record<string, string>
      actions: Record<string, (...args: never[]) => unknown>
    }
  }
}
const sources: Record<string, string> = {}
const assets: MediaAsset[] = Array.from({ length: 8 }, (_, index) => {
  const width = index % 3 === 0 ? 600 : index % 3 === 1 ? 1200 : 800,
    height = index % 3 === 0 ? 1000 : 800
  const id = `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`
  sources[id] =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${['#d97706', '#57534e', '#1c1917'][index % 3]}"/><circle cx="50%" cy="45%" r="120" fill="#fafaf9"/><text x="50%" y="70%" text-anchor="middle" fill="#fafaf9" font-size="40">Photo ${index + 1}</text></svg>`
    )
  return {
    id,
    title:
      index === 0
        ? 'Portrait <img src=x onerror=alert(1)>'
        : `Photo ${index + 1}`,
    description: 'Synthetic image',
    event_date: null,
    width: index === 3 ? null : width,
    height: index === 3 ? null : height,
    library_visible: true,
    created_at: '2026-10-15T00:00:00Z',
    created_by: null
  }
})
const placements: Record<string, ContentImage[]> = {}
const hashes = new Map<string, string>()
const state = (window.sharedMediaFixture = {
  assets,
  placements,
  requests: 0,
  stored: 0,
  urls: sources,
  actions: {}
})
const nativeFetch = window.fetch.bind(window)
window.fetch = async (input, init) => {
  if (input !== '/api/media/upload') return nativeFetch(input, init)
  state.requests++
  const file = (init!.body as FormData).get('file') as File
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    )
  )
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  const duplicate = hashes.get(hash)
  if (duplicate)
    return Response.json({
      asset: state.assets.find((asset) => asset.id === duplicate),
      reused: true
    })
  const bitmap = await createImageBitmap(file),
    id = crypto.randomUUID()
  const asset: MediaAsset = {
    id,
    title: file.name.replace(/\.[^.]+$/, ''),
    description: '',
    event_date: null,
    width: bitmap.width,
    height: bitmap.height,
    library_visible: true,
    created_at: new Date().toISOString(),
    created_by: null
  }
  bitmap.close()
  state.assets.unshift(asset)
  hashes.set(hash, id)
  state.stored++
  const reader = new FileReader()
  await new Promise<void>((resolve) => {
    reader.onload = () => resolve()
    reader.readAsDataURL(file)
  })
  sources[id] = String(reader.result)
  return Response.json({ asset, reused: false }, { status: 201 })
}
Object.assign(state.actions, {
  list: async (search = '', page = 0) => ({
    assets: state.assets
      .filter((asset) => asset.title.includes(search))
      .slice(page * 36, page * 36 + 36),
    count: state.assets.length,
    error: false
  }),
  attach: async (assetId: string, entryId: string | null) => {
    const key = entryId || 'home',
      list = placements[key] || [],
      asset = state.assets.find((value) => value.id === assetId)!
    let image = list.find((image) => image.asset_id === assetId)
    if (!image) {
      image = {
        id: crypto.randomUUID(),
        asset_id: assetId,
        entry_id: entryId,
        storage_path: 'fake.png',
        alt: asset.title,
        caption: asset.description,
        position: list.length * 10
      }
      placements[key] = [...list, image]
    }
    return { image }
  },
  update: async (id: string, value: Partial<MediaAsset>) => {
    state.assets = state.assets.map((asset) =>
      asset.id === id ? { ...asset, ...value } : asset
    )
    return { success: true }
  },
  remove: async (id: string) =>
    Object.values(placements).some((images) =>
      images.some((image) => image.asset_id === id)
    )
      ? { error: 'inUse' }
      : ((state.assets = state.assets.filter((asset) => asset.id !== id)),
        { success: true }),
  detach: async (id: string) => {
    for (const key of Object.keys(placements))
      placements[key] = placements[key].filter((image) => image.id !== id)
    return { success: true }
  }
})
const entry: ContentInput = {
  kind: 'album',
  title: 'Synthetic album',
  summary: '',
  body: '',
  category: 'news',
  status: 'published',
  visibility: 'public',
  is_featured: false,
  publish_at: '2026-10-15T00:00:00Z',
  expires_at: null,
  event_start: null,
  event_end: null,
  location: ''
}
function Fixture() {
  const [mode, setMode] = useState('library')
  const albumId =
    mode === 'album-b'
      ? 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  return (
    <I18nProvider initialLocale='vi'>
      <nav className='flex flex-wrap gap-4 p-4'>
        <button id='mode-library' onClick={() => setMode('library')}>
          Library
        </button>
        <button id='mode-album-a' onClick={() => setMode('album-a')}>
          Album A
        </button>
        <button id='mode-album-b' onClick={() => setMode('album-b')}>
          Album B
        </button>
        <button id='mode-public' onClick={() => setMode('public')}>
          Public album
        </button>
      </nav>
      <main className='mx-auto max-w-7xl p-4'>
        {mode === 'library' && (
          <MediaLibrary
            initialAssets={[...state.assets]}
            count={state.assets.length}
            editable
          />
        )}
        {(mode === 'album-a' || mode === 'album-b') && (
          <MediaManager
            key={mode}
            entryId={albumId}
            initialImages={placements[albumId] || []}
            onImagesChange={(images) => {
              placements[albumId] = images
            }}
          />
        )}
        {mode === 'public' && (
          <ContentBody
            entry={entry}
            images={state.assets.map((asset, index) => ({
              id: asset.id,
              asset_id: asset.id,
              entry_id: null,
              storage_path: 'fake.png',
              alt: asset.title,
              caption: asset.description,
              position: index
            }))}
            locale='vi'
          />
        )}
      </main>
    </I18nProvider>
  )
}
createRoot(document.getElementById('root')!).render(<Fixture />)
