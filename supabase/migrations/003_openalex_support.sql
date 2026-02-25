-- ============================================
-- SR Portal - OpenAlex Integration Support
-- Supabase/PostgreSQL Migration
-- ============================================
-- Adds OpenAlex as a second search engine alongside PubMed.
-- Depends on: 001_initial_schema.sql, 002_search_and_articles.sql

-- ============================================
-- 1. PROJECTS — add search_source column
-- ============================================
-- Default 'pubmed' for backward compatibility with all existing projects.

ALTER TABLE public.projects
  ADD COLUMN search_source TEXT NOT NULL DEFAULT 'pubmed'
  CHECK (search_source IN ('pubmed', 'openalex'));

-- ============================================
-- 2. SEARCH_RUNS — add search_source column
-- ============================================
-- Tracks which engine was used for each search run.

ALTER TABLE public.search_runs
  ADD COLUMN search_source TEXT NOT NULL DEFAULT 'pubmed'
  CHECK (search_source IN ('pubmed', 'openalex'));

-- ============================================
-- 3. ARTICLES — add OpenAlex fields
-- ============================================

-- OpenAlex work identifier (e.g., "https://openalex.org/W2741809807")
ALTER TABLE public.articles
  ADD COLUMN openalex_id TEXT;

-- Track which source this article came from
ALTER TABLE public.articles
  ADD COLUMN source TEXT NOT NULL DEFAULT 'pubmed'
  CHECK (source IN ('pubmed', 'openalex', 'manual'));

-- OpenAlex topics classification (replaces deprecated "concepts")
-- Format: [{"name": "...", "field": "...", "domain": "..."}]
ALTER TABLE public.articles
  ADD COLUMN topics JSONB DEFAULT '[]'::jsonb;

-- Citation count (available from OpenAlex)
ALTER TABLE public.articles
  ADD COLUMN cited_by_count INTEGER DEFAULT 0;

-- ============================================
-- 4. INDEXES
-- ============================================

-- Index for OpenAlex deduplication within a project
CREATE INDEX idx_articles_openalex ON public.articles(openalex_id)
  WHERE openalex_id IS NOT NULL;

-- Index for filtering by source
CREATE INDEX idx_articles_source ON public.articles(project_id, source);

-- ============================================
-- 5. UNIQUENESS CONSTRAINTS
-- ============================================
-- Relax the existing PMID uniqueness and add OpenAlex uniqueness.

-- Drop the old composite unique constraint on (project_id, pmid)
-- This was created in 002 as: UNIQUE(project_id, pmid)
ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_project_id_pmid_key;

-- New: unique PMID per project (only when pmid is not null)
CREATE UNIQUE INDEX idx_articles_project_pmid_unique
  ON public.articles(project_id, pmid) WHERE pmid IS NOT NULL;

-- New: unique OpenAlex ID per project (only when openalex_id is not null)
CREATE UNIQUE INDEX idx_articles_project_openalex_unique
  ON public.articles(project_id, openalex_id) WHERE openalex_id IS NOT NULL;
