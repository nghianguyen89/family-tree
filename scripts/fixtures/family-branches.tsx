'use client'

import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import UserPersonLink from '../../components/admin/UserPersonLink'
import BranchLinks from '../../components/branches/BranchLinks'
import BranchWorkspace from '../../components/branches/BranchWorkspace'
import BubbleMapTree from '../../components/BubbleMapTree'
import EventsList from '../../components/EventsList'
import FamilyTree from '../../components/FamilyTree'
import MindmapTree from '../../components/MindmapTree'
import PersonCard from '../../components/PersonCard'
import RelationshipManager from '../../components/RelationshipManager'
import { MemberListProvider } from '../../context/MemberListContext'
import { I18nProvider } from '../../lib/i18n/I18nProvider'
import type { Person, Relationship } from '../../types'
import type {
  BranchTreePreview,
  FamilyBranch,
  FamilyBranchMember
} from '../../types/branches'
import { branchTreePreview } from '../../utils/familyBranches'

const anchorId = '11111111-1111-4111-8111-111111111111'
const sharedId = '11111111-1111-4111-8111-111111111112'
const ownedId = '11111111-1111-4111-8111-111111111113'
const secondId = '11111111-1111-4111-8111-111111111114'
const branchId = '22222222-2222-4222-8222-222222222222'
const otherBranchId = '33333333-3333-4333-8333-333333333333'
const today = new Date()
const month = today.getMonth() + 1
const day = today.getDate()
function person(
  id: string,
  full_name: string,
  family_branch_id: string | null,
  is_in_law = false
): Person {
  return {
    id,
    full_name,
    gender: 'male',
    is_deceased: false,
    is_in_law,
    birth_year: 1980,
    birth_month: month,
    birth_day: day,
    death_year: null,
    death_month: null,
    death_day: null,
    death_lunar_year: null,
    death_lunar_month: null,
    death_lunar_day: null,
    avatar_url: null,
    note: null,
    other_names: null,
    birth_order: null,
    generation: null,
    created_at: '',
    updated_at: '',
    family_branch_id
  } as Person
}
const anchor = person(anchorId, 'Người nối chính', null, true)
const shared = person(sharedId, 'Người chung hai nhánh', null)
const owned = person(ownedId, 'Người thuộc nhánh phụ', branchId)
const second = person(secondId, 'Người nhánh khác', otherBranchId)
const people = [anchor, shared, owned, second]
const branch: FamilyBranch = {
  id: branchId,
  name: 'Nhánh ngoại',
  anchor_person_id: anchorId,
  root_person_id: anchorId,
  created_at: '',
  updated_at: ''
}
const otherBranch: FamilyBranch = {
  id: otherBranchId,
  name: 'Nhánh thứ hai',
  anchor_person_id: sharedId,
  root_person_id: sharedId,
  created_at: '',
  updated_at: ''
}
const members: FamilyBranchMember[] = [
  { branch_id: branchId, person_id: anchorId, generation: null },
  { branch_id: branchId, person_id: sharedId, generation: null },
  { branch_id: branchId, person_id: ownedId, generation: null },
  { branch_id: otherBranchId, person_id: sharedId, generation: null },
  { branch_id: otherBranchId, person_id: secondId, generation: null }
]
const relations: Relationship[] = [
  {
    id: '66666666-6666-4666-8666-666666666666',
    type: 'biological_child',
    person_a: ownedId,
    person_b: anchorId,
    family_branch_id: branchId,
    created_at: '',
    updated_at: ''
  }
]

// Detail regression: shared main in-law, two auxiliary parents, main spouse,
// and a repeated main/branch child relation. All data here is synthetic.
const mother = person(
  '11111111-1111-4111-8111-111111111115',
  'Mẹ trong nhánh',
  branchId
)
const detailChild = person(
  '11111111-1111-4111-8111-111111111116',
  'Con dùng chung',
  null
)
const grandchild = person(
  '11111111-1111-4111-8111-111111111117',
  'Cháu dùng chung',
  null
)
const childSpouse = person(
  '11111111-1111-4111-8111-111111111118',
  'Dâu trong nhánh',
  null
)
childSpouse.gender = 'female'
const edge = (
  id: string,
  a: Person,
  b: Person,
  scope: string | null,
  type: Relationship['type'] = 'biological_child'
): Relationship => ({
  id,
  person_a: a.id,
  person_b: b.id,
  type,
  family_branch_id: scope,
  created_at: '',
  updated_at: ''
})
const detailRows = [
  ...relations,
  edge('detail-mother', mother, anchor, branchId),
  edge('detail-spouse', anchor, shared, null, 'marriage'),
  edge('detail-child', anchor, detailChild, null),
  edge('detail-child-branch', anchor, detailChild, branchId),
  edge('detail-child-spouse', detailChild, childSpouse, branchId, 'marriage'),
  edge('detail-grandchild', detailChild, grandchild, branchId),
  edge('detail-grandchild-main', detailChild, grandchild, null)
]

const layoutAncestor = person(
  '11111111-1111-4111-8111-111111111119',
  'Tổ tiên kiểm tra bố cục',
  null
)
const layoutPeer = person(
  '11111111-1111-4111-8111-111111111120',
  'Người cùng đời',
  null
)
const layoutPeople = [
  layoutAncestor,
  shared,
  anchor,
  layoutPeer,
  detailChild,
  grandchild
]
const layoutRelations = [
  edge('layout-parent-a', layoutAncestor, shared, null),
  edge('layout-parent-b', layoutAncestor, layoutPeer, null),
  edge('layout-marriage', shared, anchor, null, 'marriage'),
  edge('layout-child-a', shared, detailChild, null),
  edge('layout-child-b', layoutPeer, grandchild, null)
]

declare global {
  interface Window {
    branchFixture: {
      route: string
      calls: unknown[]
      db: {
        branches: FamilyBranch[]
        members: FamilyBranchMember[]
        people: Person[]
      }
      detail: { canReadBranch: boolean; people: Person[]; rows: Relationship[] }
      descendant: boolean
      previewAllowed: boolean
      preview: BranchTreePreview
      navigate: (path: string) => void
      refresh: () => void
      setRole: (role: 'editor' | 'member') => void
      setLanguage: (language: 'vi' | 'en') => void
      setPage: (
        page:
          | 'branch'
          | 'calendar'
          | 'accounts'
          | 'relationships'
          | 'tree'
          | 'mindmap'
          | 'cards'
          | 'bubble'
          | 'layout'
      ) => void
    }
  }
}
window.branchFixture = {
  route: location.pathname + location.search,
  calls: [],
  db: { branches: [branch, otherBranch], members, people },
  descendant: false,
  previewAllowed: true,
  preview: branchTreePreview(
    branch,
    [anchor, owned, mother],
    [
      ...relations,
      edge('preview-mother', mother, anchor, branchId),
      edge('preview-marriage', owned, mother, branchId, 'marriage')
    ],
    [...members, { branch_id: branchId, person_id: mother.id, generation: 1 }]
  ),
  detail: {
    canReadBranch: true,
    people: [...people, mother, detailChild, grandchild, childSpouse],
    rows: detailRows
  },
  navigate(path) {
    history.pushState({}, '', path)
    this.route = path
    window.dispatchEvent(new Event('fixture-route'))
  },
  refresh() {
    window.dispatchEvent(new Event('fixture-refresh'))
  },
  setRole() {},
  setLanguage() {},
  setPage() {}
}

function Fixture() {
  const [role, setRole] = useState<'editor' | 'member'>('editor')
  const [language, setLanguage] = useState<'vi' | 'en'>('vi')
  const [page, setPage] = useState<
    | 'branch'
    | 'calendar'
    | 'accounts'
    | 'relationships'
    | 'tree'
    | 'mindmap'
    | 'cards'
    | 'bubble'
    | 'layout'
  >('branch')
  const [detailPerson, setDetailPerson] = useState(anchor)
  const [detailStats, setDetailStats] = useState<unknown>(null)
  const [linkedPersonId, setLinkedPersonId] = useState<string | null>(null)
  const [, setRevision] = useState(0)
  useEffect(() => {
    window.branchFixture.setRole = setRole
    window.branchFixture.setLanguage = setLanguage
    window.branchFixture.setPage = setPage
    const refresh = () => setRevision((number) => number + 1)
    window.addEventListener('fixture-refresh', refresh)
    return () => window.removeEventListener('fixture-refresh', refresh)
  }, [])
  return (
    <I18nProvider key={language} initialLocale={language}>
      <main className='min-h-screen bg-neutral text-primary'>
        <nav className='flex gap-2 p-3 text-sm'>
          <button id='branch-tab' onClick={() => setPage('branch')}>
            Branch
          </button>
          <button id='calendar-tab' onClick={() => setPage('calendar')}>
            Calendar
          </button>
        </nav>
        {['tree', 'mindmap', 'cards', 'bubble', 'layout'].includes(page) ? (
          <MemberListProvider
            branches={window.branchFixture.previewAllowed ? [branch] : []}>
            <div id='tree-toolbar-portal' />
            <div className='relative h-[70vh]'>
              {page === 'layout' ? (
                <FamilyTree
                  personsMap={new Map(layoutPeople.map((p) => [p.id, p]))}
                  relationships={layoutRelations}
                  roots={[layoutAncestor]}
                />
              ) : page === 'tree' ? (
                <FamilyTree
                  personsMap={
                    new Map([
                      [anchor.id, anchor],
                      [shared.id, shared]
                    ])
                  }
                  relationships={[
                    edge('tree-spouse', shared, anchor, null, 'marriage')
                  ]}
                  roots={[shared]}
                />
              ) : page === 'bubble' ? (
                <BubbleMapTree
                  personsMap={
                    new Map([
                      [anchor.id, anchor],
                      [shared.id, shared]
                    ])
                  }
                  relationships={[
                    edge('tree-spouse', shared, anchor, null, 'marriage')
                  ]}
                  roots={[shared]}
                />
              ) : page === 'mindmap' ? (
                <MindmapTree
                  personsMap={
                    new Map([
                      [anchor.id, anchor],
                      [shared.id, shared]
                    ])
                  }
                  relationships={[
                    edge('tree-spouse', shared, anchor, null, 'marriage')
                  ]}
                  roots={[shared]}
                />
              ) : (
                <PersonCard person={anchor} />
              )}
            </div>
          </MemberListProvider>
        ) : page === 'relationships' ? (
          <MemberListProvider>
            <section className='mx-auto max-w-3xl space-y-4 p-4'>
              <h1>{detailPerson.full_name}</h1>
              <button
                id='detail-anchor-profile'
                onClick={() => setDetailPerson(anchor)}>
                Open shared profile
              </button>
              <button
                id='detail-parent-profile'
                onClick={() => setDetailPerson(owned)}>
                Open parent profile
              </button>
              <RelationshipManager
                key={`${detailPerson.id}-${window.branchFixture.detail.canReadBranch}`}
                person={detailPerson}
                isAdmin={role === 'editor'}
                canEdit={role === 'editor' && !detailPerson.family_branch_id}
                onStatsLoaded={setDetailStats}
              />
              <output data-testid='detail-stats' className='hidden'>
                {JSON.stringify(detailStats)}
              </output>
            </section>
          </MemberListProvider>
        ) : page === 'accounts' ? (
          <section className='mx-auto max-w-3xl p-4'>
            <UserPersonLink
              user={{
                id: '77777777-7777-4777-8777-777777777777',
                email: 'owner@example.com',
                role: 'member',
                is_active: true,
                created_at: '',
                person_id: linkedPersonId
              }}
              persons={[anchor, shared]}
              disabled={false}
              onSaved={setLinkedPersonId}
            />
          </section>
        ) : page === 'branch' ? (
          <>
            <div className='mx-auto max-w-7xl px-4'>
              <BranchLinks
                key={`${language}-${role}`}
                person={anchor}
                canEdit={role === 'editor'}
              />
            </div>
            <BranchWorkspace
              branch={branch}
              persons={[anchor, shared, owned]}
              members={members.filter(
                (member) => member.branch_id === branchId
              )}
              relationships={relations}
              canEdit={role === 'editor' && !window.branchFixture.descendant}
              isAdmin={role === 'editor'}
              partnerOptions={[shared]}
              initialRootId={anchorId}
              initialView='list'
              initialShowAvatar={true}
            />
          </>
        ) : (
          <MemberListProvider>
            <div className='mx-auto max-w-3xl px-4'>
              <EventsList
                persons={people}
                branches={[
                  { id: branchId, name: branch.name },
                  { id: otherBranchId, name: otherBranch.name }
                ]}
                branchMembers={members}
              />
            </div>
          </MemberListProvider>
        )}
      </main>
    </I18nProvider>
  )
}
createRoot(document.getElementById('root')!).render(<Fixture />)
