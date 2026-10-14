import { NextResponse } from 'next/server'

import { getAdminSupabase } from '@/utils/supabase/admin'
import { getProfile, getSupabase, getUser } from '@/utils/supabase/queries'
import { getGalleryStoragePath } from '@/utils/supabase/storage-path'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse('Invalid image id', { status: 400 })
  }
  if (!(await getUser())) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  if (!(await getProfile())?.is_active) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  const supabase = await getSupabase()
  const { data: item } = await supabase
    .from('gallery_items')
    .select('image_url')
    .eq('id', id)
    .maybeSingle()
  if (!item) return new NextResponse('Not found', { status: 404 })
  const path = getGalleryStoragePath(item.image_url)
  if (!path || path.length > 512 || path.includes('..')) {
    return new NextResponse('Invalid image path', { status: 400 })
  }
  // Members cannot mint shareable signed URLs directly from Storage. Use the
  // server-only client only after checking the session, profile, and item RLS.
  const { data, error } = await getAdminSupabase()
    .storage.from('gallery')
    .download(path)
  if (error || !data) return new NextResponse('Not found', { status: 404 })
  if (
    !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(data.type)
  ) {
    return new NextResponse('Unsupported image type', { status: 415 })
  }
  return new NextResponse(data, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': data.type,
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff'
    }
  })
}
