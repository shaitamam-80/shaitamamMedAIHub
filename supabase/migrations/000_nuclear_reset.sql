-- ============================================
-- SR Portal - Nuclear Reset
-- Drops ALL existing tables, functions, triggers
-- and recreates the full schema from scratch.
--
-- Run in Supabase SQL Editor (one shot).
-- ============================================

-- ============================================
-- PHASE 1: DROP EVERYTHING
-- ============================================

-- Drop tables in reverse FK order
DROP TABLE IF EXISTS public.rob_assessments CASCADE;
DROP TABLE IF EXISTS public.extractions CASCADE;
DROP TABLE IF EXISTS public.screening_decisions CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.search_runs CASCADE;
DROP TABLE IF EXISTS public.uploaded_files CASCADE;
DROP TABLE IF EXISTS public.project_shares CASCADE;
DROP TABLE IF EXISTS public.artifacts CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.project_stages CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- Legacy tables
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- Drop functions (CASCADE drops dependent triggers)
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_project_stages() CASCADE;
DROP FUNCTION IF EXISTS public.update_project_article_counts() CASCADE;
DROP FUNCTION IF EXISTS public.update_project_screening_counts() CASCADE;
DROP FUNCTION IF EXISTS public.sync_article_screening_status() CASCADE;

-- ============================================
-- PHASE 2: HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 3: CREATE ALL TABLES
-- ============================================

-- ── 1. PROFILES (extends Supabase auth.users) ──

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  institution TEXT,
  preferred_language TEXT DEFAULT 'he' CHECK (preferred_language IN ('he', 'en')),
  role TEXT DEFAULT 'researcher' CHECK (role IN ('researcher', 'supervisor', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. PROJECTS ──

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  review_type TEXT NOT NULL CHECK (review_type IN (
    'systematic_intervention', 'systematic_prevalence',
    'systematic_prognosis', 'systematic_diagnostic',
    'systematic_qualitative', 'scoping'
  )),
  framework TEXT NOT NULL DEFAULT 'PICO' CHECK (framework IN (
    'PICO', 'PICOT', 'PICOS', 'CoCoPop', 'PFO',
    'PEO', 'PECO', 'PIRD', 'PICo', 'SPIDER',
    'PCC', 'SPICE', 'ECLIPSE', 'CIMO', 'PerSPEcTiF', 'BeHEMoTh'
  )),
  current_stage TEXT NOT NULL DEFAULT 'idea' CHECK (current_stage IN (
    'idea', 'question', 'protocol', 'search',
    'screening', 'extraction', 'rob', 'synthesis',
    'grade', 'manuscript'
  )),
  progress_percentage INTEGER DEFAULT 0 CHECK (
    progress_percentage >= 0 AND progress_percentage <= 100
  ),
  prospero_id TEXT,
  total_records_found INTEGER DEFAULT 0,
  total_screened INTEGER DEFAULT 0,
  total_included INTEGER DEFAULT 0,
  total_excluded INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_status ON public.projects(status);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 3. PROJECT STAGES ──

CREATE TABLE public.project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL CHECK (stage_name IN (
    'idea', 'question', 'protocol', 'search',
    'screening', 'extraction', 'rob', 'synthesis',
    'grade', 'manuscript'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'skipped', 'not_applicable'
  )),
  skill_name TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, stage_name)
);

CREATE INDEX idx_stages_project ON public.project_stages(project_id);

CREATE TRIGGER stages_updated_at
  BEFORE UPDATE ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create all 10 stages when a project is created
CREATE OR REPLACE FUNCTION public.create_project_stages()
RETURNS TRIGGER AS $$
DECLARE
  stage_names TEXT[] := ARRAY[
    'idea', 'question', 'protocol', 'search',
    'screening', 'extraction', 'rob', 'synthesis',
    'grade', 'manuscript'
  ];
  skill_names TEXT[] := ARRAY[
    'systematic-review', 'research-question', 'protocol-builder', 'pubmed-query',
    'pubmed-screening', 'data-extraction', 'risk-of-bias', 'meta-analysis',
    'grade-assessment', 'manuscript-writer'
  ];
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(stage_names, 1) LOOP
    INSERT INTO public.project_stages (project_id, stage_name, skill_name, status)
    VALUES (
      NEW.id,
      stage_names[i],
      skill_names[i],
      CASE WHEN i = 1 THEN 'in_progress' ELSE 'pending' END
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_project_stages();

-- ── 4. CONVERSATIONS ──

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.project_stages(id) ON DELETE CASCADE,
  standalone_tool TEXT CHECK (standalone_tool IN (
    'article-appraisal', 'find-journal'
  )),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_project ON public.conversations(project_id);
CREATE INDEX idx_conversations_stage ON public.conversations(stage_id);
CREATE INDEX idx_conversations_user ON public.conversations(user_id);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 5. MESSAGES ──

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  artifacts_generated UUID[] DEFAULT '{}',
  model_used TEXT,
  tokens_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

-- ── 6. ARTIFACTS ──

CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.project_stages(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  display_name TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN (
    'markdown', 'csv', 'html', 'txt', 'json', 'r_script', 'docx', 'pdf'
  )),
  mime_type TEXT,
  content TEXT,
  storage_path TEXT,
  file_size_bytes INTEGER,
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artifacts_project ON public.artifacts(project_id);
CREATE INDEX idx_artifacts_stage ON public.artifacts(stage_id);

CREATE TRIGGER artifacts_updated_at
  BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 7. PROJECT SHARES ──

CREATE TABLE public.project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_by UUID NOT NULL REFERENCES public.profiles(id),
  access_level TEXT DEFAULT 'read' CHECK (access_level IN ('read', 'comment')),
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shares_project ON public.project_shares(project_id);
CREATE INDEX idx_shares_email ON public.project_shares(shared_with_email);

-- ── 8. UPLOADED FILES ──

CREATE TABLE public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.project_stages(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  storage_path TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  parsed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploads_project ON public.uploaded_files(project_id);

-- ── 9. SEARCH RUNS ──

CREATE TABLE public.search_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.project_stages(id) ON DELETE SET NULL,
  query_string TEXT NOT NULL,
  query_translation TEXT,
  strategy_label TEXT CHECK (strategy_label IN (
    'broad', 'focused', 'precision', 'updated', 'manual'
  )),
  mesh_terms JSONB DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER DEFAULT 0,
  articles_imported INTEGER DEFAULT 0,
  deduplicated_count INTEGER DEFAULT 0,
  source_file_id UUID REFERENCES public.uploaded_files(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_runs_project ON public.search_runs(project_id);
CREATE INDEX idx_search_runs_stage ON public.search_runs(stage_id);

CREATE TRIGGER search_runs_updated_at
  BEFORE UPDATE ON public.search_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 10. ARTICLES ──

CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  search_run_id UUID REFERENCES public.search_runs(id) ON DELETE SET NULL,
  pmid TEXT,
  pmcid TEXT,
  doi TEXT,
  title TEXT NOT NULL,
  abstract_text TEXT,
  authors JSONB DEFAULT '[]'::jsonb,
  journal TEXT,
  publication_date TEXT,
  publication_year INTEGER,
  volume TEXT,
  issue TEXT,
  pages TEXT,
  language TEXT DEFAULT 'eng',
  publication_types JSONB DEFAULT '[]'::jsonb,
  mesh_headings JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  fulltext_available BOOLEAN DEFAULT FALSE,
  fulltext_source TEXT,
  fulltext_url TEXT,
  fulltext_content TEXT,
  screening_status TEXT DEFAULT 'pending' CHECK (screening_status IN (
    'pending', 'included', 'excluded', 'maybe', 'conflict'
  )),
  study_design TEXT,
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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

-- ── 11. SCREENING DECISIONS ──

CREATE TABLE public.screening_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  decided_by TEXT NOT NULL CHECK (decided_by IN (
    'rule_engine', 'ai', 'human', 'conflict_resolution'
  )),
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision TEXT NOT NULL CHECK (decision IN (
    'include', 'exclude', 'maybe'
  )),
  phase TEXT NOT NULL DEFAULT 'title_abstract' CHECK (phase IN (
    'title_abstract', 'full_text'
  )),
  exclusion_reason TEXT,
  confidence_score NUMERIC(4,3),
  criteria_match JSONB DEFAULT '{}'::jsonb,
  rationale TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_screening_article ON public.screening_decisions(article_id);
CREATE INDEX idx_screening_project ON public.screening_decisions(project_id);
CREATE INDEX idx_screening_final ON public.screening_decisions(article_id, is_final)
  WHERE is_final = TRUE;

-- ── 12. EXTRACTIONS ──

CREATE TABLE public.extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  extractor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  study_design TEXT NOT NULL,
  template_used TEXT,
  population JSONB DEFAULT '{}'::jsonb,
  intervention JSONB DEFAULT '{}'::jsonb,
  outcomes JSONB DEFAULT '[]'::jsonb,
  methodology JSONB DEFAULT '{}'::jsonb,
  additional_data JSONB DEFAULT '{}'::jsonb,
  completeness_score NUMERIC(4,3),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'complete', 'verified', 'flagged'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, project_id)
);

CREATE INDEX idx_extractions_article ON public.extractions(article_id);
CREATE INDEX idx_extractions_project ON public.extractions(project_id);
CREATE INDEX idx_extractions_design ON public.extractions(project_id, study_design);

CREATE TRIGGER extractions_updated_at
  BEFORE UPDATE ON public.extractions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 13. ROB ASSESSMENTS ──

CREATE TABLE public.rob_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rob_tool TEXT NOT NULL CHECK (rob_tool IN (
    'rob2', 'robins_i', 'nos_cohort', 'nos_case_control',
    'quadas2', 'quips', 'jbi_cohort', 'jbi_case_control',
    'jbi_cross_sectional', 'jbi_qualitative', 'jbi_prevalence'
  )),
  domains JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_judgment TEXT NOT NULL CHECK (overall_judgment IN (
    'low', 'some_concerns', 'high', 'critical', 'not_assessed'
  )),
  overall_rationale TEXT,
  direction_of_bias TEXT CHECK (direction_of_bias IN (
    'favours_experimental', 'favours_comparator', 'towards_null',
    'away_from_null', 'unpredictable', 'not_applicable'
  )),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'complete', 'verified'
  )),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, project_id, rob_tool)
);

CREATE INDEX idx_rob_article ON public.rob_assessments(article_id);
CREATE INDEX idx_rob_project ON public.rob_assessments(project_id);
CREATE INDEX idx_rob_tool ON public.rob_assessments(project_id, rob_tool);

CREATE TRIGGER rob_assessments_updated_at
  BEFORE UPDATE ON public.rob_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PHASE 4: COUNTER UPDATE TRIGGERS
-- ============================================

-- Update total_records_found when articles change
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

-- Update screening counters when a final decision is made
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
-- PHASE 5: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rob_assessments ENABLE ROW LEVEL SECURITY;

-- Profiles: users see/edit only their own
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects: owners CRUD, shared users SELECT
CREATE POLICY "Owners can manage projects"
  ON public.projects FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Shared users can view projects"
  ON public.projects FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = projects.id
        AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ps.accepted = TRUE
    )
  );

-- Project stages: access via project ownership
CREATE POLICY "Access stages via project"
  ON public.project_stages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Shared users view stages"
  ON public.project_stages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = project_stages.project_id
        AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ps.accepted = TRUE
    )
  );

-- Conversations: users see their own
CREATE POLICY "Users manage own conversations"
  ON public.conversations FOR ALL USING (auth.uid() = user_id);

-- Messages: via conversation ownership
CREATE POLICY "Users see messages in own conversations"
  ON public.messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

-- Artifacts: via project ownership
CREATE POLICY "Access artifacts via project"
  ON public.artifacts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Shared users view artifacts"
  ON public.artifacts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = artifacts.project_id
        AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ps.accepted = TRUE
    )
  );

-- Project shares: involved parties
CREATE POLICY "Owners manage shares"
  ON public.project_shares FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Shared users see their shares"
  ON public.project_shares FOR SELECT USING (
    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Uploaded files: via project ownership
CREATE POLICY "Access uploads via project"
  ON public.uploaded_files FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );

-- Search runs: access via project ownership
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

-- Articles: access via project ownership
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

-- Screening decisions: access via project ownership
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

-- Extractions: access via project ownership
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

-- RoB assessments: access via project ownership
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

-- ============================================
-- PHASE 6: STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('project-files', 'project-files', false),
  ('user-uploads', 'user-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PHASE 7: BACKFILL PROFILES FOR EXISTING USERS
-- ============================================
-- If there are existing auth.users without profiles, create them
INSERT INTO public.profiles (id, full_name)
SELECT id, raw_user_meta_data ->> 'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DONE: Reload PostgREST schema cache
-- ============================================
NOTIFY pgrst, 'reload schema';
