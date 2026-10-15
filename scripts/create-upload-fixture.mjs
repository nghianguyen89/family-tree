// Run with Bun; all remote writes are replaced by in-memory synthetic services.
const result = await Bun.build({
  entrypoints: ['./scripts/fixtures/shared-media.tsx'],
  target: 'browser',
  outdir: './_screenshot_/image-upload',
  plugins: [
    {
      name: 'synthetic-upload-services',
      setup(build) {
        build.onLoad({ filter: /[\\/]app[\\/]actions[\\/]media\.ts$/ }, () => ({
          loader: 'js',
          contents: `export const listMediaAssets=(...args)=>window.sharedMediaFixture.actions.list(...args);export const attachMediaAsset=(...args)=>window.sharedMediaFixture.actions.attach(...args);export const updateMediaAsset=(...args)=>window.sharedMediaFixture.actions.update(...args);export const removeMediaAsset=(...args)=>window.sharedMediaFixture.actions.remove(...args);`
        }))
        build.onLoad({ filter: /[\\/]types[\\/]media\.ts$/ }, () => ({
          loader: 'js',
          contents: `export const mediaImageUrl=id=>window.sharedMediaFixture.urls[id]`
        }))
        build.onLoad(
          { filter: /[\\/]utils[\\/]content\.ts$/ },
          async (args) => ({
            loader: 'ts',
            contents: (await Bun.file(args.path).text()).replace(
              /return `\/api\/content\/image\?id=\$\{id\}`/,
              'return window.sharedMediaFixture.urls[id]'
            )
          })
        )
        build.onLoad(
          { filter: /[\\/]app[\\/]actions[\\/]content\.ts$/ },
          () => ({
            loader: 'js',
            contents: `export const removeContentImage=(...args)=>window.sharedMediaFixture.actions.detach(...args);export async function updateContentImage(){return {}}`
          })
        )
        build.onLoad(
          { filter: /[\\/]utils[\\/]supabase[\\/]client\.ts$/ },
          () => ({
            loader: 'js',
            contents: `export function createClient(){return window.fixtureDb}`
          })
        )
        build.onLoad(
          { filter: /[\\/]components[\\/]content[\\/]ContentImage\.tsx$/ },
          () => ({
            loader: 'jsx',
            contents: `import React from 'react';export default function ContentImage({image,className}){return <img src={window.sharedMediaFixture.urls[image.asset_id||image.id]} alt={image.alt} className={className}/>} `
          })
        )
        build.onResolve({ filter: /^next\/image$/ }, () => ({
          path: 'image',
          namespace: 'fixture-next'
        }))
        build.onLoad({ filter: /.*/, namespace: 'fixture-next' }, () => ({
          loader: 'js',
          contents: `import React from 'react';export default function Image({unoptimized,...props}){return React.createElement('img',props)}`
        }))
      }
    }
  ]
})
if (!result.success) throw new Error(result.logs.join('\n'))
console.log(
  'Synthetic upload fixture built; no real credentials or family records used.'
)
