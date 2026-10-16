// Local smoke check using the installed headless Edge; no external packages.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const renderingFixture = process.argv.includes('--rendering-fixture')
const avatarCropFixture = process.argv.includes('--avatar-crop-fixture')
const imageUploadFixture = process.argv.includes('--image-upload-fixture')
const navigationFixture = process.argv.includes('--navigation-fixture')
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
const profile = await mkdtemp(path.join(os.tmpdir(), 'family-home-ui-'))
const output = path.resolve('_screenshot_/home-content')
await mkdir(output, { recursive: true })
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '-p', String(port)],
  { windowsHide: true, stdio: 'ignore' }
)
let browser, socket, closeBrowser
try {
  const origin = `http://localhost:${port}`
  await waitFor(async () => {
    const r = await fetch(origin)
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
      ...(renderingFixture ? [] : ['--disable-gpu']),
      'about:blank'
    ],
    { windowsHide: true, stdio: 'ignore' }
  )
  const target = await waitFor(async () => {
    const list = await (
      await fetch(`http://localhost:${debugPort}/json/list`)
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
      pending.set(id, { resolve, reject })
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
  await send('Page.navigate', { url: origin })
  await waitFor(() =>
    evaluate("document.querySelectorAll('main section').length>=4")
  )
  await delay(700)
  assert.equal(
    await evaluate(
      "document.querySelectorAll('#announcements-heading,#articles-heading,#albums-heading').length"
    ),
    3
  )
  await writeFile(
    path.join(output, 'home-desktop.png'),
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
  await evaluate(
    'document.querySelector(\'button[aria-label="Chuyển sáng / tối"]\').click()'
  )
  await waitFor(() =>
    evaluate("document.documentElement.dataset.theme==='dark'")
  )
  await send('Page.reload')
  await waitFor(() =>
    evaluate(
      "document.documentElement.dataset.theme==='dark' && !!document.querySelector('#albums-heading')"
    )
  )
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  })
  await delay(300)
  assert.equal(
    await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),
    true
  )
  await writeFile(
    path.join(output, 'home-mobile-dark.png'),
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
  await send('Page.navigate', { url: origin + '/news?kind=album' })
  await waitFor(() =>
    evaluate(
      "!!document.querySelector('main nav[aria-label]') && location.pathname==='/news'"
    )
  )
  await send('Page.navigate', { url: origin + '/dashboard/content' })
  await waitFor(() => evaluate("location.pathname==='/login'"))
  if (navigationFixture) {
    const { checkDashboardNavigation } =
      await import('./check-dashboard-navigation.mjs')
    await checkDashboardNavigation({
      origin,
      send,
      evaluate,
      waitFor,
      setHtml: (html) => {
        fixtureHtml = html
      }
    })
  }
  if (imageUploadFixture) {
    const { checkImageUpload } = await import('./check-image-upload.mjs')
    await checkImageUpload({
      origin,
      send,
      evaluate,
      waitFor,
      setHtml: (html) => {
        fixtureHtml = html
      }
    })
  }
  if (avatarCropFixture) {
    const { checkAvatarCrop } = await import('./check-avatar-crop.mjs')
    await checkAvatarCrop({
      origin,
      send,
      evaluate,
      waitFor,
      setHtml: (html) => {
        fixtureHtml = html
      }
    })
  }
  if (renderingFixture) {
    const css = await evaluate(
      "Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(el=>el.outerHTML).join('')"
    )
    const bodyClass = await evaluate('document.body.className')
    const fragment = await readFile(
      '_screenshot_/rendering/fixture.html',
      'utf8'
    )
    fixtureHtml = `<!doctype html><html lang="vi" data-theme="light"><head><meta charset="utf-8">${css}</head><body class="${bodyClass}">${fragment}</body></html>`
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1.25,
      mobile: false
    })
    await send('Fetch.enable', {
      patterns: [
        {
          urlPattern: origin + '/__rendering_fixture__',
          requestStage: 'Request'
        }
      ]
    })
    await send('Page.navigate', { url: origin + '/__rendering_fixture__' })
    await waitFor(() =>
      evaluate("document.querySelectorAll('main button.group h3').length===72")
    )
    await waitFor(() =>
      evaluate(
        "Array.from(document.querySelectorAll('link[rel=stylesheet]')).every(link=>!!link.sheet)"
      )
    )
    await evaluate(
      'Promise.all(Array.from(document.fonts).map(font=>font.load())).then(()=>true)'
    )
    await waitFor(() =>
      evaluate(
        'Array.from(document.images).filter(img=>{const r=img.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}).every(img=>img.complete)'
      )
    )
    const filters = await evaluate(
      "Array.from(document.body.querySelectorAll('*')).filter(el=>{const s=getComputedStyle(el);return s.filter!=='none'||(s.backdropFilter&&s.backdropFilter!=='none')}).length"
    )
    assert.equal(
      filters,
      0,
      'Persistent member surfaces must not allocate filter layers'
    )
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 })
    await delay(400)
    // Compare application pixels, excluding the browser's native scrollbar:
    // its hover/idle appearance changes independently of application rendering.
    const clip = {
      x: 0,
      y: 0,
      width: await evaluate('document.documentElement.clientWidth'),
      height: 1000,
      scale: 1
    }
    const first = await send('Page.captureScreenshot', { format: 'png', clip })
    for (let i = 0; i < 24; i++) {
      await evaluate(
        `window.scrollTo(0,${i % 2 === 0 ? 2000 : 0});document.documentElement.dataset.theme='${i % 2 === 0 ? 'dark' : 'light'}'`
      )
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 400 + (i % 4) * 120,
        y: 400
      })
      await delay(30)
    }
    await evaluate(
      "window.scrollTo(0,0);document.documentElement.dataset.theme='light'"
    )
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 })
    await delay(10000)
    const last = await send('Page.captureScreenshot', { format: 'png', clip })
    await writeFile(
      '_screenshot_/rendering/before-stress.png',
      Buffer.from(first.data, 'base64')
    )
    await writeFile(
      '_screenshot_/rendering/after-stress.png',
      Buffer.from(last.data, 'base64')
    )
    assert.ok(
      first.data === last.data,
      'Viewport pixels changed after scroll/hover/theme stress'
    )
    await writeFile(
      '_screenshot_/rendering/after-stress.png',
      Buffer.from(last.data, 'base64')
    )
    console.log(
      'Rendering fixture passed: 72 synthetic members, no filter layers, identical viewport pixels after 24 scroll/theme/hover cycles. This does not reproduce every physical GPU/driver.'
    )
  }
  assert.deepEqual(exceptions, [])
  console.log(
    'Browser smoke passed: homepage sections, desktop/mobile layout, dark-mode persistence, archive, anonymous CMS redirect; no runtime exceptions.'
  )
  console.log('Screenshots: _screenshot_/home-content/')
} finally {
  if (socket?.readyState === WebSocket.OPEN)
    await closeBrowser?.().catch(() => {})
  socket?.close()
  browser?.kill()
  server.kill()
}
