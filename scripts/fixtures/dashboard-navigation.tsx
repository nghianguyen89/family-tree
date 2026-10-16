// Real navigation components; synthetic profiles and local routing only.
import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import DashboardHeader from '../../components/DashboardHeader'
import DashboardShell from '../../components/DashboardShell'
import { UserProvider } from '../../components/UserProvider'
import { I18nProvider } from '../../lib/i18n/I18nProvider'
import type { Profile } from '../../types'

declare global {
  interface Window {
    navigationFixture: {
      path: string
      signouts: number
      navigate: (path: string) => void
      setRole: (role: Profile['role'], active?: boolean) => void
      setLanguage: (locale: 'vi' | 'en') => void
    }
  }
}
window.navigationFixture = {
  path: '/dashboard',
  signouts: 0,
  navigate(path) {
    window.navigationFixture.path = path
    window.dispatchEvent(new Event('fixture-route'))
  },
  setRole() {},
  setLanguage() {}
}
function Fixture() {
  const [profile, setProfile] = useState<Profile>({
    id: 'fixture',
    role: 'admin',
    is_active: true,
    created_at: '',
    updated_at: ''
  })
  const [locale, setLocale] = useState<'vi' | 'en'>('vi')
  useEffect(() => {
    window.navigationFixture.setRole = (role, active = true) =>
      setProfile({ ...profile, role, is_active: active })
    window.navigationFixture.setLanguage = setLocale
  }, [profile])
  return (
    <I18nProvider key={locale} initialLocale={locale}>
      <UserProvider
        profile={profile}
        user={{ id: 'fixture', email: 'editor@example.com' } as User}>
        <DashboardShell
          header={<DashboardHeader />}
          footer={
            <footer className='border-t border-border p-6 text-center text-secondary'>
              Gia phả mẫu
            </footer>
          }>
          <main className='mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6'>
            <div>
              <h1 className='font-serif text-3xl font-semibold'>
                Gia phả gia đình
              </h1>
              <p className='mt-2 text-secondary'>
                Không gian lưu giữ thông tin và kết nối các thế hệ.
              </p>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              {[
                'Cây và thành viên',
                'Sự kiện sắp tới',
                'Thư viện ảnh',
                'Thông tin chờ duyệt'
              ].map((label) => (
                <section
                  key={label}
                  className='rounded-3xl border border-border bg-surface p-6'>
                  <h2 className='text-lg font-semibold'>{label}</h2>
                  <p className='mt-2 text-secondary'>
                    Nội dung mẫu để kiểm tra bố cục điều hướng.
                  </p>
                </section>
              ))}
            </div>
            <button
              className='rounded-xl bg-primary px-4 py-3 text-surface'
              id='fixture-content-button'>
              Xem gia phả
            </button>
          </main>
        </DashboardShell>
      </UserProvider>
    </I18nProvider>
  )
}
createRoot(document.getElementById('root')!).render(<Fixture />)
