import assert from 'node:assert/strict'
import { test } from 'node:test'

import { renderToStaticMarkup } from 'react-dom/server'

import PersonFields from '../components/intake/PersonFields'
import PublicIntakeForm from '../components/intake/PublicIntakeForm'
import { I18nProvider } from '../lib/i18n/I18nProvider'

test('public family form renders a branch/generation selector without a login or private profile fields', () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale='vi'>
      <PublicIntakeForm
        token={'a'.repeat(64)}
        options={{
          title: 'Shared branch',
          root_id: '44444444-4444-4444-8444-444444444444',
          people: [
            {
              id: '44444444-4444-4444-8444-444444444444',
              full_name: 'Ancestor',
              generation: 1
            }
          ]
        }}
      />
    </I18nProvider>
  )
  assert.match(html, /Shared branch/)
  assert.match(html, /Ancestor/)
  assert.match(html, /Tất cả các đời/)
  assert.doesNotMatch(html, /type="password"/)
  assert.doesNotMatch(html, /value="1900"/)
})
test('a deceased person with no death date can enter an independent yearless memorial', () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale='vi'>
      <PersonFields
        value={{
          full_name: 'Ancestor',
          gender: 'male',
          is_deceased: true,
          memorial_calendar: 'lunar',
          memorial_day: 5,
          memorial_month: 3,
          memorial_is_leap_month: false
        }}
        onChange={() => {}}
      />
    </I18nProvider>
  )
  assert.match(html, /Thiết lập ngày cúng riêng hằng năm/)
  assert.match(html, /Không cần biết ngày hay năm mất/)
  assert.match(html, /Tháng nhuận âm lịch/)
  assert.match(html, /value="5"/)
  assert.doesNotMatch(html, /value="1900"/)
})
