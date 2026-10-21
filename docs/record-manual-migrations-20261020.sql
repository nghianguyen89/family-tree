-- ONE-TIME HISTORY RECONCILIATION, NOT A SCHEMA MIGRATION.
-- Run in SQL Editor on the project where you already ran ALL 18 files below.
-- Operator confirmation of successful manual execution is required.
-- Checks below catch missing feature markers; they are NOT a full schema/policy audit.
-- This records the reconciliation time, not the original manual execution time.
-- Do not add this file to docs/migrations or the /setup bundle.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('giapha_os_app_migrations'));

DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(name, ', ') INTO missing
  FROM unnest(ARRAY[
    'public.profiles', 'public.persons', 'public.relationships',
    'public.person_details_private', 'public.custom_events', 'public.gallery_items',
    'public.family_intake_links', 'public.family_intake_submissions',
    'public.home_content', 'public.home_content_images', 'public.home_settings',
    'public.media_assets', 'public.family_branches', 'public.family_branch_members'
  ]) AS tables(name) WHERE to_regclass(name) IS NULL;
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'History not recorded. Missing tables: %', missing;
  END IF;

  SELECT string_agg(required.table_name || '.' || required.column_name, ', ')
  INTO missing
  FROM (VALUES
    ('persons', 'birth_year_from'), ('persons', 'birth_year_to'),
    ('persons', 'death_year_from'), ('persons', 'death_year_to'),
    ('persons', 'memorial_day'), ('persons', 'memorial_is_leap_month'),
    ('persons', 'family_branch_id'), ('relationships', 'family_branch_id'),
    ('profiles', 'person_id'), ('family_branches', 'partner_person_id'),
    ('home_settings', 'origin_previous'), ('home_content_images', 'asset_id'),
    ('family_intake_links', 'share_token'), ('family_intake_links', 'deleted_at')
  ) AS required(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = required.table_name
      AND c.column_name = required.column_name
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'History not recorded. Missing columns: %', missing;
  END IF;

  IF to_regprocedure('private.can_view_family_branch(uuid)') IS NULL OR
     position('WITH RECURSIVE descendants' IN pg_get_functiondef(
       to_regprocedure('private.can_view_family_branch(uuid)')
     )) = 0 THEN
    RAISE EXCEPTION 'History not recorded. Check the family branch descendants migration.';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.app_migrations (
  migration_id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.app_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_migrations FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "No client access to app migrations" ON public.app_migrations;
CREATE POLICY "No client access to app migrations"
  ON public.app_migrations FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

INSERT INTO public.app_migrations (migration_id, file_name)
SELECT file, file FROM unnest(ARRAY[
  'docs/schema.sql',
  'docs/migrations/20260312015736_add_lunar_death_date.sql',
  'docs/migrations/20260320230020_add_editor_permission.sql',
  'docs/migrations/20260524125731_add_gallery.sql',
  'docs/migrations/20260831140135_security_and_approval_hardening.sql',
  'docs/migrations/20260901000000_security_definer_and_rls_hardening.sql',
  'docs/migrations/20260904000000_add_data_api_table_grants.sql',
  'docs/migrations/20261014000000_personal_fork_security.sql',
  'docs/migrations/20261014010000_add_person_year_ranges.sql',
  'docs/migrations/20261014020000_family_intake_and_memorial.sql',
  'docs/migrations/20261015000000_home_content.sql',
  'docs/migrations/20261015010000_shared_media_library.sql',
  'docs/migrations/20261016000000_intake_link_management.sql',
  'docs/migrations/20261016010000_fix_media_insert_returning.sql',
  'docs/migrations/20261019000000_family_branches.sql',
  'docs/migrations/20261019010000_family_branch_privacy.sql',
  'docs/migrations/20261019020000_home_origin_previous.sql',
  'docs/migrations/20261019030000_family_branch_descendants.sql'
]) AS files(file)
ON CONFLICT (migration_id) DO NOTHING;

COMMIT;

SELECT migration_id, applied_at FROM public.app_migrations ORDER BY migration_id;
