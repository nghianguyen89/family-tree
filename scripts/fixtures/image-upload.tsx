// Synthetic fixture; client and action modules are replaced by the build script.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import MediaManager from '../../components/content/MediaManager'
import ImageUploadQueue from '../../components/ImageUploadQueue'
import UploadModal from '../../components/modal/UploadModal'
import { I18nProvider } from '../../lib/i18n/I18nProvider'
import type { ContentImage } from '../../types/content'

declare global {
  interface Window {
    uploadFixture: {
      cmsCalls: {
        name: string
        alt: string
        position: number
        size: number
        type: string
        width: number
        height: number
        alpha: number
      }[]
      largeFile?: File
      galleryCalls: string[]
      rows: Record<string, unknown>[]
      attempts: Record<string, number>
      cleanup: string[]
      urls: number
      revoked: number
    }
    fixtureDb: unknown
  }
}
const state = (window.uploadFixture = {
  cmsCalls: [],
  galleryCalls: [],
  rows: [],
  attempts: {},
  cleanup: [],
  urls: 0,
  revoked: 0
} as Window['uploadFixture'])
const createUrl = URL.createObjectURL.bind(URL),
  revokeUrl = URL.revokeObjectURL.bind(URL)
URL.createObjectURL = (value) => {
  state.urls++
  return createUrl(value)
}
URL.revokeObjectURL = (value) => {
  state.revoked++
  revokeUrl(value)
}
const nextAttempt = (name: string) =>
  (state.attempts[name] = (state.attempts[name] || 0) + 1)
const nativeFetch = window.fetch.bind(window)
window.fetch = async (input, init) => {
  if (input !== '/api/content/upload') return nativeFetch(input, init)
  const form = init!.body as FormData,
    file = form.get('file') as File
  const decoded = await createImageBitmap(file)
  const sample = document.createElement('canvas')
  sample.width = sample.height = 1
  const sampleContext = sample.getContext('2d')!
  sampleContext.drawImage(decoded, 0, 0)
  state.cmsCalls.push({
    name: file.name,
    alt: String(form.get('alt')),
    position: Number(form.get('position')),
    size: file.size,
    type: file.type,
    width: decoded.width,
    height: decoded.height,
    alpha: sampleContext.getImageData(0, 0, 1, 1).data[3]
  })
  decoded.close()
  const attempt = nextAttempt(`cms-${file.name}`)
  await new Promise((resolve) => setTimeout(resolve, 40))
  if (file.name === 'retry.png' && attempt === 1)
    return Response.json({ error: 'storage' }, { status: 400 })
  const image: ContentImage = {
    id: crypto.randomUUID(),
    entry_id: null,
    storage_path: 'synthetic.png',
    alt: String(form.get('alt')),
    caption: '',
    position: Number(form.get('position'))
  }
  return Response.json({ image }, { status: 201 })
}
window.fixtureDb = {
  auth: {
    getUser: async () => ({ data: { user: { id: 'fake-admin' } }, error: null })
  },
  from: () => {
    let row: Record<string, unknown> = {}
    const query = {
      insert: (value: Record<string, unknown>) => {
        row = value
        return query
      },
      update: (value: Record<string, unknown>) => {
        row = value
        return query
      },
      eq: () => query,
      select: () => query,
      single: async () => {
        state.rows.push(row)
        return { data: { id: crypto.randomUUID() }, error: null }
      }
    }
    return query
  },
  storage: {
    from: () => ({
      upload: async (_path: string, file: File) => {
        state.galleryCalls.push(file.name)
        await new Promise((resolve) => setTimeout(resolve, 40))
        return {
          error:
            file.name === 'retry.png' &&
            nextAttempt(`gallery-${file.name}`) === 1
              ? { message: 'synthetic error' }
              : null
        }
      },
      remove: async (paths: string[]) => {
        state.cleanup.push(...paths)
        return { error: null }
      }
    })
  }
}
const cover: ContentImage = {
  id: '33333333-3333-4333-8333-333333333333',
  entry_id: null,
  storage_path: 'existing.png',
  alt: 'Existing cover',
  caption: '',
  position: 10
}
function Fixture() {
  const [mode, setMode] = useState('cms')
  const [images, setImages] = useState([cover])
  const [selected, setSelected] = useState(cover.id)
  return (
    <I18nProvider initialLocale='vi'>
      <button id='cms-mode' onClick={() => setMode('cms')}>
        CMS
      </button>
      <button id='gallery-mode' onClick={() => setMode('gallery')}>
        Gallery
      </button>
      <button id='edit-mode' onClick={() => setMode('edit')}>
        Edit
      </button>
      <button id='unmount-mode' onClick={() => setMode('none')}>
        Unmount
      </button>
      <button id='limit-mode' onClick={() => setMode('limit')}>
        Limit
      </button>
      <output id='cms-images' hidden>
        {JSON.stringify(images)}
      </output>
      <output id='selected-cover' hidden>
        {selected}
      </output>
      {mode === 'cms' && (
        <MediaManager
          entryId={null}
          initialImages={images}
          selectedId={selected}
          onSelect={(image) => setSelected(image.id)}
          onImagesChange={setImages}
        />
      )}
      {mode === 'limit' && (
        <ImageUploadQueue
          maxBytes={4 * 1024 * 1024}
          allowedTypes={['image/png']}
          maxFiles={1}
          onUpload={async () => {}}
        />
      )}
      {mode === 'gallery' && (
        <UploadModal
          isOpen
          onClose={() => setMode('none')}
          onSuccess={() => setMode('none')}
        />
      )}
      {mode === 'edit' && (
        <UploadModal
          isOpen
          initialData={{
            id: 'fake-item',
            title: 'Original title',
            description: 'Original description',
            event_date: '2026-10-15',
            image_url:
              'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            created_at: '',
            created_by: null,
            storage_path: 'old.png'
          }}
          onClose={() => setMode('none')}
          onSuccess={() => setMode('none')}
        />
      )}
    </I18nProvider>
  )
}
createRoot(document.getElementById('root')!).render(<Fixture />)
