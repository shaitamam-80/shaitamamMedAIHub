-- ============================================
-- SR Portal - Incremental Migration (APPLIED Feb 2026)
-- Migrates actual production schema → new SR Portal schema
-- ============================================
-- Production had: id, user_id, project_name, topic, review_type,
--   current_stage, is_archived, created_at, updated_at
--
-- Steps applied manually via Supabase SQL Editor:

-- 1. Rename columns
ALTER TABLE public.projects RENAME COLUMN project_name TO title;
ALTER TABLE public.projects RENAME COLUMN user_id TO owner_id;
ALTER TABLE public.projects RENAME COLUMN topic TO description;

-- 2. Add missing columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS framework TEXT DEFAULT 'PICO';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS prospero_id TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_records_found INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_screened INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_included INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_excluded INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. Backfill defaults
UPDATE public.projects SET slug = LOWER(REGEXP_REPLACE(COALESCE(title, 'untitled'), '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
UPDATE public.projects SET framework = 'PICO' WHERE framework IS NULL;
UPDATE public.projects SET status = CASE WHEN is_archived = true THEN 'archived' ELSE 'active' END WHERE status IS NULL;
UPDATE public.projects SET progress_percentage = 0 WHERE progress_percentage IS NULL;

-- 4. Fix review_type constraint (old had 'intervention', code sends 'systematic_intervention')
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_review_type_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_review_type_check
  CHECK (review_type IS NULL OR review_type IN (
    'systematic_intervention', 'systematic_prevalence',
    'systematic_prognosis', 'systematic_diagnostic',
    'systematic_qualitative', 'scoping'
  ));

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
