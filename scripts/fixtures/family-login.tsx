import { createRoot } from 'react-dom/client'

import LoginPage from '../../app/login/page'
import { I18nProvider } from '../../lib/i18n/I18nProvider'

declare global {
  interface Window {
    familyLoginFixture: { calls: Array<Record<string, unknown>> }
  }
}

window.familyLoginFixture = { calls: [] }
createRoot(document.getElementById('root')!).render(
  <I18nProvider initialLocale='vi'>
    <LoginPage />
  </I18nProvider>
)
