import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { parseEnv } from 'node:util'

import { createClient } from '@supabase/supabase-js'
import postgres from 'postgres'
import sharp from 'sharp'

import {
  articles,
  branch,
  events,
  id,
  members,
  persons,
  relationships
} from './demo-data.mjs'

const env = parseEnv(await readFile('families/demo/.env.local', 'utf8'))
const config = JSON.parse(await readFile('families/demo/config.json', 'utf8'))
assert.equal(config.isDemo, true)
assert.equal(env.FAMILY_ID, 'demo')
assert.equal(
  new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname,
  `${config.supabaseProjectRef}.supabase.co`
)
const dbUrl = new URL(env.SUPABASE_DB_URL)
assert.ok(
  dbUrl.hostname === `db.${config.supabaseProjectRef}.supabase.co` ||
    (dbUrl.hostname.endsWith('.pooler.supabase.com') &&
      decodeURIComponent(dbUrl.username) ===
        `postgres.${config.supabaseProjectRef}`),
  'SQL project mismatch'
)
assert.ok(!dbUrl.search, 'SQL URL query overrides are not supported')
const sql = postgres(env.SUPABASE_DB_URL, {
  ssl: 'require',
  max: 1,
  connect_timeout: 15
})
const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
const check = (result) => {
  if (result.error) throw new Error(result.error.message)
  return result.data
}
try {
  const counts =
    await sql`select (select count(*)::int from public.persons) persons,(select count(*)::int from public.home_content) content,(select count(*)::int from public.family_branches) branches`
  console.log(
    JSON.stringify({
      family: 'demo',
      mode: process.argv.includes('--apply') ? 'apply' : 'read-only',
      ...counts[0]
    })
  )
  if (!process.argv.includes('--apply')) process.exitCode = 0
  else {
    // Never seed a populated demo with a different dataset. No reset/delete path.
    const own =
      await sql`select count(*)::int n from public.persons where id = any(${persons.map((p) => p.id)}::uuid[])`
    assert.equal(
      counts[0].persons,
      own[0].n,
      'Demo contains other persons; inspect before seeding'
    )
    const content =
      await sql`select count(*)::int n from public.home_content where id = any(${articles.map((p) => p.id)}::uuid[])`
    assert.equal(
      counts[0].content,
      content[0].n,
      'Demo contains other content; inspect before seeding'
    )
    await mkdir('_screenshot_/demo', { recursive: true })
    const localFile = '_screenshot_/demo/operator.json'
    let operator
    try {
      operator = JSON.parse(await readFile(localFile, 'utf8'))
    } catch {
      const email = 'demo-curator@example.test'
      const password = randomBytes(30).toString('base64url')
      const user = check(
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: 'Biên tập Demo (hư cấu)' }
        })
      ).user
      operator = { id: user.id, email, password }
      await writeFile(localFile, JSON.stringify(operator))
    }
    const assets = []
    const titles = [
      'Bình minh trên quê nhà',
      'Mùa xanh bên sông',
      'Mái nhà ký ức',
      'Đêm hội trăng rằm',
      'Đồi núi mùa thu'
    ]
    for (let i = 0; i < 5; i++) {
      const w = 1200,
        h = i === 2 ? 1500 : i === 4 ? 1000 : 720
      // Original vector landscapes: no photographs, identifiable people or external downloads.
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1200 800"><defs><linearGradient id="s" x2="0" y2="1"><stop stop-color="${['#f5dec0', '#c7dfdd', '#e8d8b9', '#253d59', '#f0dbc3'][i]}"/><stop offset="1" stop-color="#fcf3df"/></linearGradient></defs><rect width="1200" height="800" fill="url(#s)"/><circle cx="920" cy="165" r="75" fill="#f1bb63"/><path d="M0 470 Q180 240 420 460 T850 430 T1300 390 V800 H0" fill="#8b9e84"/><path d="M0 570 Q200 410 420 540 T850 530 T1300 480 V800 H0" fill="#526f63"/><path d="M-100 780 Q300 480 800 650 T1400 550 V900 H0" fill="#c7d7c5"/><path d="M0 770 Q450 540 1200 700" fill="none" stroke="#e9d4a8" stroke-width="50"/><rect x="190" y="420" width="240" height="155" rx="5" fill="#f1dfb9"/><path d="M150 430 L310 315 L470 430Z" fill="#a46e50"/><rect x="285" y="485" width="50" height="90" fill="#775947"/><path d="M80 560V330 M50 380Q80 250 120 380 M1060 600V360 M1000 430Q1070 230 1120 430" stroke="#375c4d" stroke-width="22" fill="#375c4d"/><text x="60" y="725" font-family="sans-serif" font-size="24" fill="#253f36">GIA TỘC AN · TRANH MINH HỌA DEMO</text></svg>`
      const bytes = await sharp(Buffer.from(svg))
        .webp({ quality: 85 })
        .toBuffer()
      const assetId = id(800 + i),
        storage_path = `demo/${assetId}.webp`
      check(
        await admin.storage.from('media-library').upload(storage_path, bytes, {
          contentType: 'image/webp',
          upsert: true
        })
      )
      assets.push({
        id: assetId,
        storage_bucket: 'media-library',
        storage_path,
        title: titles[i],
        description:
          'Tranh phong cảnh hư cấu tự dựng cho demo. Không phải ảnh gia đình thật.',
        library_visible: true,
        width: w,
        height: h,
        event_date: '2026-10-01'
      })
    }
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext('family-tree-demo-seed'))`
      await tx`update public.profiles set role='admin',is_active=true where id=${operator.id}`
      const columns = [...new Set(persons.flatMap((p) => Object.keys(p)))]
      const normalized = persons.map((p) =>
        Object.fromEntries(columns.map((k) => [k, p[k] ?? null]))
      )
      // Branch-owned people require the branch, while its root requires a person.
      // Deferred foreign keys resolve this cycle within the transaction.
      await tx`set constraints all deferred`
      await tx`insert into public.persons ${tx(normalized, columns)} on conflict(id) do nothing`
      await tx`insert into public.relationships ${tx(relationships.filter((r) => !r.family_branch_id))} on conflict(id) do nothing`
      await tx`insert into public.family_branches ${tx({ ...branch, root_person_id: null })} on conflict(id) do nothing`
      await tx`insert into public.family_branch_members ${tx(members)} on conflict(branch_id,person_id) do nothing`
      await tx`update public.family_branches set root_person_id=${branch.root_person_id} where id=${branch.id} and root_person_id is null`
      await tx`insert into public.relationships ${tx(relationships.filter((r) => r.family_branch_id))} on conflict(id) do nothing`
      await tx`insert into public.custom_events ${tx(events)} on conflict(id) do nothing`
      const payload = {
        anchor_id: id(14),
        sender_name: 'An Quốc Bảo (người gửi giả)',
        sender_contact: 'bao-demo@example.test',
        note: 'Hồ sơ minh họa khu chờ duyệt; chưa đưa lên cây.',
        people: [
          {
            client_id: id(951),
            relation: 'child',
            relative_to: 'anchor',
            data: {
              full_name: 'An Bảo Ngọc',
              gender: 'female',
              birth_year: 2020,
              is_deceased: false,
              note: 'Nhân vật hư cấu để minh họa duyệt thông tin.'
            }
          }
        ]
      }
      await tx`select private.validate_family_intake(${tx.json(payload)}::jsonb)`
      await tx`insert into public.family_intake_links ${tx({ id: id(950), token_hash: createHash('md5').update(randomBytes(32)).digest('hex'), title: 'Bổ sung nhánh An Quốc Bảo — demo đã tắt', root_person_id: id(14), is_active: false, expires_at: '2026-12-31T00:00:00Z' })} on conflict(id) do nothing`
      await tx`insert into public.family_intake_submissions ${tx({ id: id(952), link_id: id(950), payload: tx.json(payload), status: 'pending' })} on conflict(id) do nothing`
      for (const article of articles)
        await tx`insert into public.home_content ${tx(article)} on conflict(id) do nothing`
      await tx`insert into public.media_assets ${tx(assets)} on conflict(id) do nothing`
      for (let i = 0; i < assets.length; i++)
        await tx`insert into public.home_content_images ${tx({ id: id(900 + i), entry_id: id(702), asset_id: assets[i].id, storage_path: assets[i].storage_path, alt: titles[i], caption: assets[i].description, position: i })} on conflict(id) do nothing`
      await tx`insert into public.home_content_images ${tx({ id: id(910), entry_id: null, asset_id: assets[0].id, storage_path: assets[0].storage_path, alt: 'Phong cảnh quê nhà — tranh minh họa', caption: 'Bìa demo hư cấu', position: 0 })} on conflict(id) do nothing`
      // Only replace untouched initial settings. Re-running never overwrites edited settings.
      await tx`update public.home_settings set title='Gia tộc An',subtitle='Gìn giữ cội nguồn, kết nối năm thế hệ.',origin='Làng An Hòa (địa danh hư cấu)',introduction='Chào mừng đến với gia phả minh họa Gia tộc An. Toàn bộ hồ sơ, sự kiện và nội dung tại đây đều là dữ liệu hư cấu để trải nghiệm ứng dụng; không đại diện cho người hoặc gia đình thật.',contact='Không nhập thông tin cá nhân thật vào môi trường Demo.',cover_image_id=${id(910)} where id=1 and revision=1 and cover_image_id is null`
    })
    const verify =
      await sql`select (select count(*)::int from public.persons) persons,(select count(*)::int from public.relationships) relationships,(select count(*)::int from public.home_content) content,(select count(*)::int from public.media_assets) images`
    assert.equal(verify[0].persons, persons.length)
    console.log(
      JSON.stringify({
        status: 'PASS',
        ...verify[0],
        operator: 'Local ignored file only; no credentials published'
      })
    )
  }
} finally {
  await sql.end()
}
