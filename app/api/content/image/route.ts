import { NextResponse } from 'next/server'

import { CONTENT_UUID } from '@/utils/content'
import { getAdminSupabase } from '@/utils/supabase/admin'
import { getSupabase } from '@/utils/supabase/queries'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !CONTENT_UUID.test(id))
    return new NextResponse('Invalid id', { status: 400 })
  // The session client applies public/member/editor RLS before the service client downloads.
  const db = await getSupabase()
  const { data: image, error } = await db
    .from('home_content_images')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle()
  if (
    error ||
    !image ||
    !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(image.storage_path)
  )
    return new NextResponse('Not found', { status: 404 })
  try {
    const { data, error: downloadError } = await getAdminSupabase()
      .storage.from('home-content')
      .download(image.storage_path)
    if (downloadError || !data)
      return new NextResponse('Not found', { status: 404 })
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(data.type))
      return new NextResponse('Unsupported image', { status: 415 })
    return new NextResponse(data, {
      headers: {
        'Content-Type': data.type,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer'
      }
    })
  } catch {
    return new NextResponse('Image unavailable', { status: 503 })
  }
}
