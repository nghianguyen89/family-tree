// Local smoke check using the installed headless Edge; no external packages.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
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
      '--disable-gpu',
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
    if (result.exceptionDetails) throw new Error('Browser evaluation failed')
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
