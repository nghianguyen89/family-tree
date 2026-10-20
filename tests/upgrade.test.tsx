import assert from 'node:assert/strict'
import { promises as fs, readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

import type { MigrationStatus } from '../app/actions/migrations'
import UpgradeManager from '../components/UpgradeManager'
import { I18nProvider } from '../lib/i18n/I18nProvider'

function actions({
  latest = '2.3.0',
  admin = true,
  databaseUrl = '',
  tracking = false,
  failFetch = false
} = {}) {
  const queries: string[] = []
  const requests: Array<{ url: string; cache: string }> = []
  const sql = Object.assign(
    async (query: TemplateStringsArray) => {
      queries.push(query.join(''))
      return [{ exists: tracking }]
    },
    {
      unsafe: async (query: string) => {
        queries.push(query)
        return []
      },
      end: async () => {}
    }
  )
  const dependencies: Record<string, unknown> = {
    'node:fs': { promises: fs },
    'node:path': path,
    postgres: () => sql,
    '@/package.json': { version: '2.3.0' },
    '@/lib/i18n/server': {
      getServerTranslations: async () => ({
        locale: 'vi',
        t: (key: string) => key
      })
    },
    '@/utils/supabase/queries': { getIsAdmin: async () => admin }
  }
  const exports = {} as Pick<
    typeof import('../app/actions/migrations'),
    'getSourceVersionStatus' | 'getMigrationStatus' | 'runPendingMigrations'
  >
  const compiled = ts.transpileModule(
    readFileSync('app/actions/migrations.ts', 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }
    }
  ).outputText
  runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      assert.ok(name in dependencies, name)
      return dependencies[name]
    },
    process: {
      cwd: () => process.cwd(),
      env: { SUPABASE_DB_URL: databaseUrl }
    },
    AbortSignal,
    console: { error() {} },
    fetch: async (url: string, options: { cache: string }) => {
      requests.push({ url, cache: options.cache })
      if (failFetch) throw new Error('Offline')
      return { ok: true, json: async () => ({ version: latest }) }
    }
  })
  return { ...exports, queries, requests }
}

test('source versions use this fork without caching and compare semantic versions', async () => {
  for (const [latest, state] of [
    ['2.3.0', 'current'],
    ['2.3.0+build.5', 'current'],
    ['2.2.9', 'current'],
    ['2.3.0-rc.1', 'current'],
    ['2.3.1', 'outdated'],
    ['2.10.0', 'outdated'],
    ['invalid', 'unknown']
  ]) {
    const api = actions({ latest })
    const result = await api.getSourceVersionStatus()
    assert.equal(result.state, state, latest)
    assert.equal(
      api.requests[0].url,
      'https://raw.githubusercontent.com/nghianguyen89/family-tree/main/package.json'
    )
    assert.equal(api.requests[0].cache, 'no-store')
    assert.match(result.readmeUrl, /nghianguyen89\/family-tree/)
  }
  assert.equal(
    (await actions({ failFetch: true }).getSourceVersionStatus()).state,
    'unknown'
  )
})

test('migration inspection only reads; missing or invalid configuration is handled', async () => {
  for (const tracking of [false, true]) {
    const api = actions({
      databaseUrl: 'postgresql://example.invalid/db',
      tracking
    })
    const status = await api.getMigrationStatus()
    assert.equal(status.databaseReachable, true)
    assert.ok(status.migrations.length > 0)
    assert.equal(api.queries.length, tracking ? 2 : 1)
    for (const query of api.queries) assert.match(query.trim(), /^SELECT /)
  }
  assert.equal((await actions().getMigrationStatus()).configured, false)
  const invalid = actions({ databaseUrl: 'invalid' })
  assert.equal((await invalid.getMigrationStatus()).databaseReachable, false)
  assert.equal((await invalid.runPendingMigrations()).success, false)
  const denied = actions({ admin: false })
  assert.equal((await denied.runPendingMigrations()).success, false)
  assert.equal(denied.requests.length, 0)
})

test('unknown and outdated versions block migrations before database access', async () => {
  for (const options of [{ latest: '2.4.0' }, { failFetch: true }]) {
    const api = actions({
      ...options,
      databaseUrl: 'postgresql://example.invalid/db'
    })
    assert.equal((await api.runPendingMigrations()).success, false)
    assert.equal(api.queries.length, 0)
  }
})

test('upgrade links are connected and unknown source never claims the system is synchronized', () => {
  for (const state of ['current', 'unknown', 'outdated'] as const) {
    for (const pending of [false, true]) {
      const status: MigrationStatus = {
        configured: true,
        databaseReachable: true,
        source: {
          state,
          currentVersion: '2.3.0',
          latestVersion: state === 'unknown' ? null : '2.3.0',
          readmeUrl:
            'https://github.com/nghianguyen89/family-tree/blob/main/README.md',
          repositoryUrl:
            'https://github.com/nghianguyen89/family-tree/tree/main'
        },
        migrations: pending
          ? [{ id: 'example', file: 'docs/schema.sql', appliedAt: null }]
          : []
      }
      const html = renderToStaticMarkup(
        <I18nProvider initialLocale='vi'>
          <UpgradeManager initialStatus={status} />
        </I18nProvider>
      )
      for (const href of [
        '/setup',
        '/dashboard/data',
        'https://supabase.com/dashboard/project/_/sql/new',
        status.source.repositoryUrl,
        status.source.readmeUrl
      ]) {
        assert.ok(html.includes(`href="${href}"`), href)
      }
      assert.equal(
        html.includes('>Áp dụng thay đổi</button>'),
        pending && state === 'current'
      )
      if (state === 'unknown')
        assert.doesNotMatch(
          html,
          /Hãy cập nhật source code lên version mới nhất/
        )
      if (state !== 'current')
        assert.doesNotMatch(html, /Source code và database đang đồng bộ/)
    }
  }
})
