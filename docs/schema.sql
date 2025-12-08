-- MedAI Hub - PostgreSQL/Supabase Database Schema
-- Generated for production-ready SaaS platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects Table
-- Stores research projects with dynamic framework data
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    framework_type VARCHAR(50), -- e.g., 'PICO', 'CoCoPop', 'PEO', 'SPIDER', etc.
    framework_data JSONB, -- Dynamic JSON data based on framework type
    user_id UUID, -- For multi-tenancy (add foreign key to auth.users if using Supabase Auth)
    current_step VARCHAR(50) DEFAULT 'DEFINE', -- Workflow step: DEFINE, QUERY, REVIEW, COMPLETED
    CONSTRAINT valid_framework_type CHECK (framework_type IN (
        -- Core PICO family
        'PICO', 'PICOT', 'PICOS', 'PICOC', 'PICOTS', 'PICOT-D', 'PICOTS-ComTeC',
        -- JBI Standards
        'CoCoPop', 'PEO', 'PECO', 'PFO', 'PIRD', 'PCC', 'PICo',
        -- Qualitative
        'SPIDER', 'SPICE',
        -- Policy/Complex
        'ECLIPSE', 'CIMO',
        -- Specialized
        'BeHEMoTh', 'PerSPEcTiF',
        -- Legacy
        'FINER'
    )),
    CONSTRAINT valid_current_step CHECK (current_step IN ('DEFINE', 'QUERY', 'REVIEW', 'COMPLETED'))
);

-- Migration: Add current_step column to existing projects table
-- Run this SQL in Supabase SQL Editor if upgrading existing database:
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_step VARCHAR(50) DEFAULT 'DEFINE';
-- ALTER TABLE projects ADD CONSTRAINT valid_current_step CHECK (current_step IN ('DEFINE', 'QUERY', 'REVIEW', 'COMPLETED'));

-- Files Table
-- Stores uploaded MEDLINE and other research files
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT, -- Size in bytes
    file_type VARCHAR(50), -- e.g., 'MEDLINE', 'CSV', 'PDF'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'completed', 'error'
    metadata JSONB -- Additional file metadata
);

-- Analysis Runs Table
-- Tracks all tool executions and their results
CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tool VARCHAR(20) NOT NULL, -- 'DEFINE', 'QUERY', 'REVIEW'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    results JSONB, -- Tool-specific results
    error_message TEXT,
    config JSONB, -- Tool configuration used
    CONSTRAINT valid_tool CHECK (tool IN ('DEFINE', 'QUERY', 'REVIEW'))
);

-- Literature Abstracts Table (for Review tool)
-- Stores parsed MEDLINE abstracts for screening
CREATE TABLE IF NOT EXISTS abstracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    pmid VARCHAR(20) UNIQUE NOT NULL,
    title TEXT,
    abstract TEXT,
    authors TEXT,
    journal VARCHAR(255),
    publication_date DATE,
    keywords TEXT[],
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'included', 'excluded', 'maybe'
    decision VARCHAR(20), -- 'include', 'exclude'
    ai_reasoning TEXT, -- AI's reasoning for the decision
    human_decision VARCHAR(20), -- Human override
    screened_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB, -- Additional MEDLINE fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table (for Define tool)
-- Stores conversation history for research question formulation
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Query Strings Table (for Query tool)
-- Stores generated PubMed boolean search queries
CREATE TABLE IF NOT EXISTS query_strings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    query_type VARCHAR(50), -- 'boolean', 'mesh', 'advanced'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_project_id ON analysis_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_abstracts_project_id ON abstracts(project_id);
CREATE INDEX IF NOT EXISTS idx_abstracts_pmid ON abstracts(pmid);
CREATE INDEX IF NOT EXISTS idx_abstracts_status ON abstracts(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_query_strings_project_id ON query_strings(project_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SCREENING CRITERIA TABLE (GEMS v3.1)
-- Stores PICOS eligibility criteria for each project's screening
-- ============================================================================

CREATE TABLE IF NOT EXISTS screening_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Review mode: systematic, scoping, quick
    review_mode VARCHAR(50) NOT NULL DEFAULT 'systematic',

    -- PICOS criteria stored as JSONB for flexibility
    population_criteria JSONB DEFAULT '{
        "ageGroups": ["adults"],
        "sex": "all",
        "specialConditions": [],
        "exclusions": []
    }'::jsonb,

    intervention_criteria JSONB DEFAULT '{
        "entity": "",
        "mustAppearInAbstract": true,
        "excludeSurgical": false
    }'::jsonb,

    comparator_criteria JSONB DEFAULT '{
        "required": false,
        "type": "any",
        "entity": ""
    }'::jsonb,

    outcome_criteria JSONB DEFAULT '{
        "entity": "",
        "requiresQuantitative": true,
        "acceptsQualitative": false,
        "minimumFollowUp": "",
        "excludeDiagnostics": false
    }'::jsonb,

    study_design_criteria JSONB DEFAULT '{
        "humanOnly": true,
        "allowedTypes": ["rct", "cohort", "case_control"],
        "qualityPack": true,
        "qualityPackCodes": ["S-Ex2", "S-Ex3", "S-Ex9", "S-Ex10", "S-Ex11"]
    }'::jsonb,

    -- Screening statistics
    total_screened INT DEFAULT 0,
    rule_excluded INT DEFAULT 0,
    ai_included INT DEFAULT 0,
    ai_excluded INT DEFAULT 0,
    ai_maybe INT DEFAULT 0,
    human_validated INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by project
CREATE INDEX IF NOT EXISTS idx_screening_criteria_project_id
ON screening_criteria(project_id);

-- Ensure one criteria set per project (can be updated but not duplicated)
CREATE UNIQUE INDEX IF NOT EXISTS idx_screening_criteria_unique_project
ON screening_criteria(project_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_screening_criteria_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_screening_criteria_updated ON screening_criteria;
CREATE TRIGGER trigger_screening_criteria_updated
    BEFORE UPDATE ON screening_criteria
    FOR EACH ROW
    EXECUTE FUNCTION update_screening_criteria_timestamp();

-- Comment on table
COMMENT ON TABLE screening_criteria IS 'GEMS v3.1 - Stores PICOS eligibility criteria for systematic screening';
COMMENT ON COLUMN screening_criteria.review_mode IS 'Review type: systematic (2-stage), scoping (AI-only), quick (AI+synthesis)';
COMMENT ON COLUMN screening_criteria.population_criteria IS 'P - Population criteria (age, sex, conditions)';
COMMENT ON COLUMN screening_criteria.intervention_criteria IS 'I - Intervention criteria';
COMMENT ON COLUMN screening_criteria.comparator_criteria IS 'C - Comparator criteria';
COMMENT ON COLUMN screening_criteria.outcome_criteria IS 'O - Outcome criteria';
COMMENT ON COLUMN screening_criteria.study_design_criteria IS 'S - Study design criteria and quality pack';

-- ============================================================================
-- ARTICLE DECISIONS TABLE (Smart Screener Results)
-- Stores AI and rule-based screening decisions for each article
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    pmid VARCHAR(20) NOT NULL,
    title TEXT,

    -- Decision source: 'rule_engine', 'ai_model', 'human_override'
    source VARCHAR(50) NOT NULL DEFAULT 'ai_model',

    -- Decision status: 'included', 'excluded', 'unclear'
    status VARCHAR(20) NOT NULL,

    -- Reasoning and evidence
    reason TEXT,
    evidence_quote VARCHAR(500), -- Supporting quote from abstract
    study_type_classification VARCHAR(50), -- RCT, Cohort, Case-Control, etc.
    confidence DECIMAL(3,2), -- AI confidence score 0.00-1.00

    -- Human override fields
    human_override_status VARCHAR(20),
    human_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one decision per article per project
    UNIQUE(project_id, pmid)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_article_decisions_project_id ON article_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_article_decisions_status ON article_decisions(status);
CREATE INDEX IF NOT EXISTS idx_article_decisions_pmid ON article_decisions(pmid);
CREATE INDEX IF NOT EXISTS idx_article_decisions_source ON article_decisions(source);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_article_decisions_timestamp ON article_decisions;
CREATE TRIGGER update_article_decisions_timestamp
    BEFORE UPDATE ON article_decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE article_decisions IS 'Smart Screener results - stores AI and rule-based screening decisions';
COMMENT ON COLUMN article_decisions.source IS 'Decision source: rule_engine (deterministic), ai_model (Gemini), human_override';
COMMENT ON COLUMN article_decisions.status IS 'Screening decision: included, excluded, unclear';
COMMENT ON COLUMN article_decisions.evidence_quote IS 'Supporting text extracted from abstract (max 500 chars)';
COMMENT ON COLUMN article_decisions.confidence IS 'AI confidence score between 0.00 and 1.00';
