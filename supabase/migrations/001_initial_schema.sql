-- ============================================
-- SR Portal - Initial Database Schema
-- Supabase/PostgreSQL Migration
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
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
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. PROJECTS
-- ============================================
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

-- ============================================
-- 3. PROJECT STAGES
-- ============================================
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

-- ============================================
-- 4. CONVERSATIONS
-- ============================================
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

-- ============================================
-- 5. MESSAGES
-- ============================================
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

-- ============================================
-- 6. ARTIFACTS
-- ============================================
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

-- ============================================
-- 7. PROJECT SHARES
-- ============================================
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

-- ============================================
-- 8. UPLOADED FILES
-- ============================================
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

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('project-files', 'project-files', false),
  ('user-uploads', 'user-uploads', false)
ON CONFLICT (id) DO NOTHING;
