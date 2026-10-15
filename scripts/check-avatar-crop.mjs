import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

// Run from check-home-browser.mjs --avatar-crop-fixture after building the
// synthetic fixture with Bun. Test the real component, decoder and encoder.
export async function checkAvatarCrop({
  origin,
  send,
  evaluate,
  waitFor,
  setHtml
}) {
  const css = await evaluate(
    "Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(el=>el.outerHTML).join('')"
  )
  const js = await readFile('_screenshot_/avatar-crop/fixture.js', 'utf8')
  setHtml(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${css}</head><body><div id="root"></div><script type="module">${js.replaceAll('</script', '<\\/script')}</script></body></html>`
  )
  await send('Fetch.enable', {
    patterns: [
      {
        urlPattern: origin + '/__avatar_crop_fixture__',
        requestStage: 'Request'
      }
    ]
  })
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1100,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  })
  await send('Page.navigate', { url: origin + '/__avatar_crop_fixture__' })
  await waitFor(() => evaluate("!!document.querySelector('#open-crop')"))
  const clickText = async (text) =>
    evaluate(
      `Array.from(document.querySelectorAll('dialog button')).find(el=>el.textContent===${JSON.stringify(text)}).click()`
    )
  const open = async () => {
    await evaluate(
      "document.querySelector('#open-crop').focus();document.querySelector('#open-crop').click()"
    )
    await waitFor(() =>
      evaluate("!!document.querySelector('dialog[open] input:not(:disabled)')")
    )
  }
  const setZoom = async (value) => {
    await evaluate(
      `(()=>{const el=document.querySelector('input[type=range]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${value});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))})()`
    )
    await waitFor(() =>
      evaluate(
        `document.querySelector('dialog label span').textContent==='${Number(value).toFixed(1)}×'`
      )
    )
  }
  await open()
  await setZoom(3)
  await clickText('Hủy bỏ')
  await waitFor(() => evaluate("!document.querySelector('dialog')"))
  assert.equal(
    await evaluate("document.querySelector('#result').textContent"),
    'original'
  )
  assert.equal(await evaluate('document.activeElement.id'), 'open-crop')
  await open()
  await setZoom(3)
  const point = await evaluate(
    "(()=>{const r=document.querySelector('dialog canvas').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()"
  )
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    ...point,
    button: 'left',
    clickCount: 1
  })
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: point.x - 640,
    y: point.y,
    button: 'left',
    buttons: 1
  })
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: point.x - 640,
    y: point.y,
    button: 'left',
    clickCount: 1
  })
  await clickText('Dùng ảnh đã cắt')
  await waitFor(() =>
    evaluate("document.querySelector('#result').textContent!=='original'")
  )
  const result = JSON.parse(
    await evaluate("document.querySelector('#result').textContent")
  )
  assert.equal(result.width, 200)
  assert.equal(result.height, 200)
  assert.equal(result.type, 'image/webp')
  assert.ok(
    result.pixel[2] > 240 && result.pixel[0] < 15 && result.pixel[1] < 15,
    'Dragging must export the blue person region rather than the original green center'
  )
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true })
  await evaluate("document.documentElement.dataset.theme='dark'")
  await open()
  const mobile = await evaluate(
    "(()=>{const r=document.querySelector('dialog canvas').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()"
  )
  await send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [mobile]
  })
  await send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: mobile.x - 160, y: mobile.y }]
  })
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await waitFor(() =>
    evaluate(
      "document.querySelector('dialog canvas').getContext('2d').getImageData(256,256,1,1).data[2]>240"
    )
  )
  await clickText('Đặt lại vị trí')
  await setZoom(3)
  await mkdir('_screenshot_/avatar-crop', { recursive: true })
  await writeFile(
    '_screenshot_/avatar-crop/mobile-dark.png',
    Buffer.from(
      (await send('Page.captureScreenshot', { format: 'png' })).data,
      'base64'
    )
  )
  assert.equal(
    await evaluate('document.documentElement.scrollWidth<=innerWidth'),
    true
  )
  await clickText('Dùng ảnh đã cắt')
  await waitFor(() => evaluate("!document.querySelector('dialog')"))
  const centered = JSON.parse(
    await evaluate("document.querySelector('#result').textContent")
  )
  assert.ok(
    centered.pixel[1] > 240 && centered.pixel[0] < 15 && centered.pixel[2] < 15,
    'Reset must return the crop to the green center'
  )
  console.log(
    'Avatar crop browser checks passed: cancel/focus, zoom, mouse drag, encoded pixels/dimensions, mobile touch, reset and dark layout. No Supabase writes.'
  )
}
