import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseEnv } from 'node:util'

export function selectFamily(root, familyId) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(familyId || ''))
    throw new Error('Dùng: bun run dev:family <family-id>')
  if (existsSync(path.join(root, '.next/dev/lock')))
    throw new Error(
      'Hãy dừng dev server trước khi đổi gia tộc (.next/dev/lock).'
    )

  const folder = path.join(root, 'families', familyId)
  const profilePath = path.join(folder, '.env.local')
  if (!existsSync(profilePath))
    throw new Error(`Thiếu profile families/${familyId}/.env.local`)
  const profile = readFileSync(profilePath, 'utf8')
  const env = parseEnv(profile)
  const config = JSON.parse(
    readFileSync(path.join(folder, 'config.json'), 'utf8')
  )
  if (
    env.FAMILY_ID !== familyId ||
    config.id !== familyId ||
    env.NEXT_PUBLIC_SUPABASE_URL !==
      `https://${config.supabaseProjectRef}.supabase.co`
  )
    throw new Error('Profile không khớp gia tộc/project Supabase đã chọn.')

  writeFileSync(path.join(root, '.env.local'), profile, { mode: 0o600 })
  return env
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.argv.length !== 3)
      throw new Error('Dùng: bun run dev:family <family-id>')
    const root = fileURLToPath(new URL('../', import.meta.url))
    const familyId = process.argv[2]
    const env = selectFamily(root, familyId)
    console.log(
      `Đã chọn ${familyId}. Khởi động tại ${env.APP_URL || 'localhost:3000'}.`
    )
    const child = spawn(
      process.execPath,
      [path.join(root, 'node_modules/next/dist/bin/next'), 'dev'],
      { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } }
    )
    child.on('error', () => {
      console.error('Không khởi động được dev server.')
      process.exitCode = 1
    })
    child.on('exit', (code, signal) => {
      process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1)
    })
    // The terminal sends Ctrl+C to both processes; let Next.js shut down cleanly.
    process.on('SIGINT', () => {})
    process.on('SIGTERM', () => child.kill('SIGTERM'))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
