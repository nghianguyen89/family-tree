// Run with Bun. The fixture uses application components and synthetic records;
// it never connects to Supabase or uses the user's browser session.
import { mkdir, writeFile } from 'node:fs/promises'

import { plugin } from 'bun'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

plugin({
  name: 'rendering-fixture',
  setup(build) {
    build.onLoad(
      { filter: /[\\/]context[\\/]MemberListContext\.tsx$/ },
      () => ({
        loader: 'js',
        contents: `
    export function useMemberListView(){return {view:'list',showAvatar:true,rootId:null,setView(){},setMemberModalId(){},setShowCreateMember(){}}}
  `
      })
    )
    build.onLoad({ filter: /[\\/]components[\\/]UserProvider\.tsx$/ }, () => ({
      loader: 'js',
      contents: `
    export function useUser(){return {user:null,profile:{role:'member',is_active:true},isAdmin:false,supabase:{auth:{signOut:async()=>({})}}}}
  `
    }))
    build.onResolve({ filter: /^next\/(image|link|navigation)$/ }, (args) => ({
      path: args.path,
      namespace: 'fixture-next'
    }))
    build.onLoad({ filter: /.*/, namespace: 'fixture-next' }, (args) => ({
      loader: 'js',
      contents:
        args.path === 'next/navigation'
          ? 'export function useRouter(){return {push(){},refresh(){}}}'
          : args.path === 'next/link'
            ? `import React from 'react';export default function Link({children,prefetch,replace,scroll,...props}){return React.createElement('a',props,children)}`
            : `import React from 'react';export default function Image({fill,sizes,unoptimized,priority,...props}){return React.createElement('img',{...props,style:fill?{width:'100%',height:'100%'}:undefined})}`
    }))
  }
})
const [
  { default: MemberList },
  { default: DashboardHeader },
  { default: ViewToggle },
  { I18nProvider }
] = await Promise.all([
  import('../components/MemberList.tsx'),
  import('../components/DashboardHeader.tsx'),
  import('../components/ViewToggle.tsx'),
  import('../lib/i18n/I18nProvider.tsx')
])
const people = Array.from({ length: 72 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  full_name: `Thành viên minh họa ${i + 1}`,
  gender: i % 2 ? 'female' : 'male',
  is_deceased: i % 3 !== 0,
  is_in_law: false,
  generation: Math.floor(i / 6) + 1,
  birth_year: 1900 + i,
  birth_month: null,
  birth_day: null,
  death_year: 1990 + i,
  birth_order: (i % 6) + 1,
  avatar_url: null,
  other_names: '',
  note: ''
}))
const html = renderToStaticMarkup(
  h(
    I18nProvider,
    { initialLocale: 'vi' },
    h(DashboardHeader),
    h(ViewToggle),
    h(
      'main',
      { className: 'mx-auto max-w-7xl px-4 py-8' },
      h(MemberList, { initialPersons: people, relationships: [] })
    )
  )
)
await mkdir('_screenshot_/rendering', { recursive: true })
await writeFile('_screenshot_/rendering/fixture.html', html)
console.log(
  'Created rendering fixture with 72 synthetic members; no database access.'
)
