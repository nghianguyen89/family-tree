'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getServerTranslations } from '@/lib/i18n/server'
import { fetchAllRows, fetchInChunks } from '@/utils/supabase/fetchAll'
import { getProfile, getSupabase } from '@/utils/supabase/queries'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function deleteMemberProfile(memberId: string) {
  const { t } = await getServerTranslations()
  if (!UUID_PATTERN.test(memberId)) {
    return { error: t('invalidProfile') }
  }

  const profile = await getProfile()
  const supabase = await getSupabase()

  if (
    !profile?.is_active ||
    (profile.role !== 'admin' && profile.role !== 'editor')
  ) {
    return {
      error: t('memberDeleteAccessDenied')
    }
  }

  // 2. Check for existing relationships
  const { data: relationships, error: relationshipError } = await supabase
    .from('relationships')
    .select('id')
    .or(`person_a.eq.${memberId},person_b.eq.${memberId}`)
    .limit(1)

  if (relationshipError) {
    console.error('Error checking relationships:', relationshipError)
    return { error: t('relationshipCheckError') }
  }

  if (relationships && relationships.length > 0) {
    return {
      error: t('memberHasRelationships')
    }
  }

  // 3. Delete the member
  const { error: deleteError } = await supabase
    .from('persons')
    .delete()
    .eq('id', memberId)

  if (deleteError) {
    console.error('Error deleting person:', deleteError)
    return { error: t('memberDeleteError') }
  }

  // 4. Revalidate and redirect
  revalidatePath('/dashboard/members')
  redirect('/dashboard/members')
}

export async function updateDescendantGenerationsAction(
  personId: string,
  generationDelta: number
) {
  const { t } = await getServerTranslations()
  if (!UUID_PATTERN.test(personId)) {
    return { error: t('invalidProfile') }
  }

  if (
    generationDelta === 0 ||
    !Number.isInteger(generationDelta) ||
    Math.abs(generationDelta) > 100
  ) {
    return generationDelta === 0
      ? { success: true }
      : { error: t('invalidGenerationDelta') }
  }

  const profile = await getProfile()
  const supabase = await getSupabase()

  if (
    !profile?.is_active ||
    (profile.role !== 'admin' && profile.role !== 'editor')
  ) {
    return {
      error: t('memberEditAccessDenied')
    }
  }

  // 1. Fetch all parent-child relationships
  const { data: sourcePerson, error: sourceError } = await supabase
    .from('persons')
    .select('*')
    .eq('id', personId)
    .single()
  if (sourceError || !sourcePerson || sourcePerson.family_branch_id) {
    return { error: t('invalidProfile') }
  }
  const { data: relationships, error: relError } = await fetchAllRows<{
    person_a: string
    person_b: string
    type: string
    family_branch_id?: string | null
  }>((from, to) =>
    supabase
      .from('relationships')
      .select('*')
      .in('type', ['biological_child', 'adopted_child'])
      .order('id')
      .range(from, to)
  )

  if (relError) {
    console.error('Error fetching relationships:', relError)
    return { error: t('relationshipsFetchError') }
  }

  // Build children map (person_a is parent, person_b is child)
  const childrenMap = new Map<string, string[]>()
  relationships.forEach((r) => {
    if (r.family_branch_id) return
    if (!childrenMap.has(r.person_a)) childrenMap.set(r.person_a, [])
    childrenMap.get(r.person_a)!.push(r.person_b)
  })

  // 2. Find all descendants using BFS
  const descendants = new Set<string>()
  const queue = [personId]
  while (queue.length > 0) {
    const current = queue.shift()!
    const children = childrenMap.get(current) || []
    for (const child of children) {
      if (!descendants.has(child)) {
        descendants.add(child)
        queue.push(child)
      }
    }
  }

  if (descendants.size === 0) return { success: true }
  const descendantIds = Array.from(descendants)

  // 3. Fetch current generations of descendants
  const { data: persons, error: personsError } = await fetchInChunks<
    string,
    { id: string; generation: number | null; family_branch_id?: string | null }
  >(descendantIds, (ids) => supabase.from('persons').select('*').in('id', ids))

  if (personsError) {
    console.error('Error fetching persons:', personsError)
    return { error: t('generationsFetchError') }
  }

  // 4. Update each descendant's generation
  let hasError = false
  // Batch processing can be done by looping
  for (const person of persons) {
    if (person.family_branch_id) continue
    if (person.generation !== null && person.generation !== undefined) {
      const newGen = Math.max(1, person.generation + generationDelta)
      const { error: updateError } = await supabase
        .from('persons')
        .update({ generation: newGen })
        .eq('id', person.id)

      if (updateError) {
        console.error(`Error updating person ${person.id}:`, updateError)
        hasError = true
      }
    }
  }

  if (hasError) {
    return { error: t('descendantGenerationUpdateError') }
  }

  return { success: true }
}
