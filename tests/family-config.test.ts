import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import {
  canonicalAppUrl,
  parseFamilyConfig,
  validateDatabaseBinding,
  validateKeyProject,
  validatePublicBinding
} from '../utils/family-config'

const a = parseFamilyConfig(
  JSON.parse(readFileSync('families/demo/config.json', 'utf8')),
  'demo'
)
const b = parseFamilyConfig(
  JSON.parse(readFileSync('families/legiatrang/config.json', 'utf8')),
  'legiatrang'
)
const key = (ref: string, role = 'anon') =>
  `e30.${Buffer.from(JSON.stringify({ ref, role })).toString('base64url')}.fixture`

test('family selection rejects missing, traversal, mismatched and unsupported config without fallback', () => {
  for (const [value, id] of [
    [null, ''],
    [a, '../demo'],
    [a, 'legiatrang'],
    [{ ...a, configVersion: 2 }, 'demo']
  ]) {
    assert.throws(() => parseFamilyConfig(value, id as string))
  }
  assert.equal(
    parseFamilyConfig({ ...a, serviceRoleKey: 'secret' }, 'demo').siteName,
    a.siteName
  )
  assert.ok(
    !JSON.stringify(
      parseFamilyConfig({ ...a, serviceRoleKey: 'secret' }, 'demo')
    ).includes('secret')
  )
})

test('public, admin and SQL credentials remain bound to the selected project', () => {
  validatePublicBinding(
    a,
    `https://${a.supabaseProjectRef}.supabase.co`,
    key(a.supabaseProjectRef)
  )
  assert.throws(() =>
    validatePublicBinding(
      a,
      `https://${b.supabaseProjectRef}.supabase.co`,
      key(b.supabaseProjectRef)
    )
  )
  assert.throws(() =>
    validatePublicBinding(
      a,
      `https://${a.supabaseProjectRef}.supabase.co`,
      key(b.supabaseProjectRef)
    )
  )
  assert.throws(() =>
    validateKeyProject(
      key(a.supabaseProjectRef, 'service_role'),
      a.supabaseProjectRef,
      'anon'
    )
  )
  assert.throws(() =>
    validateKeyProject(
      key(b.supabaseProjectRef, 'service_role'),
      a.supabaseProjectRef,
      'service_role'
    )
  )
  validateDatabaseBinding(
    `postgresql://postgres:fixture@db.${a.supabaseProjectRef}.supabase.co/postgres?sslmode=require`,
    a.supabaseProjectRef
  )
  validateDatabaseBinding(
    `postgresql://postgres.${a.supabaseProjectRef}:fixture@aws-0-region.pooler.supabase.com:5432/postgres`,
    a.supabaseProjectRef
  )
  for (const url of [
    `postgresql://postgres:fixture@db.${b.supabaseProjectRef}.supabase.co/postgres`,
    `postgresql://postgres:fixture@db.${a.supabaseProjectRef}.supabase.co/postgres?host=evil.example`,
    `postgresql://postgres:fixture@db.${a.supabaseProjectRef}.supabase.co/postgres?sslmode=disable`
  ]) {
    assert.throws(() => validateDatabaseBinding(url, a.supabaseProjectRef))
  }
})

test('canonical URL allows explicit local development and rejects a different family host', () => {
  assert.equal(
    canonicalAppUrl(`https://${a.domain}`, a.domain),
    `https://${a.domain}`
  )
  assert.equal(
    canonicalAppUrl('http://localhost:3001', a.domain),
    'http://localhost:3001'
  )
  for (const url of [
    'https://legiatrang.example.com',
    `http://${a.domain}`,
    `https://${a.domain}/other`,
    `https://user:pass@${a.domain}`
  ])
    assert.throws(() => canonicalAppUrl(url, a.domain))
})

test('build configuration exposes only selected family fields and assets; invalid selection exposes none', () => {
  const selected = (familyId: string, appUrl = 'http://localhost:3000') =>
    JSON.parse(
      execFileSync(
        process.execPath,
        [
          '-e',
          "import config from './next.config.ts'; process.stdout.write(JSON.stringify(config.env))"
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            FAMILY_ID: familyId,
            APP_URL: appUrl,
            SUPABASE_SERVICE_ROLE_KEY: 'server-only-sentinel'
          },
          encoding: 'utf8'
        }
      )
    )
  const outputA = selected('demo')
  const outputB = selected('legiatrang')
  assert.ok(outputA.NEXT_PUBLIC_FAMILY_CONFIG.includes(a.siteName))
  assert.ok(!JSON.stringify(outputA).includes(b.siteName))
  assert.ok(!JSON.stringify(outputA).includes(b.supabaseProjectRef))
  assert.ok(!JSON.stringify(outputA).includes('server-only-sentinel'))
  assert.notEqual(
    JSON.parse(outputA.NEXT_PUBLIC_FAMILY_CONFIG).logo,
    JSON.parse(outputB.NEXT_PUBLIC_FAMILY_CONFIG).logo
  )
  assert.equal(selected('missing').NEXT_PUBLIC_FAMILY_CONFIG, '')
  assert.equal(selected('../demo').NEXT_PUBLIC_FAMILY_CONFIG, '')
  assert.equal(
    JSON.parse(
      selected('demo', 'https://demo-familytree.vercel.app')
        .NEXT_PUBLIC_FAMILY_CONFIG
    ).appUrl,
    'https://demo-familytree.vercel.app'
  )
  assert.equal(
    selected('demo', 'https://demo.example.com').NEXT_PUBLIC_FAMILY_CONFIG,
    ''
  )
})

test('all actual clients fail before network access on missing or mismatched deployment', () => {
  const result = execFileSync(
    process.execPath,
    [
      '-e',
      `
    import { createClient as browser } from './utils/supabase/client.ts';
    import { createClient as server } from './utils/supabase/server.ts';
    let blocked=0;
    for (const fn of [browser,()=>server({getAll:()=>[],set:()=>{}})]) {
      try { fn(); } catch { blocked++; }
    }
    if (blocked !== 2) throw new Error('Client did not fail closed');
  `
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_FAMILY_CONFIG: '',
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: ''
      },
      encoding: 'utf8'
    }
  )
  assert.equal(result, '')
})

test('service, public intake and direct proxy requests fail closed without a deployment', () => {
  execFileSync(
    process.execPath,
    [
      '--conditions=react-server',
      '-e',
      `
    import { getAdminSupabase } from './utils/supabase/admin.ts';
    import { getPublicIntakeClient } from './utils/supabase/public-intake.ts';
    import { proxy } from './proxy.ts';
    import { NextRequest } from 'next/server';
    let blocked=0;
    for(const fn of [getAdminSupabase,getPublicIntakeClient]) {
      try { fn(); } catch { blocked++; }
    }
    if(blocked!==2) throw new Error('Client did not block');
    for(const pathname of ['/api/media/upload','/api/intake/token']) {
      const response=await proxy(new NextRequest('https://attacker.example'+pathname,{method:'POST'}));
      if(response.status!==503) throw new Error('API was not blocked');
    }
    const response=await proxy(new NextRequest('https://attacker.example/contribute/token'));
    if(!response.headers.get('location')?.endsWith('/missing-db-config')) throw new Error('Public route did not block');
  `
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_FAMILY_CONFIG: '',
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: ''
      },
      encoding: 'utf8'
    }
  )
})

test('a selected build rejects missing runtime selection and mismatched server credentials', () => {
  execFileSync(
    process.execPath,
    [
      '-e',
      `
    import nextConfig from './next.config.ts';
    import {getDeploymentConfig,getPublicDeploymentConfig} from './utils/deployment.ts';
    process.env.NEXT_PUBLIC_FAMILY_CONFIG=nextConfig.env.NEXT_PUBLIC_FAMILY_CONFIG;
    if(getDeploymentConfig().id!=='demo') throw new Error('Selection failed');
    const changes={FAMILY_ID:'legiatrang',APP_URL:'https://legiatrang.example.com',SUPABASE_SERVICE_ROLE_KEY:${JSON.stringify(key(b.supabaseProjectRef, 'service_role'))},SUPABASE_DB_URL:'postgresql://postgres:fixture@db.${b.supabaseProjectRef}.supabase.co/postgres'};
    for(const [name,value] of Object.entries(changes)) {
      const previous=process.env[name]; process.env[name]=value;
      let blocked=false; try{getDeploymentConfig()}catch{blocked=true}
      if(getPublicDeploymentConfig().id!=='demo') throw new Error('Public branding changed due to server configuration');
      if(previous===undefined) delete process.env[name]; else process.env[name]=previous;
      if(!blocked) throw new Error('Mismatched server setting was accepted: '+name);
    }
    delete process.env.FAMILY_ID;
    let blocked=false; try{getDeploymentConfig()}catch{blocked=true}
    if(!blocked) throw new Error('Missing runtime family accepted');
  `
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        FAMILY_ID: 'demo',
        APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: `https://${a.supabaseProjectRef}.supabase.co`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: key(a.supabaseProjectRef),
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_DB_URL: ''
      },
      encoding: 'utf8'
    }
  )
})
