// Synthetic branch UI bundle. No Supabase connection or real session.
const result = await Bun.build({
  entrypoints: ['./scripts/fixtures/family-branches.tsx'],
  target: 'browser',
  outdir: './_screenshot_/branches',
  plugins: [
    {
      name: 'synthetic-branches',
      setup(build) {
        build.onResolve({ filter: /^@\/utils\/supabase\/client$/ }, () => ({
          path: 'detail-client',
          namespace: 'fixture-detail'
        }))
        build.onLoad({ filter: /.*/, namespace: 'fixture-detail' }, () => ({
          loader: 'js',
          contents: `const client={from(table){if(table!=='relationships')throw new Error('Unexpected fixture table: '+table);let selection='',filters=[];const query={select(value){selection=value;return query},eq(key,value){filters.push(row=>row[key]===value);return query},in(key,values){filters.push(row=>values.includes(row[key]));return query},or(value){const ids=value.split(')').flatMap(part=>part.includes('in.(')?part.split('in.(')[1].split(','):[]);filters.push(row=>ids.includes(row.person_a)||ids.includes(row.person_b));return query},then(resolve,reject){const fixture=window.branchFixture.detail;const people=new Map(fixture.people.map(p=>[p.id,p]));const rows=fixture.rows.filter(r=>(!r.family_branch_id||fixture.canReadBranch)&&filters.every(test=>test(r))).map(r=>({...r,target:people.get(selection.includes('!person_b')?r.person_b:r.person_a),person_a_data:people.get(r.person_a),person_b_data:people.get(r.person_b)}));return Promise.resolve({data:rows,error:null}).then(resolve,reject)}};return query}};export function createClient(){return client}`
        }))
        build.onResolve(
          { filter: /^next\/(navigation|link|image|dynamic)$/ },
          (args) => ({ path: args.path, namespace: 'fixture-next' })
        )
        build.onLoad({ filter: /.*/, namespace: 'fixture-next' }, (args) => ({
          loader: 'jsx',
          contents:
            args.path === 'next/navigation'
              ? `import {useMemo,useSyncExternalStore} from 'react'; const subscribe=fn=>{window.addEventListener('fixture-route',fn);return()=>window.removeEventListener('fixture-route',fn)}; export function useSearchParams(){const route=useSyncExternalStore(subscribe,()=>window.branchFixture.route);return useMemo(()=>new URLSearchParams(route.split('?')[1]||''),[route])} export function usePathname(){return location.pathname} export function useRouter(){return {push:path=>window.branchFixture.navigate(path),refresh:()=>window.branchFixture.refresh()}}`
              : args.path === 'next/dynamic'
                ? `import React,{lazy,Suspense} from 'react';export default function dynamic(loader){const Component=lazy(loader);return props=><Suspense fallback={null}><Component {...props}/></Suspense>}`
                : args.path === 'next/link'
                  ? `import React from 'react'; export default function Link({href,children,...props}){return <a href={href} {...props} onClick={e=>{props.onClick?.(e);if(!e.defaultPrevented){e.preventDefault();window.branchFixture.navigate(href)}}}>{children}</a>}`
                  : `import React from 'react'; export default function Image(props){return <img {...props}/>} `
        }))
        build.onResolve(
          {
            filter:
              /^(?:@\/app\/actions\/branches|\.\.\/\.\.\/app\/actions\/branches)$/
          },
          () => ({ path: 'branch-actions', namespace: 'fixture' })
        )
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
          loader: 'js',
          contents: `export async function getPersonBranches(id){return {canCreate:true,editableBranchIds:window.branchFixture.descendant?[]:window.branchFixture.db.branches.map(b=>b.id),branches:window.branchFixture.db.branches.filter(b=>b.anchor_person_id===id||b.partner_person_id===id||window.branchFixture.db.members.some(m=>m.person_id===id&&m.branch_id===b.id)),error:null}}
export async function getBranchTreePreview(id){window.branchFixture.calls.push({action:'getBranchTreePreview',id});return window.branchFixture.previewAllowed?{preview:window.branchFixture.preview,error:null}:{preview:null,error:'permission'}}
export async function getBranchRelationshipPeople(id){return {people:window.branchFixture.db.people.filter(p=>window.branchFixture.db.members.some(m=>m.person_id===p.id&&m.branch_id===id)),error:null}}
export async function createBranch(anchor,name){window.branchFixture.calls.push({action:'createBranch',anchor,name});const id='44444444-4444-4444-8444-444444444444';window.branchFixture.db.branches.push({id,name,anchor_person_id:anchor,root_person_id:anchor,created_at:'',updated_at:''});return {id}}
export async function updateBranch(id,changes){window.branchFixture.calls.push({action:'updateBranch',id,changes});Object.assign(window.branchFixture.db.branches.find(b=>b.id===id),changes);return {success:true}}
export async function searchBranchPeople(id,q){window.branchFixture.calls.push({action:'searchBranchPeople',id,q});return {people:window.branchFixture.db.people.filter(p=>p.full_name.toLowerCase().includes(q.toLowerCase())).slice(0,20),error:null}}
export async function addBranchPerson(input){window.branchFixture.calls.push({action:'addBranchPerson',input});return {id:'55555555-5555-4555-8555-555555555555'}}
export async function updateBranchMemberGeneration(id,personId,generation){window.branchFixture.calls.push({action:'updateBranchMemberGeneration',id,personId,generation});return {success:true}}
export async function removeBranchRelationship(id,relationId){window.branchFixture.calls.push({action:'removeBranchRelationship',id,relationId});return {success:true}}`
        }))
        build.onResolve({ filter: /^@\/app\/actions\/user$/ }, () => ({
          path: 'user-actions',
          namespace: 'fixture-user'
        }))
        build.onLoad({ filter: /.*/, namespace: 'fixture-user' }, () => ({
          loader: 'js',
          contents: `export async function linkUserPerson(userId,personId){window.branchFixture.calls.push({action:'linkUserPerson',userId,personId});return {success:true}}`
        }))
        build.onResolve({ filter: /^@\/components\/MembersViews$/ }, () => ({
          path: 'members-view',
          namespace: 'fixture-ui'
        }))
        build.onResolve({ filter: /^@\/components\/ViewToggle$/ }, () => ({
          path: 'view-toggle',
          namespace: 'fixture-ui'
        }))
        build.onResolve(
          { filter: /^@\/components\/modal\/MemberDetailModal$/ },
          () => ({ path: 'detail-modal', namespace: 'fixture-ui' })
        )
        build.onResolve(
          { filter: /^@\/components\/modal\/CustomEventModal$/ },
          () => ({ path: 'event-modal', namespace: 'fixture-ui' })
        )
        build.onLoad({ filter: /.*/, namespace: 'fixture-ui' }, (args) => ({
          loader: 'jsx',
          contents:
            args.path === 'members-view'
              ? `import React from 'react';export default function MembersViews({persons}){return <div data-testid="members-view">{persons.map(p=><span key={p.id}>{p.full_name}</span>)}</div>}`
              : args.path === 'view-toggle'
                ? `import React from 'react';export default function ViewToggle(){return <div data-testid="view-toggle"/>}`
                : `export default function Empty(){return null}`
        }))
      }
    }
  ]
})
if (!result.success) throw new Error(result.logs.join('\n'))
console.log('Synthetic branch fixture built.')
