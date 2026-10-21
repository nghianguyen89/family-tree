import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { selectFamily } from '../scripts/dev-family.mjs'

test('family switch copies the selected profile and rejects unsafe changes before overwriting', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'dev-family-'))
  const active = path.join(root, '.env.local')
  const folder = path.join(root, 'families/demo')
  const profilePath = path.join(folder, '.env.local')
  const profile =
    'FAMILY_ID=demo\nNEXT_PUBLIC_SUPABASE_URL=https://fixture.supabase.co\n'
  try {
    mkdirSync(folder, { recursive: true })
    writeFileSync(
      path.join(folder, 'config.json'),
      JSON.stringify({ id: 'demo', supabaseProjectRef: 'fixture' })
    )
    writeFileSync(profilePath, profile)
    writeFileSync(active, 'original')
    for (const id of ['', '../demo', 'missing']) {
      assert.throws(() => selectFamily(root, id))
      assert.equal(readFileSync(active, 'utf8'), 'original')
    }
    writeFileSync(
      profilePath,
      profile.replace('FAMILY_ID=demo', 'FAMILY_ID=other')
    )
    assert.throws(() => selectFamily(root, 'demo'), /không khớp/)
    writeFileSync(
      profilePath,
      profile.replace('fixture.supabase.co', 'other.supabase.co')
    )
    assert.throws(() => selectFamily(root, 'demo'), /không khớp/)
    assert.equal(readFileSync(active, 'utf8'), 'original')
    writeFileSync(profilePath, profile)
    mkdirSync(path.join(root, '.next/dev'), { recursive: true })
    writeFileSync(path.join(root, '.next/dev/lock'), '')
    assert.throws(() => selectFamily(root, 'demo'), /dừng dev server/)
    assert.equal(readFileSync(active, 'utf8'), 'original')
    rmSync(path.join(root, '.next/dev/lock'))
    assert.equal(selectFamily(root, 'demo').FAMILY_ID, 'demo')
    assert.equal(readFileSync(active, 'utf8'), profile)
    assert.equal(readFileSync(profilePath, 'utf8'), profile)
    mkdirSync(path.join(root, 'scripts'))
    mkdirSync(path.join(root, 'node_modules/next/dist/bin'), {
      recursive: true
    })
    const cli = path.join(root, 'scripts/dev-family.mjs')
    writeFileSync(
      cli,
      readFileSync(new URL('../scripts/dev-family.mjs', import.meta.url))
    )
    writeFileSync(
      path.join(root, 'node_modules/next/dist/bin/next'),
      "console.log('fixture-next:' + process.argv[2] + ':' + process.env.FAMILY_ID); process.exitCode = 7"
    )
    assert.throws(
      () =>
        execFileSync(process.execPath, [cli, 'demo'], {
          cwd: root,
          encoding: 'utf8',
          stdio: 'pipe'
        }),
      (error: unknown) => {
        const failure = error as { status: number; stdout: string }
        assert.equal(failure.status, 7)
        assert.match(failure.stdout, /fixture-next:dev:demo/)
        return true
      }
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
