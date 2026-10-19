import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

export async function checkUpgrade({
  origin,
  send,
  evaluate,
  waitFor,
  setHtml
}) {
  const css = await evaluate(
    "Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(el=>el.outerHTML).join('')"
  )
  const js = await readFile('_screenshot_/upgrade/upgrade.js', 'utf8')
  setHtml(
    `<!doctype html><html lang="vi" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}</head><body><div id="root"></div><script type="module">${js.replaceAll('</script', '<\\/script')}</script></body></html>`
  )
  await send('Fetch.enable', {
    patterns: [
      { urlPattern: origin + '/__upgrade_fixture__', requestStage: 'Request' }
    ]
  })
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  })
  await send('Page.navigate', { url: origin + '/__upgrade_fixture__' })
  await waitFor(() => evaluate("!!document.querySelector('[role=alert]')"))
  const applyButton =
    "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Áp dụng thay đổi'))"
  assert.equal(await evaluate(`${applyButton}.disabled`), false)
  assert.match(
    await evaluate("document.querySelector('[role=alert]').textContent"),
    /Bắt buộc cập nhật \(2\.3\.1\)/
  )
  assert.equal(await evaluate('window.upgradeFixture.applied'), 0)
  await evaluate(`${applyButton}.click()`)
  await waitFor(() => evaluate('window.upgradeFixture.applied===1'))
  await evaluate("window.upgradeFixture.select('2.3.1')")
  await waitFor(() =>
    evaluate(
      "!document.querySelector('[role=alert]') && document.body.textContent.includes('Có bản phát hành mới')"
    )
  )
  await evaluate("window.upgradeFixture.select('2.4.0',true,true)")
  await waitFor(() =>
    evaluate(
      "document.body.textContent.includes('nguồn phát hành không khả dụng')"
    )
  )
  assert.equal(await evaluate(`${applyButton}.disabled`), false)
  await evaluate("window.upgradeFixture.select('2.3.0',false)")
  await waitFor(() => evaluate(`${applyButton}===undefined`))
  await evaluate("window.upgradeFixture.select('2.3.0')")
  await waitFor(() => evaluate("!!document.querySelector('[role=alert]')"))
  await mkdir('_screenshot_/upgrade', { recursive: true })
  for (const [name, width, mobile] of [
    ['desktop', 1280, false],
    ['mobile', 390, true]
  ]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile
    })
    assert.equal(
      await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),
      true
    )
    await writeFile(
      `_screenshot_/upgrade/${name}.png`,
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
  console.log(
    'Upgrade browser fixture PASS: mandatory/normal/unknown, selected-schema gating, explicit apply, desktop/mobile. No real migration/feed/Auth access.'
  )
}
