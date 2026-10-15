import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

export async function checkSharedMedia({
  origin,
  send,
  evaluate,
  waitFor,
  setHtml
}) {
  const css = await evaluate(
    "Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(el=>el.outerHTML).join('')"
  )
  const js = await readFile('_screenshot_/image-upload/shared-media.js', 'utf8')
  const viewerCss = await readFile(
    '_screenshot_/image-upload/shared-media.css',
    'utf8'
  )
  setHtml(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}<style>${viewerCss}</style></head><body><div id="root"></div><script type="module">${js.replaceAll('</script', '<\\/script')}</script></body></html>`
  )
  await send('Fetch.enable', {
    patterns: [
      {
        urlPattern: origin + '/__shared_media_fixture__',
        requestStage: 'Request'
      }
    ]
  })
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  })
  await send('Page.navigate', { url: origin + '/__shared_media_fixture__' })
  await waitFor(() =>
    evaluate("document.querySelectorAll('figure[data-asset-id]').length===8")
  )
  await waitFor(() =>
    evaluate(
      "Array.from(document.querySelectorAll('figure img')).slice(0,3).every(image=>image.naturalWidth>0)"
    )
  )
  const ratios = await evaluate(
    "Array.from(document.querySelectorAll('figure img')).slice(0,3).map(image=>{const box=image.getBoundingClientRect();return {actual:box.width/box.height,expected:image.naturalWidth/image.naturalHeight,fit:getComputedStyle(image).objectFit}})"
  )
  for (const ratio of ratios) {
    assert.ok(Math.abs(ratio.actual - ratio.expected) < 0.01)
    assert.notEqual(ratio.fit, 'cover')
  }
  await mkdir('_screenshot_/shared-media', { recursive: true })
  await writeFile(
    '_screenshot_/shared-media/masonry-desktop.png',
    Buffer.from(
      (await send('Page.captureScreenshot', { format: 'png' })).data,
      'base64'
    )
  )
  await evaluate(
    "document.querySelector('a[data-photo-view]').focus();document.querySelector('a[data-photo-view]').click()"
  )
  await waitFor(() => evaluate('!!window.pswp?.opener?.isOpen'))
  assert.equal(
    await evaluate(
      "document.querySelector('.pswp__safe-caption').textContent.includes('<img src=x onerror=alert(1)>')"
    ),
    true
  )
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.pswp__safe-caption img').length"
    ),
    0
  )
  await evaluate("document.querySelector('.pswp__button--close').click()")
  await waitFor(() => evaluate("!document.querySelector('.pswp')"))
  // Force a legacy thumbnail to have no dimensions, then let the viewer resolve it.
  await evaluate(
    "(()=>{const el=document.querySelectorAll('figure a[data-photo-view]')[3];delete el.dataset.pswpWidth;delete el.dataset.pswpHeight;el.querySelector('img').removeAttribute('src');el.focus();el.click()})()"
  )
  await waitFor(() =>
    evaluate(
      "!!document.querySelector('.pswp--open')&&Array.from(document.querySelectorAll('.pswp__img')).some(image=>image.naturalWidth===600&&image.naturalHeight===1000)"
    )
  )
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'ArrowRight',
    code: 'ArrowRight',
    windowsVirtualKeyCode: 39
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'ArrowRight',
    code: 'ArrowRight',
    windowsVirtualKeyCode: 39
  })
  await waitFor(() =>
    evaluate(
      "document.querySelector('.pswp__counter')?.textContent.includes('5')"
    )
  )
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.pswp__safe-caption img').length"
    ),
    0
  )
  await evaluate("document.querySelector('.pswp__button--zoom').click()")
  await writeFile(
    '_screenshot_/shared-media/viewer.png',
    Buffer.from(
      (await send('Page.captureScreenshot', { format: 'png' })).data,
      'base64'
    )
  )
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27
  })
  await waitFor(() => evaluate("!document.querySelector('.pswp')"))
  assert.equal(
    await evaluate("document.activeElement.hasAttribute('data-photo-view')"),
    true
  )
  const clickText = async (text, scope = 'main') =>
    evaluate(
      `Array.from(document.querySelectorAll('${scope} button')).find(el=>el.textContent===${JSON.stringify(text)}).click()`
    )
  await clickText('Tải ảnh mới')
  const choose = async (names, large = false) =>
    evaluate(`(async()=>{
    const canvas=document.createElement('canvas');canvas.width=${large ? 1600 : 60};canvas.height=${large ? 1200 : 100};const ctx=canvas.getContext('2d');
    if(${large}){const pixels=ctx.createImageData(canvas.width,canvas.height);for(let offset=0;offset<pixels.data.length;offset+=65536)crypto.getRandomValues(pixels.data.subarray(offset,Math.min(offset+65536,pixels.data.length)));ctx.putImageData(pixels,0,0)}else{ctx.fillStyle='blue';ctx.fillRect(0,0,canvas.width,canvas.height)}
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png')),transfer=new DataTransfer();for(const name of ${JSON.stringify(names)})transfer.items.add(new File([blob],name,{type:'image/png'}));const input=document.querySelector('input[multiple]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));return blob.size;
  })()`)
  await choose(['same-a.png', 'same-b.png'])
  await waitFor(() =>
    evaluate("document.querySelectorAll('li img').length===2")
  )
  await clickText('Tải ảnh đã chọn')
  await waitFor(() =>
    evaluate(
      "window.sharedMediaFixture.requests===2&&!Array.from(document.querySelectorAll('button')).some(el=>el.textContent==='Đang tải')"
    )
  )
  assert.equal(await evaluate('window.sharedMediaFixture.stored'), 1)
  assert.equal(
    await evaluate("document.querySelectorAll('figure[data-asset-id]').length"),
    9
  )
  const originalBytes = await choose(['large.png'], true)
  assert.ok(originalBytes > 4 * 1024 * 1024)
  await clickText('Tải ảnh đã chọn')
  await waitFor(() =>
    evaluate(
      "window.sharedMediaFixture.stored===2&&!Array.from(document.querySelectorAll('button')).some(el=>el.textContent==='Đang tải')"
    )
  )
  assert.equal(
    await evaluate(
      "Array.from(document.querySelectorAll('li')).some(el=>el.textContent.includes('Đã nén:'))"
    ),
    true
  )
  await evaluate("document.querySelector('#mode-album-a').click()")
  await clickText('Chọn từ thư viện')
  await waitFor(() =>
    evaluate("document.querySelectorAll('dialog[open] img').length===10")
  )
  await evaluate(
    "Array.from(document.querySelectorAll('dialog[open] button')).find(el=>el.textContent==='Dùng ảnh này').click()"
  )
  await waitFor(() =>
    evaluate(
      'Object.values(window.sharedMediaFixture.placements).flat().length===1'
    )
  )
  await clickText('Đóng', 'dialog')
  await evaluate("document.querySelector('#mode-album-b').click()")
  await clickText('Chọn từ thư viện')
  await waitFor(() =>
    evaluate("document.querySelectorAll('dialog[open] img').length===10")
  )
  await evaluate(
    "Array.from(document.querySelectorAll('dialog[open] button')).find(el=>el.textContent==='Dùng ảnh này').click()"
  )
  await waitFor(() =>
    evaluate(
      'Object.values(window.sharedMediaFixture.placements).flat().length===2'
    )
  )
  assert.equal(
    await evaluate(
      'new Set(Object.values(window.sharedMediaFixture.placements).flat().map(image=>image.asset_id)).size'
    ),
    1
  )
  assert.equal(await evaluate('window.sharedMediaFixture.requests'), 3)
  await clickText('Đóng', 'dialog')
  await clickText('Gỡ khỏi nội dung')
  await clickText('Xác nhận gỡ khỏi nội dung')
  await waitFor(() =>
    evaluate(
      'Object.values(window.sharedMediaFixture.placements).flat().length===1'
    )
  )
  assert.equal(await evaluate('window.sharedMediaFixture.assets.length'), 10)
  await evaluate("document.querySelector('#mode-library').click()")
  const used = await evaluate(
    'Object.values(window.sharedMediaFixture.placements).flat()[0].asset_id'
  )
  await evaluate(
    `document.querySelector('figure[data-asset-id="${used}"]').querySelectorAll('button')[1].click()`
  )
  await evaluate(
    `document.querySelector('figure[data-asset-id="${used}"]').querySelectorAll('button')[1].click()`
  )
  await waitFor(() =>
    evaluate(
      "Array.from(document.querySelectorAll('[role=status]')).some(el=>el.textContent.includes('Ảnh đang được dùng'))"
    )
  )
  await evaluate("document.querySelector('#mode-public').click()")
  await waitFor(() =>
    evaluate("document.querySelectorAll('a[data-photo-view]').length===10")
  )
  await evaluate('new Promise(resolve=>setTimeout(resolve,100))')
  await evaluate("document.querySelector('a[data-photo-view]').click()")
  await waitFor(() => evaluate("!!document.querySelector('.pswp--open')"))
  await waitFor(() => evaluate('!!window.pswp?.opener?.isOpen'))
  await evaluate("document.querySelector('.pswp__button--close').click()")
  await waitFor(() => evaluate("!document.querySelector('.pswp')"))
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  })
  await evaluate(
    "document.documentElement.dataset.theme='dark';document.querySelector('#mode-library').click()"
  )
  await waitFor(() =>
    evaluate("document.querySelectorAll('figure[data-asset-id]').length===10")
  )
  assert.equal(await evaluate('innerWidth'), 390)
  assert.equal(
    await evaluate('document.documentElement.scrollWidth<=innerWidth'),
    true
  )
  await writeFile(
    '_screenshot_/shared-media/masonry-mobile-dark.png',
    Buffer.from(
      (await send('Page.captureScreenshot', { format: 'png' })).data,
      'base64'
    )
  )
  console.log(
    'Shared media UI passed: natural portrait/landscape masonry, PhotoSwipe legacy dimensions/zoom/keyboard/Escape/focus, public album viewer, duplicate reuse/compression, picker reuse in two albums, detach and protected deletion, mobile dark layout. All writes mocked.'
  )
}
