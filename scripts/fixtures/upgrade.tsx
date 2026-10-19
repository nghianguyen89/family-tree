import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import type { MigrationStatus } from '../../app/actions/migrations'
import UpgradeManager from '../../components/UpgradeManager'
import { I18nProvider } from '../../lib/i18n/I18nProvider'
import manifest from '../../tests/fixtures/release-manifest.json'
import { evaluateReleases, parseReleaseManifest } from '../../utils/releases'

declare global {
  interface Window {
    upgradeFixture: {
      status: MigrationStatus
      applied: number
      select: (version: string, compatible?: boolean, unknown?: boolean) => void
    }
  }
}
function status(
  version: string,
  compatible = true,
  unknown = false
): MigrationStatus {
  return {
    configured: true,
    databaseReachable: true,
    schemaCompatible: compatible,
    schemaVersion:
      'docs/migrations/20261016010000_fix_media_insert_returning.sql',
    source: {
      ...evaluateReleases(version, parseReleaseManifest(manifest)),
      ...(unknown
        ? {
            state: 'unknown',
            error: 'Fixture: nguồn phát hành không khả dụng.'
          }
        : {})
    },
    migrations: [
      { id: 'fixture', file: 'docs/migrations/fixture.sql', appliedAt: null }
    ]
  }
}
window.upgradeFixture = { status: status('2.3.0'), applied: 0, select() {} }
function Fixture() {
  const [current, setCurrent] = useState(window.upgradeFixture.status)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    window.upgradeFixture.select = (version, compatible, unknown) => {
      const next = status(version, compatible, unknown)
      window.upgradeFixture.status = next
      setCurrent(next)
      setRevision((value) => value + 1)
    }
  }, [])
  return (
    <I18nProvider initialLocale='vi'>
      <main className='mx-auto max-w-7xl p-4'>
        <UpgradeManager key={revision} initialStatus={current} />
      </main>
    </I18nProvider>
  )
}
createRoot(document.getElementById('root')!).render(<Fixture />)
