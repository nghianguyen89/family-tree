import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

export async function checkDashboardNavigation({
  origin,
  send,
  evaluate,
  waitFor,
  setHtml
}) {
  const css = await evaluate(
    `Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(el=>el.outerHTML).join('')`
  )
  const js = await readFile(
    '_screenshot_/navigation/dashboard-navigation.js',
    'utf8'
  )
  setHtml(
    `<!doctype html><html lang="vi" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}</head><body><div id="root"></div><script type="module">${js.replaceAll('</script', '<\\/script')}</script></body></html>`
  )
  await send('Fetch.enable', {
    patterns: [
      {
        urlPattern: origin + '/__navigation_fixture__',
        requestStage: 'Request'
      }
    ]
  })
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  })
  await evaluate(`localStorage.setItem('giapha-theme','light')`)
  await send('Page.navigate', { url: origin + '/__navigation_fixture__' })
  await waitFor(() =>
    evaluate(`document.querySelectorAll('#dashboard-navigation a').length===17`)
  )
  const toggle = `Array.from(document.querySelectorAll('button[aria-controls="dashboard-navigation"]')).find(button=>button.getClientRects().length && !button.closest('[inert]'))`
  const panel = `document.querySelector('aside[data-expanded]')`
  const clickToggle = () => evaluate(`${toggle}.click()`)
  const expanded = (value) =>
    waitFor(() => evaluate(`${panel}.dataset.expanded==='${value}'`))
  const screenshot = async (name) => {
    await mkdir('_screenshot_/navigation', { recursive: true })
    await writeFile(
      `_screenshot_/navigation/${name}.png`,
      Buffer.from(
        (await send('Page.captureScreenshot', { format: 'png' })).data,
        'base64'
      )
    )
  }
  const key = async (key, modifiers = 0) => {
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code: key,
      windowsVirtualKeyCode: key === 'Tab' ? 9 : 27,
      modifiers
    })
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code: key,
      modifiers
    })
  }
  await expanded(false)
  assert.equal(await evaluate(`${panel}.getBoundingClientRect().width`), 64)
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-content').getBoundingClientRect().left`
    ),
    64
  )
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-navigation a[href="/dashboard/events"]').title`
    ),
    'Sự kiện'
  )
  assert.equal(
    await evaluate(`document.querySelectorAll('[aria-current="page"]').length`),
    1
  )
  await screenshot('desktop-collapsed')
  await clickToggle()
  await expanded(true)
  assert.equal(await evaluate(`${panel}.getBoundingClientRect().width`), 256)
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-content').getBoundingClientRect().left`
    ),
    256
  )
  assert.equal(
    await evaluate(
      `getComputedStyle(document.querySelector('#dashboard-navigation a')).fontSize`
    ),
    '14px'
  )
  await evaluate(
    `document.querySelector('#dashboard-navigation a[href="/dashboard/content/settings"]').click()`
  )
  await waitFor(() =>
    evaluate(
      `document.querySelector('[aria-current="page"]').getAttribute('href')==='/dashboard/content/settings'`
    )
  )
  assert.equal(
    await evaluate(`document.querySelectorAll('[aria-current="page"]').length`),
    1
  )
  await screenshot('desktop-expanded')
  await key('Escape')
  await expanded(false)
  assert.equal(await evaluate(`document.activeElement===${toggle}`), true)
  for (const [role, active, expected] of [
    ['member', true, 9],
    ['editor', true, 13],
    ['admin', false, 3],
    ['admin', true, 17]
  ]) {
    await evaluate(`window.navigationFixture.setRole('${role}',${active})`)
    await waitFor(() =>
      evaluate(
        `document.querySelectorAll('#dashboard-navigation a').length===${expected}`
      )
    )
    if (role !== 'admin')
      assert.equal(
        await evaluate(
          `!!document.querySelector('#dashboard-navigation a[href="/dashboard/users"]')`
        ),
        false
      )
  }
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true
  })
  await waitFor(() => evaluate(`window.innerWidth===375`))
  assert.equal(await evaluate(`${panel}.getBoundingClientRect().width`), 0)
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-content').getBoundingClientRect().left`
    ),
    0
  )
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-content').getBoundingClientRect().width`
    ),
    375
  )
  assert.equal(
    await evaluate(
      `getComputedStyle(document.querySelector('#dashboard-navigation')).display==='none'||document.querySelector('#dashboard-navigation a').getClientRects().length===0`
    ),
    true
  )
  assert.equal(await evaluate(`${toggle}.closest('header')!==null`), true)
  assert.equal(
    await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`),
    true
  )
  await screenshot('mobile-collapsed')
  await clickToggle()
  await expanded(true)
  await waitFor(() => evaluate(`${panel}.getAttribute('aria-modal')==='true'`))
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-content').parentElement.inert`
    ),
    true
  )
  assert.equal(await evaluate(`document.body.style.overflow`), 'hidden')
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-content').getBoundingClientRect().left`
    ),
    0
  )
  await key('Tab', 8)
  assert.equal(
    await evaluate(
      `document.activeElement===${panel}.querySelector('button[title="Đăng xuất"]') || document.activeElement===${panel}.querySelector('button[aria-label="Đăng xuất"]')`
    ),
    true
  )
  await key('Tab')
  assert.equal(await evaluate(`document.activeElement===${toggle}`), true)
  await screenshot('mobile-expanded')
  await key('Escape')
  await expanded(false)
  assert.equal(await evaluate(`document.body.style.overflow`), '')
  assert.equal(await evaluate(`document.activeElement===${toggle}`), true)
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-content').parentElement.inert`
    ),
    false
  )
  await clickToggle()
  await expanded(true)
  await evaluate(
    `document.querySelector('#dashboard-navigation a[href="/dashboard/events"]').click()`
  )
  await expanded(false)
  await waitFor(() =>
    evaluate(
      `document.querySelector('[aria-current="page"]').getAttribute('href')==='/dashboard/events'`
    )
  )
  await clickToggle()
  await expanded(true)
  await evaluate(
    `document.querySelector('button[aria-label="Đóng menu"]').click()`
  )
  await expanded(false)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 1,
    mobile: true
  })
  await clickToggle()
  await expanded(true)
  assert.equal(
    await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`),
    true
  )
  assert.equal(
    await evaluate(
      `(()=>{const nav=document.querySelector('#dashboard-navigation');nav.scrollTop=nav.scrollHeight;return nav.scrollTop>0&&nav.getBoundingClientRect().bottom<=innerHeight})()`
    ),
    true
  )
  await evaluate(`document.documentElement.dataset.theme='dark'`)
  await screenshot('mobile-dark-short-screen')
  await key('Escape')
  await expanded(false)
  await clickToggle()
  await expanded(true)
  await evaluate(
    `document.querySelector('aside button[aria-label="Đăng xuất"]').click()`
  )
  await waitFor(() =>
    evaluate(
      `window.navigationFixture.signouts===1&&window.navigationFixture.path==='/login'`
    )
  )
  await evaluate(`window.navigationFixture.setLanguage('en')`)
  await waitFor(() =>
    evaluate(`${toggle}.getAttribute('aria-label')==='Expand menu'`)
  )
  await clickToggle()
  await expanded(true)
  assert.equal(
    await evaluate(
      `!!Array.from(document.querySelectorAll('#dashboard-navigation a')).find(a=>a.textContent==='Homepage settings')`
    ),
    true
  )
  await send('Page.reload')
  await waitFor(() =>
    evaluate(`!!document.querySelector('aside[data-expanded="false"]')`)
  )
  assert.equal(await evaluate(`${panel}.getBoundingClientRect().width`), 0)
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-content').getBoundingClientRect().left`
    ),
    0
  )
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  })
  await waitFor(() => evaluate(`${panel}.getBoundingClientRect().width===64`))
  assert.equal(
    await evaluate(
      `document.querySelector('#dashboard-content').getBoundingClientRect().left`
    ),
    64
  )
  console.log(
    'Navigation browser fixture passed: desktop icon rail/expanded panel, mobile hidden sidebar/full-width content/header trigger, active routes, role filtering, overlay/inert/scroll lock, focus trap/Escape/focus return, link/outside closing, 320px dark mode, logout, English labels and resizing.'
  )
}
