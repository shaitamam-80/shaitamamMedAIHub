-- ============================================
-- Cleanup old MedAI Hub schema before new migration
-- Safe to run: drops old tables that are replaced
-- ============================================

-- Drop old tables (from MedAI Hub v1) that conflict with new schema
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.query_strings CASCADE;
DROP TABLE IF EXISTS public.abstracts CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;

-- Drop the old projects table (has different schema)
DROP TABLE IF EXISTS public.projects CASCADE;
