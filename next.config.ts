import fs from 'node:fs'
import path from 'node:path'

import type { NextConfig } from 'next'

import { canonicalAppUrl, parseFamilyConfig } from './utils/family-config'

// Read exactly one folder; never import a registry of all family configurations.
let publicFamily = ''
const familyId = process.env.FAMILY_ID || ''
if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(familyId)) {
  try {
    const folder = path.join(process.cwd(), 'families', familyId)
    const family = parseFamilyConfig(
      JSON.parse(fs.readFileSync(path.join(folder, 'config.json'), 'utf8')),
      familyId
    )
    const logo = fs
      .readFileSync(path.join(folder, 'assets', 'logo.svg'))
      .toString('base64')
    publicFamily = JSON.stringify({
      ...family,
      appUrl: canonicalAppUrl(process.env.APP_URL || '', family.domain),
      logo
    })
  } catch {
    /* Selection stays invalid; clients fail closed. */
  }
}

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_FAMILY_CONFIG: publicFamily },
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ]
  }
}

export default nextConfig
