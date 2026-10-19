// Run with Bun; actual upgrade component and synthetic release/action responses.
const result = await Bun.build({
  entrypoints: ['./scripts/fixtures/upgrade.tsx'],
  target: 'browser',
  outdir: './_screenshot_/upgrade',
  plugins: [
    {
      name: 'synthetic-upgrade-actions',
      setup(build) {
        build.onLoad(
          { filter: /[\\/]app[\\/]actions[\\/]migrations\.ts$/ },
          () => ({
            loader: 'js',
            contents: `export async function getMigrationStatus(){return window.upgradeFixture.status} export async function runPendingMigrations(){window.upgradeFixture.applied++;return {success:true,message:'Fixture migration applied'}}`
          })
        )
      }
    }
  ]
})
if (!result.success) throw new Error(result.logs.join('\n'))
console.log(
  'Upgrade fixture built; no real session, feed, SQL or Supabase access.'
)
