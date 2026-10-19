// Native Edge/CDP synthetic QA. Bun bundles real branch UI and EventsList with mocked actions.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const sharedId = '11111111-1111-4111-8111-111111111112'
const branchId = '22222222-2222-4222-8222-222222222222'
const otherBranchId = '33333333-3333-4333-8333-333333333333'
const output = path.resolve('_screenshot_/branches')
await mkdir(output, { recursive: true })
const cssFiles = await readdir('.next/static/css')
const css = (
  await Promise.all(
    cssFiles
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFile(`.next/static/css/${name}`, 'utf8'))
  )
).join('\n')
const js = await readFile(path.join(output, 'family-branches.js'), 'utf8')
const server = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname
  if (/^\/avatar\/v\d+\/(male|female)\.svg$/.test(pathname)) {
    readFile(path.join('public', pathname))
      .then((data) => {
        response.setHeader('content-type', 'image/svg+xml')
        response.end(data)
      })
      .catch(() => {
        response.statusCode = 404
        response.end()
      })
    return
  }
  if (pathname === '/fixture.js') {
    response.setHeader('content-type', 'application/javascript')
    response.end(js)
    return
  }
  if (pathname === '/fixture.css') {
    response.setHeader('content-type', 'text/css')
    response.end(css)
    return
  }
  response.setHeader('content-type', 'text/html; charset=utf-8')
  response.end(
    `<!doctype html><html lang="vi" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`
  )
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const fixturePort = server.address().port
const freePort = async () => {
  const netServer = net.createServer()
  await new Promise((resolve) => netServer.listen(0, '127.0.0.1', resolve))
  const port = netServer.address().port
  await new Promise((resolve) => netServer.close(resolve))
  return port
}
const debugPort = await freePort()
const profile = await mkdtemp(path.join(os.tmpdir(), 'family-branch-ui-'))
let browser, socket
try {
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
  const waitFor = async (fn) => {
    for (let i = 0; i < 80; i++) {
      try {
        const value = await fn()
        if (value) return value
      } catch {}
      await delay(250)
    }
    throw new Error('Timed out waiting for browser condition')
  }
  const target = await waitFor(async () =>
    (
      await (
        await fetch(`http://127.0.0.1:${debugPort}/json/list`, {
          signal: AbortSignal.timeout(1000)
        })
      ).json()
    ).find((entry) => entry.type === 'page')
  )
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let sequence = 0
  const pending = new Map(),
    exceptions = []
  socket.addEventListener('message', (event) => {
    const result = JSON.parse(event.data)
    if (result.id) {
      const waiting = pending.get(result.id)
      pending.delete(result.id)
      if (!waiting) return
      clearTimeout(waiting.timer)
      if (result.error) waiting.reject(new Error(JSON.stringify(result.error)))
      else waiting.resolve(result.result)
    }
    if (result.method === 'Runtime.exceptionThrown')
      exceptions.push(result.params.exceptionDetails.text)
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`CDP timed out: ${method}`))
      }, 10000)
      pending.set(id, { resolve, reject, timer })
      socket.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    })
    if (response.exceptionDetails)
      throw new Error(
        response.exceptionDetails.exception?.description ||
          response.exceptionDetails.text
      )
    return response.result.value
  }
  const screenshot = async (name) =>
    writeFile(
      path.join(output, name),
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
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 950,
    deviceScaleFactor: 1,
    mobile: false
  })
  await Promise.race([
    send('Page.navigate', {
      url: `http://127.0.0.1:${fixturePort}/dashboard/branches/22222222-2222-4222-8222-222222222222?rootId=11111111-1111-4111-8111-111111111111`
    }),
    delay(5000).then(() => {
      throw new Error(
        'Page.navigate timed out; CDP exceptions: ' + JSON.stringify(exceptions)
      )
    })
  ])
  await waitFor(() =>
    evaluate(
      "!!document.querySelector('#branch-tab') && document.body.innerText.includes('Nhánh ngoại')"
    )
  )
  await evaluate(
    `window.fixtureInput=(el,value)=>{const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}))};window.fixtureClick=(text)=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===text);if(!b)throw Error('Missing button '+text);b.click()}`
  )
  // Branch creation from an in-law anchor.
  await evaluate(
    `window.fixtureInput(document.querySelector('section input[maxlength="150"]'),'Nhánh thử mới')`
  )
  await evaluate(`window.fixtureClick('Tạo nhánh phụ')`)
  await waitFor(() =>
    evaluate("window.branchFixture.calls.some(c=>c.action==='createBranch')")
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.find(c=>c.action==='createBranch').name"
    ),
    'Nhánh thử mới'
  )
  assert.equal(
    await evaluate(
      "location.pathname.endsWith('44444444-4444-4444-8444-444444444444')"
    ),
    true
  )
  // New deceased member with an annual memorial date and no death year.
  await evaluate(
    `window.fixtureInput(document.querySelector('section[class~="lg:col-span-2"] input[maxlength="200"]'),'Người cúng không rõ năm')`
  )
  await evaluate(
    `[...document.querySelectorAll('section[class~="lg:col-span-2"] input[type="checkbox"]')].find(x=>x.parentElement.textContent.trim()==='Đã mất').click()`
  )
  await waitFor(() =>
    evaluate("document.body.innerText.includes('Thiết lập ngày cúng riêng')")
  )
  await evaluate(
    `([...document.querySelectorAll('section[class~="lg:col-span-2"] input[type="checkbox"]')].find(x=>x.parentElement.textContent.includes('Thiết lập ngày cúng riêng'))).click()`
  )
  await waitFor(() =>
    evaluate(`document.querySelector('input[id$="-day"]')!==null`)
  )
  await evaluate(
    `window.fixtureInput(document.querySelector('input[id$="-day"]'),'12')`
  )
  await evaluate(
    `window.fixtureInput(document.querySelector('input[id$="-month"]'),'5')`
  )
  await evaluate(`window.fixtureClick('Thêm vào nhánh')`)
  await waitFor(() =>
    evaluate("window.branchFixture.calls.some(c=>c.action==='addBranchPerson')")
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.find(c=>c.action==='addBranchPerson').input.payload.memorial_calendar"
    ),
    'lunar'
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.find(c=>c.action==='addBranchPerson').input.payload.death_year"
    ),
    null
  )
  // Existing-profile search and link.
  await evaluate("window.fixtureClick('Liên kết hồ sơ đã có')")
  await evaluate(
    `(()=>{const input=[...document.querySelectorAll('input')].find(x=>x.parentElement.textContent.includes('Tìm hồ sơ'));window.fixtureInput(input,'Người chung')})()`
  )
  await waitFor(() =>
    evaluate(
      '!!document.querySelector(\'select[aria-label="Liên kết hồ sơ đã có"] option[value="11111111-1111-4111-8111-111111111112"]\')'
    )
  )
  await evaluate(
    `window.fixtureInput(document.querySelector('select[aria-label="Liên kết hồ sơ đã có"]'),'${sharedId}')`
  )
  await evaluate(`window.fixtureClick('Thêm vào nhánh')`)
  await waitFor(() =>
    evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='addBranchPerson').length===2"
    )
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='addBranchPerson')[1].input.existingPersonId"
    ),
    sharedId
  )
  // Connect two existing branch profiles through the dedicated relationship form.
  await evaluate(
    `void(window.relationshipForm=[...document.querySelectorAll('form')].find(x=>!x.closest('details')&&x.querySelector('h3')?.textContent==='Thêm quan hệ giữa người đã có'))`
  )
  await evaluate(
    `window.fixtureInput(window.relationshipForm.querySelectorAll('select')[0],'${sharedId}')`
  )
  await evaluate(
    `window.fixtureInput(window.relationshipForm.querySelectorAll('select')[2],'11111111-1111-4111-8111-111111111113')`
  )
  assert.equal(
    await evaluate(
      `!!window.relationshipForm.querySelectorAll('select')[2].querySelector('option[value="${sharedId}"]')`
    ),
    false
  )
  await evaluate(
    `window.relationshipForm.querySelector('button[type="submit"]').click()`
  )
  await waitFor(() =>
    evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='addBranchPerson').length===3"
    )
  )
  assert.deepEqual(
    await evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='addBranchPerson')[2].input"
    ),
    {
      branchId,
      existingPersonId: sharedId,
      relativeId: '11111111-1111-4111-8111-111111111113',
      relation: 'spouse'
    }
  )
  await waitFor(() =>
    evaluate("document.body.innerText.includes('Đã lưu quan hệ trong nhánh.')")
  )
  // Branch-local generation can be set then cleared.
  await evaluate(
    `window.fixtureInput([...document.querySelectorAll('section')].find(x=>x.querySelector('h2')?.textContent==='Đời trong nhánh').querySelector('input[type="number"]'),'3')`
  )
  await evaluate(
    `[...document.querySelectorAll('section')].find(x=>x.querySelector('h2')?.textContent==='Đời trong nhánh').querySelector('button').click()`
  )
  await waitFor(() =>
    evaluate(
      "window.branchFixture.calls.some(c=>c.action==='updateBranchMemberGeneration')"
    )
  )
  await evaluate(
    `window.fixtureInput([...document.querySelectorAll('section')].find(x=>x.querySelector('h2')?.textContent==='Đời trong nhánh').querySelector('input[type="number"]'),'')`
  )
  await evaluate(
    `[...document.querySelectorAll('section')].find(x=>x.querySelector('h2')?.textContent==='Đời trong nhánh').querySelector('button').click()`
  )
  await waitFor(() =>
    evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='updateBranchMemberGeneration').length===2"
    )
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='updateBranchMemberGeneration')[1].generation"
    ),
    null
  )
  // Root selection persists to action and route.
  await evaluate(
    `window.fixtureInput([...document.querySelectorAll('section')].find(x=>x.querySelector('h2')?.textContent==='Nhánh phụ').querySelector('select'),'${sharedId}')`
  )
  await evaluate(
    `[...document.querySelectorAll('section')].find(x=>x.querySelector('h2')?.textContent==='Nhánh phụ').querySelector('button').click()`
  )
  await waitFor(() =>
    evaluate("window.branchFixture.calls.some(c=>c.action==='updateBranch')")
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.find(c=>c.action==='updateBranch').changes.root_person_id"
    ),
    sharedId
  )
  await evaluate(
    `window.fixtureInput([...document.querySelectorAll('section')].find(x=>x.querySelector('h2')?.textContent==='Quyền xem nhánh').querySelector('select'),'${sharedId}')`
  )
  await evaluate(
    `[...document.querySelectorAll('section')].find(x=>x.querySelector('h2')?.textContent==='Quyền xem nhánh').querySelector('button').click()`
  )
  await waitFor(() =>
    evaluate(
      "window.branchFixture.calls.some(c=>c.action==='updateBranch'&&c.changes.partner_person_id)"
    )
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.find(c=>c.action==='updateBranch'&&c.changes.partner_person_id).changes.partner_person_id"
    ),
    sharedId
  )
  await evaluate("window.confirm=()=>true;window.fixtureClick('Gỡ quan hệ')")
  await waitFor(() =>
    evaluate(
      "window.branchFixture.calls.some(c=>c.action==='removeBranchRelationship')"
    )
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.find(c=>c.action==='removeBranchRelationship').id"
    ),
    branchId
  )
  await screenshot('branch-desktop.png')
  // The profile's branch panel exposes the same scoped relationship controls.
  await evaluate(`document.querySelector('details summary').click()`)
  await evaluate(
    `void(window.profileRelationshipForm=document.querySelector('details form'))`
  )
  await evaluate(
    `window.fixtureInput(window.profileRelationshipForm.querySelectorAll('select')[2],'${sharedId}')`
  )
  await evaluate(
    `window.profileRelationshipForm.querySelector('button[type="submit"]').click()`
  )
  await waitFor(() =>
    evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='addBranchPerson').length===4"
    )
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='addBranchPerson')[3].input.relation"
    ),
    'spouse'
  )
  // Member role hides every branch write control.
  await evaluate("window.branchFixture.setRole('member')")
  await waitFor(() =>
    evaluate(
      "![...document.querySelectorAll('h2')].some(x=>x.textContent==='Đời trong nhánh')"
    )
  )
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('button')].some(x=>x.textContent.trim()==='Tạo nhánh phụ')"
    ),
    false
  )
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('h3')].some(x=>x.textContent==='Thêm quan hệ giữa người đã có')"
    ),
    false
  )
  // Calendar scopes: owned persons only in their own branch, shared person once in all.
  await evaluate("window.branchFixture.setPage('calendar')")
  await waitFor(() =>
    evaluate(`!!document.querySelector('select option[value="main"]')`)
  )
  const names = () =>
    evaluate(
      "[...document.querySelectorAll('.group p.font-medium')].map(x=>x.textContent.trim())"
    )
  let all = await names()
  assert.equal(all.filter((name) => name === 'Người chung hai nhánh').length, 1)
  assert.ok(
    all.includes('Người thuộc nhánh phụ') && all.includes('Người nhánh khác')
  )
  await evaluate("window.fixtureInput(document.querySelector('select'),'main')")
  let main = await names()
  assert.ok(
    main.includes('Người nối chính') && main.includes('Người chung hai nhánh')
  )
  assert.ok(
    !main.includes('Người thuộc nhánh phụ') &&
      !main.includes('Người nhánh khác')
  )
  await evaluate(
    `window.fixtureInput(document.querySelector('select'),'${branchId}')`
  )
  let one = await names()
  assert.ok(
    one.includes('Người thuộc nhánh phụ') &&
      one.includes('Người chung hai nhánh')
  )
  assert.ok(!one.includes('Người nhánh khác'))
  await evaluate(
    `window.fixtureInput(document.querySelector('select'),'${otherBranchId}')`
  )
  let other = await names()
  assert.ok(
    other.includes('Người nhánh khác') &&
      other.includes('Người chung hai nhánh')
  )
  assert.ok(!other.includes('Người thuộc nhánh phụ'))
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Thêm sự kiện')"
    ),
    false
  )
  await screenshot('calendar-desktop.png')
  // Vietnamese/English labels and mobile dark layout.
  await evaluate(
    "window.branchFixture.setLanguage('en');document.documentElement.dataset.theme='dark'"
  )
  await waitFor(() =>
    evaluate("document.body.innerText.includes('Calendar scope')")
  )
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  })
  await delay(250)
  assert.equal(
    await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),
    true
  )
  await screenshot('calendar-mobile-dark-en.png')
  await evaluate("window.branchFixture.setPage('branch')")
  await waitFor(() =>
    evaluate("document.body.innerText.includes('Auxiliary branch')")
  )
  assert.equal(
    await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),
    true
  )
  await screenshot('branch-mobile-dark-en.png')
  await evaluate("window.branchFixture.setRole('editor')")
  await waitFor(() =>
    evaluate("document.body.innerText.includes('Create a new profile')")
  )
  assert.equal(
    await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),
    true
  )
  await screenshot('branch-editor-mobile-dark-en.png')
  await evaluate(
    "window.branchFixture.setLanguage('vi');window.branchFixture.setPage('accounts')"
  )
  await waitFor(() =>
    evaluate('!!document.querySelector(\'select[id^="person-link-"]\')')
  )
  await evaluate(
    `window.fixtureInput(document.querySelector('select[id^="person-link-"]'),'${sharedId}')`
  )
  await evaluate("window.fixtureClick('Lưu liên kết')")
  await waitFor(() =>
    evaluate("window.branchFixture.calls.some(c=>c.action==='linkUserPerson')")
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.find(c=>c.action==='linkUserPerson').personId"
    ),
    sharedId
  )
  await screenshot('account-link-mobile.png')
  await evaluate("window.fixtureClick('Gỡ liên kết')")
  await waitFor(() =>
    evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='linkUserPerson').length===2"
    )
  )
  assert.equal(
    await evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='linkUserPerson')[1].personId"
    ),
    null
  )
  // Real RelationshipManager: a main-family in-law must show readable branch
  // parents; the mocked Supabase query applies access before returning rows.
  await evaluate("window.branchFixture.setPage('relationships')")
  await evaluate("document.querySelector('#detail-anchor-profile').click()")
  await waitFor(() =>
    evaluate("document.body.innerText.includes('Mẹ trong nhánh')")
  )
  assert.equal(
    await evaluate("document.body.innerText.includes('Người thuộc nhánh phụ')"),
    true
  )
  assert.equal(
    await evaluate("document.body.innerText.includes('Người chung hai nhánh')"),
    true
  )
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('li')].filter(x=>x.querySelector('div.flex-col > span')?.textContent==='Con dùng chung').length"
    ),
    1
  )
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('li')].find(x=>x.innerText.includes('Mẹ trong nhánh')).querySelector('button[aria-label]')===null"
    ),
    true
  )
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('li')].find(x=>x.innerText.includes('Người chung hai nhánh')).querySelector('button[aria-label]')!==null"
    ),
    true
  )
  const detailStats = await evaluate(
    "JSON.parse(document.querySelector('[data-testid=detail-stats]').textContent)"
  )
  assert.equal(detailStats.biologicalChildren, 1)
  assert.equal(detailStats.paternalGrandchildren, 1)
  assert.equal(detailStats.daughterInLaw, 1)
  await screenshot('shared-profile-parents-mobile.png')
  await evaluate("document.querySelector('#detail-parent-profile').click()")
  await waitFor(() =>
    evaluate(
      "[...document.querySelectorAll('li')].some(x=>x.innerText.includes('Người nối chính'))"
    )
  )
  assert.equal(
    await evaluate("document.querySelector('button[aria-label]')===null"),
    true
  )
  // A member with branch access sees parents, and an unrelated editor does not.
  await evaluate(
    "window.branchFixture.setPage('accounts');window.branchFixture.setRole('member')"
  )
  await evaluate("window.branchFixture.setPage('relationships')")
  await evaluate("document.querySelector('#detail-anchor-profile').click()")
  await waitFor(() =>
    evaluate("document.body.innerText.includes('Mẹ trong nhánh')")
  )
  assert.equal(
    await evaluate("document.querySelector('button[aria-label]')===null"),
    true
  )
  await evaluate(
    "window.branchFixture.setPage('accounts');window.branchFixture.setRole('editor');window.branchFixture.detail.canReadBranch=false"
  )
  await evaluate("window.branchFixture.setPage('relationships')")
  await waitFor(() =>
    evaluate("document.body.innerText.includes('Người chung hai nhánh')")
  )
  assert.equal(
    await evaluate(
      "document.body.innerText.includes('Mẹ trong nhánh')||document.body.innerText.includes('Người thuộc nhánh phụ')"
    ),
    false
  )
  // An authorized descendant editor sees inline branches but no write forms.
  await evaluate(
    "window.branchFixture.descendant=true;window.branchFixture.setPage('branch')"
  )
  await waitFor(() =>
    evaluate("document.body.innerText.includes('Nhánh ngoại')")
  )
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('h3')].some(x=>x.textContent==='Thêm quan hệ giữa người đã có')"
    ),
    false
  )
  for (const view of ['tree', 'mindmap', 'cards', 'bubble']) {
    await evaluate(`window.branchFixture.setPage('${view}')`)
    if (view === 'bubble') {
      await waitFor(() =>
        evaluate("!!document.querySelector('.auxiliary-marker')")
      )
      await evaluate(
        "document.querySelector('.auxiliary-marker').dispatchEvent(new MouseEvent('click',{bubbles:true}))"
      )
    }
    await waitFor(() =>
      evaluate("!!document.querySelector('button[aria-controls]')")
    )
    const callsBefore = await evaluate(
      "window.branchFixture.calls.filter(c=>c.action==='getBranchTreePreview').length"
    )
    await evaluate("document.querySelector('button[aria-controls]').click()")
    await waitFor(() =>
      evaluate("!!document.querySelector('[data-auxiliary-tree]')")
    )
    assert.equal(
      await evaluate(
        "document.querySelector('[data-auxiliary-tree]').innerText.includes('Mẹ trong nhánh')"
      ),
      true
    )
    assert.equal(
      await evaluate(
        "document.querySelector('[data-auxiliary-tree]').innerText.includes('Người thuộc nhánh phụ')"
      ),
      true
    )
    assert.equal(
      await evaluate(
        "document.querySelector('[data-auxiliary-tree]').innerText.includes('Người nối chính')"
      ),
      false
    )
    assert.equal(
      await evaluate(
        "document.querySelectorAll('[data-auxiliary-tree] figure').length"
      ),
      2
    )
    assert.equal(
      await evaluate(
        "document.querySelectorAll('[data-auxiliary-tree] img').length"
      ),
      2
    )
    assert.equal(
      await evaluate(
        "document.querySelector('[data-auxiliary-tree] button')===null"
      ),
      true
    )
    assert.ok(
      await evaluate(
        "(()=>{const figures=[...document.querySelectorAll('[data-auxiliary-tree] figure')];return Math.abs(figures[0].getBoundingClientRect().top-figures[1].getBoundingClientRect().top)<1})()"
      )
    )
    assert.equal(
      await evaluate(
        "window.branchFixture.calls.filter(c=>c.action==='getBranchTreePreview').length"
      ),
      callsBefore + 1
    )
    assert.equal(
      await evaluate(
        "document.querySelector('[data-auxiliary-tree] button[aria-controls]')===null"
      ),
      true
    )
    await screenshot(`inline-${view}-mobile.png`)
    await evaluate("document.querySelector('button[aria-controls]').click()")
    assert.equal(
      await evaluate("document.querySelector('[data-auxiliary-tree]')===null"),
      true
    )
    await evaluate("document.querySelector('button[aria-controls]').click()")
    await waitFor(() =>
      evaluate("!!document.querySelector('[data-auxiliary-tree]')")
    )
    assert.equal(
      await evaluate(
        "window.branchFixture.calls.filter(c=>c.action==='getBranchTreePreview').length"
      ),
      callsBefore + 1
    )
  }
  // Access can be revoked after metadata was rendered: the lazy load still fails closed.
  await evaluate("window.branchFixture.setPage('tree')")
  await waitFor(() =>
    evaluate("!!document.querySelector('button[aria-controls]')")
  )
  await evaluate('window.branchFixture.previewAllowed=false')
  await evaluate("document.querySelector('button[aria-controls]').click()")
  await waitFor(() =>
    evaluate(
      "!!document.querySelector('section[role=alert], section [role=alert]')"
    )
  )
  assert.equal(
    await evaluate("document.querySelector('[data-auxiliary-tree]')===null"),
    true
  )
  await evaluate("window.branchFixture.setPage('accounts')")
  await evaluate("window.branchFixture.setPage('tree')")
  await waitFor(() => evaluate("!!document.querySelector('.node-container')"))
  assert.equal(
    await evaluate("document.querySelector('button[aria-controls]')===null"),
    true
  )
  assert.equal(
    await evaluate("document.body.innerText.includes('Nhánh ngoại')"),
    false
  )
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 950,
    deviceScaleFactor: 1,
    mobile: false
  })
  await evaluate(
    "window.branchFixture.previewAllowed=true;window.branchFixture.setLanguage('en');window.branchFixture.setPage('accounts');document.documentElement.dataset.theme='light'"
  )
  await evaluate("window.branchFixture.setPage('tree')")
  await waitFor(() =>
    evaluate("!!document.querySelector('button[aria-controls]')")
  )
  assert.equal(
    await evaluate(
      "document.querySelector('button[aria-controls]').textContent.includes('Auxiliary branch')"
    ),
    true
  )
  await evaluate("document.querySelector('button[aria-controls]').click()")
  await waitFor(() =>
    evaluate("!!document.querySelector('[data-auxiliary-tree]')")
  )
  await screenshot('inline-tree-desktop-light-en.png')
  // Long auxiliary content must not stretch other main-family cards at the
  // same level, including after the height equalizer runs on resize.
  await evaluate(`(() => {
    const preview=window.branchFixture.preview;
    const ancestors=Array.from({length:16},(_,i)=>({...preview.persons[0],generation:1,id:'layout-extra-'+i,full_name:'Synthetic ancestor '+i}));
    window.branchFixture.preview={...preview,persons:[...preview.persons,...ancestors],rootIds:[...preview.rootIds,...ancestors.map(p=>p.id)]};
    window.branchFixture.setPage('layout');
  })()`)
  await waitFor(() =>
    evaluate(
      'document.querySelectorAll(\'.node-container[data-level="1"]\').length===2'
    )
  )
  await evaluate(`void(window.layoutRectangles=()=>{
    const origin=document.querySelector('.css-tree').getBoundingClientRect().top;
    return [...document.querySelectorAll('.node-container')].map(node=>({id:node.dataset.personId,level:node.dataset.level,height:node.querySelector('[data-family-card]').getBoundingClientRect().height,top:node.getBoundingClientRect().top-origin}));
  })`)
  await evaluate("window.dispatchEvent(new Event('resize'))")
  await delay(150)
  const collapsedLayout = await evaluate('window.layoutRectangles()')
  await evaluate("document.querySelector('button[aria-controls]').click()")
  await waitFor(() =>
    evaluate("!!document.querySelector('[data-auxiliary-tree]')")
  )
  await evaluate("window.dispatchEvent(new Event('resize'))")
  await delay(150)
  const expandedLayout = await evaluate('window.layoutRectangles()')
  for (const original of collapsedLayout) {
    const current = expandedLayout.find((node) => node.id === original.id)
    assert.ok(
      Math.abs(current.height - original.height) < 1,
      `Main card ${original.id} stretched from ${original.height} to ${current.height}`
    )
  }
  const peerId = '11111111-1111-4111-8111-111111111120'
  assert.ok(
    Math.abs(
      expandedLayout.find((node) => node.id === peerId).top -
        collapsedLayout.find((node) => node.id === peerId).top
    ) < 1
  )
  const peerChildId = '11111111-1111-4111-8111-111111111117'
  assert.ok(
    Math.abs(
      expandedLayout.find((node) => node.id === peerChildId).top -
        collapsedLayout.find((node) => node.id === peerChildId).top
    ) < 1
  )
  assert.equal(
    await evaluate(
      "document.querySelector('[data-family-card] [data-auxiliary-tree]')===null"
    ),
    true
  )
  assert.ok(
    await evaluate(
      "document.querySelector('[data-auxiliary-tree]').scrollWidth>document.querySelector('[data-auxiliary-tree]').clientWidth"
    )
  )
  await screenshot('inline-layout-peers-desktop.png')
  await evaluate("document.querySelector('button[aria-controls]').click()")
  await evaluate("window.dispatchEvent(new Event('resize'))")
  await delay(150)
  const closedAgain = await evaluate('window.layoutRectangles()')
  for (const original of collapsedLayout)
    assert.ok(
      Math.abs(
        closedAgain.find((node) => node.id === original.id).height -
          original.height
      ) < 1
    )
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  })
  await evaluate(
    "document.documentElement.dataset.theme='dark';window.dispatchEvent(new Event('resize'))"
  )
  await delay(150)
  const mobileCollapsed = await evaluate('window.layoutRectangles()')
  await evaluate("document.querySelector('button[aria-controls]').click()")
  await waitFor(() =>
    evaluate("!!document.querySelector('[data-auxiliary-tree]')")
  )
  await evaluate("window.dispatchEvent(new Event('resize'))")
  await delay(150)
  const mobileExpanded = await evaluate('window.layoutRectangles()')
  for (const original of mobileCollapsed)
    assert.ok(
      Math.abs(
        mobileExpanded.find((node) => node.id === original.id).height -
          original.height
      ) < 1
    )
  await screenshot('inline-layout-peers-mobile-dark.png')
  // The main descendant toggle stays below the panel and still controls only
  // the main subtree; it must not close the independently expanded branch.
  await evaluate(
    `document.querySelector('.node-container[data-person-id="${sharedId}"] > button[aria-label]').click()`
  )
  await waitFor(() =>
    evaluate(
      'document.querySelector(\'.node-container[data-person-id="11111111-1111-4111-8111-111111111116"]\')===null'
    )
  )
  assert.equal(
    await evaluate("!!document.querySelector('[data-auxiliary-tree]')"),
    true
  )
  await evaluate(
    `document.querySelector('.node-container[data-person-id="${sharedId}"] > button[aria-label]').click()`
  )
  await waitFor(() =>
    evaluate(
      '!!document.querySelector(\'.node-container[data-person-id="11111111-1111-4111-8111-111111111116"]\')'
    )
  )
  assert.deepEqual(exceptions, [])
  console.log(
    'Branch browser QA passed: existing flows, inline branches, permissions, long auxiliary branch keeps peer cards and peer descendants fixed after open/resize/close, mobile dark, desktop light, vi/en.'
  )
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    try {
      socket.close()
    } catch {}
  }
  if (browser && !browser.killed) browser.kill()
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}
