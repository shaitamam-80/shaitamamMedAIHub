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
    CONSTRAINT valid_framework_type CHECK (framework_type IN ('PICO', 'CoCoPop', 'PEO', 'SPIDER', 'SPICE', 'ECLIPSE', 'FINER'))
);

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
