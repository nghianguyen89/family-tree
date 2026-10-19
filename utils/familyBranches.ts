import type { Person, Relationship } from '@/types'
import type {
  BranchTreePreview,
  FamilyBranch,
  FamilyBranchMember
} from '@/types/branches'

/** Compact preview: generation one, with root couples as the unnumbered fallback. */
export function branchFirstGeneration(preview: BranchTreePreview): Person[] {
  const relatives = preview.persons.filter(
    (person) => person.id !== preview.branch.anchor_person_id
  )
  const numbered = relatives.filter((person) => person.generation === 1)
  const seeds = new Set(
    numbered.length
      ? numbered.map((person) => person.id)
      : preview.rootIds.filter((id) => id !== preview.branch.anchor_person_id)
  )
  const visible = new Set(seeds)
  for (const relation of preview.relationships) {
    if (
      relation.type === 'marriage' &&
      (seeds.has(relation.person_a) || seeds.has(relation.person_b))
    ) {
      visible.add(relation.person_a)
      visible.add(relation.person_b)
    }
  }
  return relatives.filter(
    (person) =>
      visible.has(person.id) &&
      (!numbered.length || person.generation == null || person.generation === 1)
  )
}

/** Build a separate display graph without changing main-family roots or generations. */
export function branchTreePreview(
  branch: FamilyBranch,
  people: Person[],
  relations: Relationship[],
  members: FamilyBranchMember[]
): BranchTreePreview {
  const generations = new Map(
    members
      .filter((m) => m.branch_id === branch.id)
      .map((m) => [m.person_id, m.generation])
  )
  const persons = people
    .filter((p) => generations.has(p.id))
    .map((p) => ({ ...p, generation: generations.get(p.id) ?? null }))
  const ids = new Set(persons.map((p) => p.id))
  const unique = new Map<string, Relationship>()
  for (const r of relations) {
    if (
      (r.family_branch_id && r.family_branch_id !== branch.id) ||
      !ids.has(r.person_a) ||
      !ids.has(r.person_b)
    )
      continue
    const pair =
      r.type === 'marriage'
        ? [r.person_a, r.person_b].sort()
        : [r.person_a, r.person_b]
    unique.set(`${r.type}:${pair.join(':')}`, r)
  }
  const relationships = [...unique.values()]
  const childIds = new Set(
    relationships
      .filter(
        (r) => r.type === 'biological_child' || r.type === 'adopted_child'
      )
      .map((r) => r.person_b)
  )
  const candidates = persons.filter((p) => !childIds.has(p.id))
  if (branch.root_person_id)
    candidates.sort(
      (a, b) =>
        Number(b.id === branch.root_person_id) -
        Number(a.id === branch.root_person_id)
    )
  const represented = new Set<string>()
  const rootIds: string[] = []
  for (const p of candidates) {
    if (represented.has(p.id)) continue
    rootIds.push(p.id)
    represented.add(p.id)
    for (const r of relationships)
      if (
        r.type === 'marriage' &&
        (r.person_a === p.id || r.person_b === p.id)
      ) {
        represented.add(r.person_a)
        represented.add(r.person_b)
      }
  }
  if (!rootIds.length && ids.has(branch.anchor_person_id))
    rootIds.push(branch.anchor_person_id)
  return { branch, persons, relationships, rootIds }
}

/** Auxiliary relationships must not affect the main family's roots or generations. */
export function mainFamilyScope<
  P extends Pick<Person, 'id' | 'family_branch_id'>,
  R extends Pick<Relationship, 'person_a' | 'person_b' | 'family_branch_id'>
>(persons: P[], relationships: R[]) {
  const mainPersons = persons.filter((person) => !person.family_branch_id)
  const ids = new Set(mainPersons.map((person) => person.id))
  return {
    persons: mainPersons,
    relationships: relationships.filter(
      (relationship) =>
        !relationship.family_branch_id &&
        ids.has(relationship.person_a) &&
        ids.has(relationship.person_b)
    )
  }
}

export function peopleInCalendarScope<
  P extends { id: string; family_branch_id?: string | null }
>(
  persons: P[],
  members: { branch_id: string; person_id: string }[],
  scope: string
) {
  if (scope === 'all') return persons
  if (scope === 'main')
    return persons.filter((person) => !person.family_branch_id)
  const ids = new Set(
    members
      .filter((member) => member.branch_id === scope)
      .map((member) => member.person_id)
  )
  return persons.filter((person) => ids.has(person.id))
}
