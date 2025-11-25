-- MedAI Hub - Row Level Security (RLS) Policies
-- Run this script in Supabase SQL Editor to enable user-level data isolation
-- Prerequisites: Users must be authenticated via Supabase Auth

-- =====================================================
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE abstracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_strings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Projects Policies
-- =====================================================

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create projects (user_id set by backend)
CREATE POLICY "Users can create projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- Files Policies (inherit from project ownership)
-- =====================================================

CREATE POLICY "Users can view files in own projects"
    ON files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = files.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create files in own projects"
    ON files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = files.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update files in own projects"
    ON files FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = files.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete files in own projects"
    ON files FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = files.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- =====================================================
-- Analysis Runs Policies
-- =====================================================

CREATE POLICY "Users can view analysis runs in own projects"
    ON analysis_runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = analysis_runs.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create analysis runs in own projects"
    ON analysis_runs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = analysis_runs.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update analysis runs in own projects"
    ON analysis_runs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = analysis_runs.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- =====================================================
-- Abstracts Policies
-- =====================================================

CREATE POLICY "Users can view abstracts in own projects"
    ON abstracts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = abstracts.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create abstracts in own projects"
    ON abstracts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = abstracts.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update abstracts in own projects"
    ON abstracts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = abstracts.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- =====================================================
-- Chat Messages Policies
-- =====================================================

CREATE POLICY "Users can view chat messages in own projects"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = chat_messages.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create chat messages in own projects"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = chat_messages.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chat messages in own projects"
    ON chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = chat_messages.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- =====================================================
-- Query Strings Policies
-- =====================================================

CREATE POLICY "Users can view query strings in own projects"
    ON query_strings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = query_strings.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create query strings in own projects"
    ON query_strings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = query_strings.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- =====================================================
-- Service Role Bypass
-- Backend uses service_role key which bypasses RLS
-- This is intentional for background tasks like file parsing
-- =====================================================

-- Note: If using anon key in backend, you may need to add policies
-- that allow the service account to perform operations.
-- Current setup assumes backend uses service_role key.
