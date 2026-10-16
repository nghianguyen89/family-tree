// Run with Bun. No real sessions, credentials or Supabase writes.
const result = await Bun.build({
  entrypoints: ['./scripts/fixtures/dashboard-navigation.tsx'],
  target: 'browser',
  outdir: './_screenshot_/navigation',
  plugins: [
    {
      name: 'synthetic-navigation',
      setup(build) {
        build.onLoad(
          { filter: /[\\/]utils[\\/]supabase[\\/]client\.ts$/ },
          () => ({
            loader: 'js',
            contents: `export function createClient(){return {auth:{signOut:async()=>{window.navigationFixture.signouts++;return {error:null}}}}}`
          })
        )
        build.onLoad({ filter: /[\\/]app[\\/]config\.ts$/ }, () => ({
          loader: 'js',
          contents: `export default {siteName:'Gia phả mẫu'}`
        }))
        build.onResolve(
          { filter: /^next\/(link|navigation|image)$/ },
          (args) => ({ path: args.path, namespace: 'fixture-next' })
        )
        build.onLoad({ filter: /.*/, namespace: 'fixture-next' }, (args) => ({
          loader: 'jsx',
          contents:
            args.path === 'next/navigation'
              ? `import {useSyncExternalStore} from 'react';export function usePathname(){return useSyncExternalStore(fn=>{window.addEventListener('fixture-route',fn);return ()=>window.removeEventListener('fixture-route',fn)},()=>window.navigationFixture.path)}export function useRouter(){return {push:path=>window.navigationFixture.navigate(path),refresh(){}}}`
              : args.path === 'next/link'
                ? `import React from 'react';export default function Link({href,onClick,children,...props}){return <a href={href} {...props} onClick={event=>{onClick?.(event);if(!event.defaultPrevented&&!event.ctrlKey&&!event.metaKey){event.preventDefault();window.navigationFixture.navigate(href)}}}>{children}</a>}`
                : `import React from 'react';export default function Image({fill,sizes,...props}){return <img {...props} width="40" height="40"/>}`
        }))
      }
    }
  ]
})
if (!result.success) throw new Error(result.logs.join('\n'))
console.log('Navigation fixture built with synthetic profiles and routing.')
