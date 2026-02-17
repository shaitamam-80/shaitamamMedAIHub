-- ============================================
-- SR Portal - Search, Articles & Assessment Tables
-- Supabase/PostgreSQL Migration
-- ============================================
-- Adds tables for the search → screening → extraction → RoB pipeline.
-- Depends on: 001_initial_schema.sql (projects, project_stages, profiles, uploaded_files)

-- ============================================
-- 1. SEARCH RUNS
-- ============================================
-- Each row = one executed PubMed search query within a project.
-- A project may have multiple search runs (broad, focused, updated).

CREATE TABLE public.search_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.project_stages(id) ON DELETE SET NULL,

  -- Query details
  query_string TEXT NOT NULL,                -- The PubMed Boolean query
  query_translation TEXT,                    -- PubMed's translated query
  strategy_label TEXT CHECK (strategy_label IN (
    'broad', 'focused', 'precision', 'updated', 'manual'
  )),
  mesh_terms JSONB DEFAULT '[]'::jsonb,      -- MeSH terms used: ["Diabetes Mellitus", ...]
  filters JSONB DEFAULT '{}'::jsonb,         -- Applied filters: {"date_range": "2020-2024", "languages": ["en"], ...}

  -- Results
  results_count INTEGER DEFAULT 0,           -- Total hits from PubMed
  articles_imported INTEGER DEFAULT 0,       -- Articles actually imported into articles table
  deduplicated_count INTEGER DEFAULT 0,      -- Duplicates removed

  -- Source file (if imported from MEDLINE export)
  source_file_id UUID REFERENCES public.uploaded_files(id) ON DELETE SET NULL,

  -- Metadata
  executed_at TIMESTAMPTZ DEFAULT NOW(),     -- When the search was run
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_runs_project ON public.search_runs(project_id);
CREATE INDEX idx_search_runs_stage ON public.search_runs(stage_id);

CREATE TRIGGER search_runs_updated_at
  BEFORE UPDATE ON public.search_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. ARTICLES
-- ============================================
-- Central article/abstract store. One row per unique article per project.
-- Populated from PubMed search results or manual imports.

CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  search_run_id UUID REFERENCES public.search_runs(id) ON DELETE SET NULL,

  -- PubMed identifiers
  pmid TEXT,                                 -- PubMed ID (e.g., "35486828")
  pmcid TEXT,                                -- PMC ID (e.g., "PMC9046468")
  doi TEXT,                                  -- DOI

  -- Bibliographic data
  title TEXT NOT NULL,
  abstract_text TEXT,
  authors JSONB DEFAULT '[]'::jsonb,         -- [{name: "Smith J", affiliation: "..."}]
  journal TEXT,
  publication_date TEXT,                     -- As returned by PubMed (e.g., "2023 Mar 15")
  publication_year INTEGER,                  -- Extracted year for filtering/sorting
  volume TEXT,
  issue TEXT,
  pages TEXT,
  language TEXT DEFAULT 'eng',               -- ISO 639-2 language code
  publication_types JSONB DEFAULT '[]'::jsonb, -- ["Randomized Controlled Trial", "Meta-Analysis"]
  mesh_headings JSONB DEFAULT '[]'::jsonb,   -- MeSH terms assigned to this article
  keywords JSONB DEFAULT '[]'::jsonb,        -- Author keywords

  -- Full-text availability
  fulltext_available BOOLEAN DEFAULT FALSE,
  fulltext_source TEXT,                      -- 'pmc', 'unpaywall', 'core', 's2', 'ezproxy'
  fulltext_url TEXT,
  fulltext_content TEXT,                     -- Cached full-text (if retrieved)

  -- Screening status (denormalized for fast queries)
  screening_status TEXT DEFAULT 'pending' CHECK (screening_status IN (
    'pending', 'included', 'excluded', 'maybe', 'conflict'
  )),

  -- Study classification (set during extraction)
  study_design TEXT,                         -- 'RCT', 'cohort', 'case_control', 'cross_sectional', etc.

  -- Deduplication
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES public.articles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate PMIDs within the same project
  UNIQUE(project_id, pmid)
);

CREATE INDEX idx_articles_project ON public.articles(project_id);
CREATE INDEX idx_articles_search_run ON public.articles(search_run_id);
CREATE INDEX idx_articles_pmid ON public.articles(pmid);
CREATE INDEX idx_articles_screening ON public.articles(project_id, screening_status);
CREATE INDEX idx_articles_study_design ON public.articles(project_id, study_design)
  WHERE study_design IS NOT NULL;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. SCREENING DECISIONS
-- ============================================
-- Immutable log of every screening decision (AI + human).
-- Multiple decisions per article (AI first pass, human review, conflict resolution).

CREATE TABLE public.screening_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Who made the decision
  decided_by TEXT NOT NULL CHECK (decided_by IN (
    'rule_engine', 'ai', 'human', 'conflict_resolution'
  )),
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL for AI/rule decisions

  -- The decision
  decision TEXT NOT NULL CHECK (decision IN (
    'include', 'exclude', 'maybe'
  )),

  -- Screening phase
  phase TEXT NOT NULL DEFAULT 'title_abstract' CHECK (phase IN (
    'title_abstract', 'full_text'
  )),

  -- Reasoning
  exclusion_reason TEXT,                     -- Why excluded (e.g., "wrong population", "non-English")
  confidence_score NUMERIC(4,3),             -- 0.000–1.000 (AI confidence)
  criteria_match JSONB DEFAULT '{}'::jsonb,  -- Per-criterion evaluation: {"population": true, "intervention": false, ...}
  rationale TEXT,                            -- Free-text explanation

  -- Audit
  is_final BOOLEAN DEFAULT FALSE,            -- Is this the definitive decision?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_screening_article ON public.screening_decisions(article_id);
CREATE INDEX idx_screening_project ON public.screening_decisions(project_id);
CREATE INDEX idx_screening_final ON public.screening_decisions(article_id, is_final)
  WHERE is_final = TRUE;

-- ============================================
-- 4. EXTRACTIONS
-- ============================================
-- Structured data extracted from included studies.
-- One row per article (the latest/active extraction).

CREATE TABLE public.extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  extractor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Study classification
  study_design TEXT NOT NULL,                -- 'RCT', 'cohort_prospective', 'cohort_retrospective',
                                             -- 'case_control', 'cross_sectional', 'qualitative',
                                             -- 'case_series', 'case_report', 'diagnostic_accuracy'
  template_used TEXT,                        -- 'A_intervention', 'B_prevalence', 'C_qualitative', 'D_diagnostic'

  -- Extracted data (flexible JSONB to support all templates)
  population JSONB DEFAULT '{}'::jsonb,      -- {n, age_mean, age_sd, male_pct, setting, country, ...}
  intervention JSONB DEFAULT '{}'::jsonb,    -- {name, dose, duration, comparator, ...}
  outcomes JSONB DEFAULT '[]'::jsonb,        -- [{name, measure, timepoint, result_intervention, result_control, effect_size, ci_lower, ci_upper, p_value}]
  methodology JSONB DEFAULT '{}'::jsonb,     -- {randomization, blinding, allocation_concealment, followup_pct, ...}
  additional_data JSONB DEFAULT '{}'::jsonb, -- Catch-all for study-specific fields

  -- Quality checks
  completeness_score NUMERIC(4,3),           -- 0.000–1.000 (how many fields filled)
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'complete', 'verified', 'flagged'
  )),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One active extraction per article per project
  UNIQUE(article_id, project_id)
);

CREATE INDEX idx_extractions_article ON public.extractions(article_id);
CREATE INDEX idx_extractions_project ON public.extractions(project_id);
CREATE INDEX idx_extractions_design ON public.extractions(project_id, study_design);

CREATE TRIGGER extractions_updated_at
  BEFORE UPDATE ON public.extractions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. ROB ASSESSMENTS
-- ============================================
-- Risk of Bias assessments per study. Supports multiple tools:
-- RoB 2.0, ROBINS-I, NOS, QUADAS-2, JBI checklists, QUIPS

CREATE TABLE public.rob_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Tool used
  rob_tool TEXT NOT NULL CHECK (rob_tool IN (
    'rob2', 'robins_i', 'nos_cohort', 'nos_case_control',
    'quadas2', 'quips', 'jbi_cohort', 'jbi_case_control',
    'jbi_cross_sectional', 'jbi_qualitative', 'jbi_prevalence'
  )),

  -- Domain-by-domain assessment
  -- Each domain: {judgment: "low"/"some_concerns"/"high"/"critical"/"na", support_text: "...", signaling_questions: {...}}
  domains JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Overall judgment
  overall_judgment TEXT NOT NULL CHECK (overall_judgment IN (
    'low', 'some_concerns', 'high', 'critical', 'not_assessed'
  )),
  overall_rationale TEXT,
  direction_of_bias TEXT CHECK (direction_of_bias IN (
    'favours_experimental', 'favours_comparator', 'towards_null',
    'away_from_null', 'unpredictable', 'not_applicable'
  )),

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'complete', 'verified'
  )),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One assessment per article per project per tool
  UNIQUE(article_id, project_id, rob_tool)
);

CREATE INDEX idx_rob_article ON public.rob_assessments(article_id);
CREATE INDEX idx_rob_project ON public.rob_assessments(project_id);
CREATE INDEX idx_rob_tool ON public.rob_assessments(project_id, rob_tool);

CREATE TRIGGER rob_assessments_updated_at
  BEFORE UPDATE ON public.rob_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- COUNTER UPDATE TRIGGERS
-- ============================================
-- Keep projects.total_records_found, total_screened, total_included, total_excluded in sync.

-- Update total_records_found when articles are inserted/deleted
CREATE OR REPLACE FUNCTION update_project_article_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects
    SET total_records_found = (
      SELECT COUNT(*) FROM public.articles
      WHERE project_id = NEW.project_id AND is_duplicate = FALSE
    )
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects
    SET total_records_found = (
      SELECT COUNT(*) FROM public.articles
      WHERE project_id = OLD.project_id AND is_duplicate = FALSE
    )
    WHERE id = OLD.project_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Recalculate when is_duplicate changes
    IF OLD.is_duplicate IS DISTINCT FROM NEW.is_duplicate THEN
      UPDATE public.projects
      SET total_records_found = (
        SELECT COUNT(*) FROM public.articles
        WHERE project_id = NEW.project_id AND is_duplicate = FALSE
      )
      WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_article_change
  AFTER INSERT OR UPDATE OR DELETE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION update_project_article_counts();

-- Update screening counters when a final screening decision is made
CREATE OR REPLACE FUNCTION update_project_screening_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_final = TRUE THEN
    UPDATE public.projects
    SET
      total_screened = (
        SELECT COUNT(DISTINCT article_id) FROM public.screening_decisions
        WHERE project_id = NEW.project_id AND is_final = TRUE
      ),
      total_included = (
        SELECT COUNT(DISTINCT article_id) FROM public.screening_decisions
        WHERE project_id = NEW.project_id AND is_final = TRUE AND decision = 'include'
      ),
      total_excluded = (
        SELECT COUNT(DISTINCT article_id) FROM public.screening_decisions
        WHERE project_id = NEW.project_id AND is_final = TRUE AND decision = 'exclude'
      )
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_screening_decision
  AFTER INSERT OR UPDATE ON public.screening_decisions
  FOR EACH ROW EXECUTE FUNCTION update_project_screening_counts();

-- Sync articles.screening_status when a final decision is set
CREATE OR REPLACE FUNCTION sync_article_screening_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_final = TRUE THEN
    UPDATE public.articles
    SET screening_status = CASE NEW.decision
      WHEN 'include' THEN 'included'
      WHEN 'exclude' THEN 'excluded'
      WHEN 'maybe' THEN 'maybe'
    END
    WHERE id = NEW.article_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_screening_sync_article
  AFTER INSERT OR UPDATE ON public.screening_decisions
  FOR EACH ROW EXECUTE FUNCTION sync_article_screening_status();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.search_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rob_assessments ENABLE ROW LEVEL SECURITY;

-- search_runs: access via project ownership
CREATE POLICY "Access search_runs via project"
  ON public.search_runs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Shared users view search_runs"
  ON public.search_runs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = search_runs.project_id
        AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ps.accepted = TRUE
    )
  );

-- articles: access via project ownership
CREATE POLICY "Access articles via project"
  ON public.articles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Shared users view articles"
  ON public.articles FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = articles.project_id
        AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ps.accepted = TRUE
    )
  );

-- screening_decisions: access via project ownership
CREATE POLICY "Access screening_decisions via project"
  ON public.screening_decisions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Shared users view screening_decisions"
  ON public.screening_decisions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = screening_decisions.project_id
        AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ps.accepted = TRUE
    )
  );

-- extractions: access via project ownership
CREATE POLICY "Access extractions via project"
  ON public.extractions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Shared users view extractions"
  ON public.extractions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = extractions.project_id
        AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ps.accepted = TRUE
    )
  );

-- rob_assessments: access via project ownership
CREATE POLICY "Access rob_assessments via project"
  ON public.rob_assessments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Shared users view rob_assessments"
  ON public.rob_assessments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = rob_assessments.project_id
        AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ps.accepted = TRUE
    )
  );
