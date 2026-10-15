import Image from 'next/image'
import Link from 'next/link'

import config from '@/app/config'
import HeaderMenu from '@/components/HeaderMenu'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'

export default function DashboardHeader() {
  return (
    <header className='sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-xl transition-all duration-200'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        <div className='flex min-w-0 items-center gap-4'>
          <Link
            href='/dashboard'
            className='group flex items-center gap-2 sm:gap-3'>
            <div className='relative size-10 shrink-0 overflow-hidden rounded-xl transition-all'>
              <Image
                src='/icon.png'
                alt='Logo'
                fill
                className='object-contain'
                sizes='40px'
              />
            </div>
            <h1 className='truncate font-serif text-xl font-semibold text-stone-800 transition-colors group-hover:text-amber-700 sm:text-2xl'>
              {config.siteName}
            </h1>
          </Link>
        </div>
        <div className='flex shrink-0 items-center gap-2 sm:gap-4'>
          <ThemeToggle />
          <LanguageSwitcher />
          <HeaderMenu />
        </div>
      </div>
    </header>
  )
}
