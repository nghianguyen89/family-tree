// Run with Bun after the explicit demo fixture build described in the handoff.
// Inspect client output only; never print credentials or bundled source.
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

async function files(folder) {
  const result = []
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const target = path.join(folder, entry.name)
    if (entry.isDirectory()) result.push(...(await files(target)))
    else if (entry.name.endsWith('.js')) result.push(target)
  }
  return result
}
const selected = process.argv[2] || 'demo'
assert.match(selected, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const chunks = (
  await Promise.all(
    (await files('.next/static/chunks')).map((file) => readFile(file, 'utf8'))
  )
).join('\n')
const config = JSON.parse(
  await readFile(`families/${selected}/config.json`, 'utf8')
)
const logo = (await readFile(`families/${selected}/assets/logo.svg`)).toString(
  'base64'
)
assert.ok(
  chunks.includes(config.supabaseProjectRef),
  'Selected project ref missing from client output'
)
assert.ok(chunks.includes(logo), 'Selected logo missing from client output')
for (const entry of await readdir('families', { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === selected) continue
  const other = JSON.parse(
    await readFile(`families/${entry.name}/config.json`, 'utf8')
  )
  const otherLogo = (
    await readFile(`families/${entry.name}/assets/logo.svg`)
  ).toString('base64')
  assert.ok(
    !chunks.includes(other.supabaseProjectRef),
    'Unselected project ref leaked'
  )
  assert.ok(!chunks.includes(other.siteName), 'Unselected site name leaked')
  if (otherLogo !== logo)
    assert.ok(!chunks.includes(otherLogo), 'Unselected logo leaked')
}
assert.ok(
  !chunks.includes('sb_secret_phase1_server_only_sentinel'),
  'Server-only fixture secret leaked'
)
console.log(
  `PASS client bundle isolation for ${selected}: selected project/logo present, other families and server secret sentinel absent.`
)
