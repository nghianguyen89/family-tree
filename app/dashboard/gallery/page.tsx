import GalleryClient from '@/components/GalleryClient'
import { getServerTranslations } from '@/lib/i18n/server'
import { getIsAdmin, getSupabase } from '@/utils/supabase/queries'
import { getGalleryStoragePath } from '@/utils/supabase/storage-path'

export async function generateMetadata() {
  const { t } = await getServerTranslations()
  return {
    title: `${t('galleryTitle')} | Gia Phả OS`,
    description: t('galleryDescription')
  }
}

export default async function GalleryPage() {
  const supabase = await getSupabase()
  const isAdmin = await getIsAdmin()

  const { data: items } = await supabase
    .from('gallery_items')
    .select('*')
    .order('event_date', { ascending: false, nullsFirst: false })

  const privateItems = (items || []).map((item) => {
    const storagePath = getGalleryStoragePath(item.image_url)
    return {
      ...item,
      image_url: `/api/gallery?id=${encodeURIComponent(item.id)}`,
      storage_path: storagePath
    }
  })

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col p-4 sm:p-8'>
      <GalleryClient
        key={privateItems.length}
        initialItems={privateItems}
        isAdmin={isAdmin}
      />
    </main>
  )
}
