// Local smoke check using the installed headless Edge; no external packages.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function freePort() {
  const server = net.createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}
async function waitFor(fn) {
  for (let n = 0; n < 80; n++) {
    try {
      const result = await fn()
      if (result) return result
    } catch {}
    await delay(250)
  }
  throw new Error('Timed out waiting for local browser/server')
}
const port = await freePort(),
  debugPort = await freePort()
const profile = await mkdtemp(path.join(os.tmpdir(), 'family-independent-ui-'))
const output = path.resolve('_screenshot_/family')
await mkdir(output, { recursive: true })
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '-p', String(port)],
  {
    windowsHide: true,
    stdio: 'inherit',
    // Always exercise the blocked state, even if a developer later adds real
    // environment files. No service credentials or valid runtime selection.
    env: {
      ...process.env,
      FAMILY_ID: '__invalid_fixture__',
      APP_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      SUPABASE_DB_URL: ''
    }
  }
)
let browser, socket, closeBrowser
try {
  const origin = `http://localhost:${port}`
  await waitFor(async () => {
    const r = await fetch(origin + '/missing-db-config', {
      signal: AbortSignal.timeout(1500)
    })
    return r.ok
  })
  browser = spawn(
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--disable-extensions',
      '--disable-gpu',
      'about:blank'
    ],
    { windowsHide: true, stdio: 'inherit' }
  )
  const target = await waitFor(async () => {
    if (browser.exitCode !== null)
      throw new Error('Headless Edge exited before CDP was ready')
    const list = await (
      await fetch(`http://localhost:${debugPort}/json/list`, {
        signal: AbortSignal.timeout(500)
      })
    ).json()
    return list.find((t) => t.type === 'page')
  })
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let sequence = 0
  let fixtureHtml = ''
  const pending = new Map(),
    exceptions = []
  socket.addEventListener('message', (event) => {
    const value = JSON.parse(event.data)
    if (value.id) {
      const request = pending.get(value.id)
      pending.delete(value.id)
      if (value.error) request.reject(new Error(JSON.stringify(value.error)))
      else request.resolve(value.result)
    }
    if (value.method === 'Runtime.exceptionThrown')
      exceptions.push(value.params.exceptionDetails.text)
    if (value.method === 'Fetch.requestPaused')
      void send('Fetch.fulfillRequest', {
        requestId: value.params.requestId,
        responseCode: 200,
        responseHeaders: [
          { name: 'Content-Type', value: 'text/html; charset=utf-8' }
        ],
        body: Buffer.from(fixtureHtml).toString('base64')
      })
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new Error('Timed out: ' + method))
      }, 10000)
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        }
      })
      socket.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    })
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description ||
          'Browser evaluation failed'
      )
    return result.result.value
  }
  closeBrowser = () => send('Browser.close')
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }]
  })
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  })
  const capture = async (name, width, mobile) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile
    })
    await delay(300)
    assert.equal(
      await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),
      true
    )
    await writeFile(
      path.join(output, name + '.png'),
      Buffer.from(
        (
          await send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: true
          })
        ).data,
        'base64'
      )
    )
  }
  for (const route of ['/', '/login', '/dashboard']) {
    const response = await fetch(origin + route, { redirect: 'manual' })
    assert.ok([307, 308].includes(response.status), `${route} must fail closed`)
    assert.equal(
      new URL(response.headers.get('location'), origin).pathname,
      '/missing-db-config'
    )
  }
  for (const route of ['/api/gallery', '/api/intake/fixture-token']) {
    const response = await fetch(origin + route, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}'
    })
    assert.equal(response.status, 503, route)
  }
  await send('Network.enable')
  await send('Network.setBlockedURLs', {
    urls: ['https://*', 'http://127.0.0.1:1/*']
  })
  await send('Page.navigate', { url: origin + '/missing-db-config' })
  await waitFor(() =>
    evaluate("document.body.textContent.includes('FAMILY_ID')")
  )
  assert.ok(
    await evaluate(
      "document.body.textContent.includes('Supabase') && document.body.textContent.includes('Cấu hình triển khai')"
    )
  )
  await capture('missing-config-desktop', 1440, false)
  await capture('missing-config-mobile', 390, true)
  await send('Network.setCookie', {
    name: 'locale',
    value: 'en',
    url: origin,
    path: '/'
  })
  await send('Page.reload')
  await waitFor(() =>
    evaluate(
      "document.body.textContent.includes('Deployment configuration is invalid')"
    )
  )
  await capture('missing-config-en', 390, true)
  const css = await evaluate(
    "Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(el=>el.outerHTML).join('')"
  )
  const js = await readFile('_screenshot_/family/family-login.js', 'utf8')
  fixtureHtml = `<!doctype html><html lang="vi" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}</head><body><div id="root"></div><script type="module">${js.replaceAll('</script', '<\\/script')}</script></body></html>`
  await send('Fetch.enable', {
    patterns: [
      {
        urlPattern: origin + '/__family_login_fixture__',
        requestStage: 'Request'
      }
    ]
  })
  await send('Page.navigate', { url: origin + '/__family_login_fixture__' })
  await waitFor(() => evaluate("!!document.querySelector('#email-address')"))
  assert.deepEqual(
    await evaluate(
      "[document.querySelector('#email-address').value,document.querySelector('#password').value]"
    ),
    ['', '']
  )
  assert.ok(
    await evaluate("document.body.textContent.includes('Website Demo')")
  )
  await capture('login-desktop', 1280, false)
  await capture('login-mobile', 390, true)
  await evaluate(
    "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Google').click()"
  )
  await waitFor(() => evaluate('window.familyLoginFixture.calls.length>0'))
  assert.equal(
    await evaluate(
      "window.familyLoginFixture.calls.find(c=>c.kind==='oauth').options.redirectTo"
    ),
    'https://canonical-family.example/auth/callback'
  )
  await waitFor(() =>
    evaluate("!document.querySelector('button[type=submit]').disabled")
  )
  await evaluate(
    "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Chưa có tài khoản')).click()"
  )
  await waitFor(() => evaluate("!!document.querySelector('#confirmPassword')"))
  for (const [id, value] of [
    ['email-address', 'fixture@example.com'],
    ['password', 'fixture-password'],
    ['confirmPassword', 'fixture-password']
  ]) {
    await evaluate(
      `(()=>{const el=document.getElementById(${JSON.stringify(id)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}))})()`
    )
  }
  await evaluate("document.querySelector('form').requestSubmit()")
  await waitFor(() =>
    evaluate("window.familyLoginFixture.calls.some(c=>c.kind==='signup')")
  )
  assert.equal(
    await evaluate(
      "window.familyLoginFixture.calls.find(c=>c.kind==='signup').options.emailRedirectTo"
    ),
    'https://canonical-family.example/auth/callback'
  )
  const { checkUpgrade } = await import('./check-upgrade.mjs')
  await checkUpgrade({
    origin,
    send,
    evaluate,
    waitFor,
    setHtml: (html) => {
      fixtureHtml = html
    }
  })
  assert.deepEqual(exceptions, [])
  console.log(
    'Family browser PASS: fail-closed routes/API; bilingual missing config; blank demo credentials; canonical OAuth/email redirects; mobile/desktop; upgrade scenarios. Synthetic Auth only; no Supabase calls.'
  )
  console.log('Screenshots: _screenshot_/family and _screenshot_/upgrade')
} finally {
  if (socket?.readyState === WebSocket.OPEN)
    await closeBrowser?.().catch(() => {})
  socket?.close()
  browser?.kill()
  server.kill()
}
