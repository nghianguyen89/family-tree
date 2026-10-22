// Capture the real local application against the dedicated Demo project.
// Requires seed-demo.mjs --apply first. Credentials and browser profile stay ignored.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { parseEnv } from 'node:util'

import { createServerClient } from '@supabase/ssr'
import sharp from 'sharp'

import { branchId, id } from './demo-data.mjs'

const env = parseEnv(await readFile('families/demo/.env.local', 'utf8'))
const config = JSON.parse(await readFile('families/demo/config.json', 'utf8'))
assert.equal(env.FAMILY_ID, 'demo')
assert.equal(
  new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname,
  `${config.supabaseProjectRef}.supabase.co`
)
const operator = JSON.parse(
  await readFile('_screenshot_/demo/operator.json', 'utf8')
)
const origin = 'http://localhost:3107',
  debugPort = 9317
const output = 'docs/screenshots/demo'
await mkdir(output, { recursive: true })
const profile = await mkdtemp(path.join(os.tmpdir(), 'family-demo-capture-'))
const runtime = process.env.DEMO_NODE_PATH || 'C:/nvm4w/nodejs/node.exe'
const appEnv = { ...process.env, ...env, APP_URL: origin }
if (!process.argv.includes('--skip-build')) {
  console.log('Building Demo with Node.js for production screenshots')
  const build = spawn(
    runtime,
    ['node_modules/next/dist/bin/next', 'build', '--webpack'],
    { windowsHide: true, stdio: 'inherit', env: appEnv }
  )
  assert.equal(
    await new Promise((resolve, reject) => {
      build.on('exit', resolve)
      build.on('error', reject)
    }),
    0,
    'Demo build failed'
  )
}
const server = spawn(
  runtime,
  ['node_modules/next/dist/bin/next', 'start', '-p', '3107'],
  {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: appEnv
  }
)
let serverLog = ''
server.stdout.on('data', (d) => {
  serverLog = (serverLog + d).slice(-8000)
})
server.stderr.on('data', (d) => {
  serverLog = (serverLog + d).slice(-8000)
})
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitFor(fn, attempts = 120) {
  for (let n = 0; n < attempts; n++) {
    try {
      const value = await fn()
      if (value) return value
    } catch {}
    await delay(500)
  }
  throw Error('Timed out waiting for browser/application')
}
let browser, socket, send
const report = []
const exceptions = []
try {
  await waitFor(async () => {
    const r = await fetch(origin, { signal: AbortSignal.timeout(10000) })
    return r.ok
  })
  browser = spawn(
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-sync',
      '--disable-extensions',
      'about:blank'
    ],
    { windowsHide: true, stdio: 'ignore' }
  )
  const target = await waitFor(async () =>
    (
      await (await fetch(`http://localhost:${debugPort}/json/list`)).json()
    ).find((t) => t.type === 'page' && t.url === 'about:blank')
  )
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let seq = 0
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    const v = JSON.parse(event.data)
    if (v.id) {
      const p = pending.get(v.id)
      pending.delete(v.id)
      if (v.error) p.reject(Error(JSON.stringify(v.error)))
      else p.resolve(v.result)
    }
    if (v.method === 'Runtime.exceptionThrown')
      exceptions.push(
        v.params.exceptionDetails.exception?.description ||
          v.params.exceptionDetails.text
      )
  })
  send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const key = ++seq
      pending.set(key, { resolve, reject })
      socket.send(JSON.stringify({ id: key, method, params }))
    })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    })
    if (r.exceptionDetails)
      throw Error(
        r.exceptionDetails.exception?.description || 'Evaluation failed'
      )
    return r.result.value
  }
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false
  })
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }]
  })
  async function navigate(route, ready) {
    await send('Page.navigate', { url: origin + route })
    await waitFor(() =>
      evaluate(
        `location.pathname===${JSON.stringify(route.split('?')[0])} && document.readyState==='complete' && !!document.querySelector('main,form') && !document.querySelector('main [aria-busy="true"]')`
      )
    )
    if (ready) await waitFor(() => evaluate(`Boolean(${ready})`))
    await evaluate('document.fonts.ready.then(()=>true)')
    await delay(1800)
    const visibleImages =
      'Array.from(document.images).filter(image=>{const r=image.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0})'
    await waitFor(() =>
      evaluate(`${visibleImages}.every(image=>image.complete)`)
    )
    assert.equal(
      await evaluate(
        `${visibleImages}.filter(image=>image.naturalWidth===0).length`
      ),
      0,
      `Broken images on ${route}`
    )
    const text = await evaluate('document.body.innerText')
    assert.ok(
      !/Application error:|Internal Server Error|Runtime Error/.test(text),
      `Error on ${route}`
    )
    return text
  }
  async function capture(name, route, ready) {
    const text = await navigate(route, ready)
    if (name === 'branch') {
      await evaluate(
        "document.querySelector('#tree-toolbar-portal')?.scrollIntoView({block:'start'})"
      )
      await delay(800)
    }
    // Never publish an existing real account email in the user management capture.
    if (
      name === 'users' &&
      (text.match(/[\w.+-]+@[\w.-]+\.[a-z]+/gi) || []).some(
        (e) => !e.endsWith('@example.test')
      )
    ) {
      report.push({
        name,
        route,
        status: 'skipped: existing non-demo account email'
      })
      return
    }
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    })
    const bytes = await sharp(Buffer.from(result.data, 'base64'))
      .webp({ quality: 86 })
      .toBuffer()
    await writeFile(`${output}/${name}.webp`, bytes)
    report.push({ name, route, status: 'captured', bytes: bytes.length })
    console.log(`Captured ${name}`)
  }
  await capture('home', '/', "document.querySelector('#albums-heading')")
  await capture('login', '/login')
  const cookies = []
  const auth = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    { cookies: { getAll: () => [], setAll: (items) => cookies.push(...items) } }
  )
  const signed = await auth.auth.signInWithPassword({
    email: operator.email,
    password: operator.password
  })
  assert.equal(signed.error, null, 'Demo operator login failed')
  assert.ok(cookies.length)
  await send('Network.setCookies', {
    cookies: cookies.map((c) => ({
      name: c.name,
      value: c.value,
      url: origin,
      path: '/',
      httpOnly: c.options.httpOnly ?? false,
      secure: false,
      sameSite: 'Lax'
    }))
  })
  await capture('dashboard', '/dashboard')
  await capture(
    'members',
    '/dashboard/members?view=list',
    "document.body.innerText.includes('An Văn Khởi')"
  )
  await capture(
    'tree',
    `/dashboard/members?view=tree&rootId=${id(1)}`,
    "document.body.innerText.includes('An Văn Khởi')"
  )
  await capture(
    'mindmap',
    `/dashboard/members?view=mindmap&rootId=${id(1)}`,
    "!!document.querySelector('svg')"
  )
  await capture('member-detail', `/dashboard/members/${id(14)}`)
  await capture('member-form', `/dashboard/members/${id(1)}/edit`)
  await capture('kinship', `/dashboard/kinship?p1=${id(18)}&p2=${id(7)}`)
  for (const name of [
    'stats',
    'events',
    'gallery',
    'content',
    'intake',
    'lineage',
    'data',
    'users',
    'upgrade'
  ])
    await capture(name, `/dashboard/${name}`)
  await capture(
    'branch',
    `/dashboard/branches/${branchId}?view=tree`,
    "document.body.innerText.includes('Nguyễn')"
  )
  await evaluate("localStorage.setItem('giapha-theme','dark')")
  await capture(
    'dark',
    '/dashboard/stats',
    "document.documentElement.dataset.theme==='dark'"
  )
  await evaluate("localStorage.setItem('giapha-theme','light')")
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  })
  await capture(
    'mobile',
    '/dashboard/members?view=list',
    "document.body.innerText.includes('An Văn Khởi')"
  )
  assert.equal(
    await evaluate('document.documentElement.scrollWidth<=innerWidth'),
    true,
    'Mobile overflow'
  )
  assert.deepEqual(exceptions, [], 'Browser runtime errors')
  await writeFile(
    `${output}/capture-report.json`,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        environment:
          'Real local Next.js UI with fictional records in dedicated Demo Supabase; not a deployment check',
        desktop: { width: 1440, height: 1050 },
        mobile: { width: 390, height: 844 },
        screens: report,
        runtimeExceptions: exceptions
      },
      null,
      2
    ) + '\n'
  )
  console.log(
    `PASS: ${report.filter((r) => r.status === 'captured').length} screenshots, real authenticated UI; mobile width and runtime checked`
  )
} catch (error) {
  // Avoid dumping server logs: they can contain auth callbacks and identifiers.
  console.error(error.message)
  await writeFile('_screenshot_/demo/server.log', serverLog)
  console.error(
    `Server state: ${server.exitCode === null ? 'running' : 'exited ' + server.exitCode}; log retained only in memory`
  )
  process.exitCode = 1
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    await send('Browser.close').catch(() => {})
    socket.close()
  }
  browser?.kill()
  server.kill()
}
