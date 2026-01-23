-- MedAI Hub - PostgreSQL/Supabase Database Schema
-- Simplified version: Define Tool + Projects only

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
    current_step VARCHAR(50) DEFAULT 'DEFINE', -- Workflow step
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
    ))
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);

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
