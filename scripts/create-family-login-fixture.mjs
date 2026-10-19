const result = await Bun.build({
  entrypoints: ['./scripts/fixtures/family-login.tsx'],
  target: 'browser',
  outdir: './_screenshot_/family',
  define: { 'process.env.NEXT_PUBLIC_DISABLE_SSO': '"false"' },
  plugins: [
    {
      name: 'isolated-family-login',
      setup(build) {
        build.onResolve(
          { filter: /^next\/(navigation|link)$/ },
          ({ path }) => ({ path, namespace: 'login-fixture' })
        )
        build.onLoad(
          { filter: /.*/, namespace: 'login-fixture' },
          ({ path }) => ({
            loader: 'js',
            contents: path.endsWith('navigation')
              ? `export const useRouter=()=>({push:(url)=>window.familyLoginFixture.calls.push({kind:'route',url}),refresh:()=>{}})`
              : `import React from 'react';export default function Link({href,children,...props}){return React.createElement('a',{...props,href},children)}`
          })
        )
        build.onLoad({ filter: /[\\/]app[\\/]config\.ts$/ }, () => ({
          loader: 'js',
          contents: `export default {siteName:'Family login fixture',isDemo:true,appUrl:'https://canonical-family.example',familyId:'demo',configError:null}`
        }))
        build.onLoad(
          { filter: /[\\/]utils[\\/]supabase[\\/]client\.ts$/ },
          () => ({
            loader: 'js',
            contents: `export const createClient=()=>({auth:{signInWithOAuth:async(args)=>{window.familyLoginFixture.calls.push({kind:'oauth',...args});return {error:{message:'Fixture stops redirect'}}},signUp:async(args)=>{window.familyLoginFixture.calls.push({kind:'signup',...args});return {data:{session:{}},error:null}},signInWithPassword:async(args)=>{window.familyLoginFixture.calls.push({kind:'password',...args});return {data:{session:{}},error:null}}}})`
          })
        )
      }
    }
  ]
})
if (!result.success) throw new Error(result.logs.join('\n'))
console.log('Family login fixture built; synthetic Auth only.')
