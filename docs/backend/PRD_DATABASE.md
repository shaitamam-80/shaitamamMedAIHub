# PRD: Database Schema

## General Information

| Field | Value |
|-------|-------|
| **Module Name** | Database Schema |
| **File** | `docs/schema.sql` |
| **Platform** | Supabase (PostgreSQL 15+) |
| **Priority** | P0 - Critical |
| **Status** | Implemented |
| **Version** | 1.0 |

---

## 1. Overview

### 1.1 Purpose

The database schema defines all tables, relationships, indexes, and constraints for the MedAI Hub platform. It uses Supabase PostgreSQL with UUID primary keys and JSONB for flexible data storage.

### 1.2 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                            ┌──────────────────┐                             │
│                            │     projects     │                             │
│                            │    (Central)     │                             │
│                            └────────┬─────────┘                             │
│                                     │                                        │
│        ┌─────────────┬──────────────┼──────────────┬─────────────┐          │
│        │             │              │              │             │          │
│        ▼             ▼              ▼              ▼             ▼          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │   files   │ │   chat_   │ │  query_   │ │ analysis_ │ │ abstracts │     │
│  │           │ │ messages  │ │  strings  │ │   runs    │ │           │     │
│  └─────┬─────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
│        │                                                        ▲           │
│        │                                                        │           │
│        └────────────────────────────────────────────────────────┘           │
│                           file_id reference                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tables

### 2.1 Projects Table

**Purpose:** Central table storing research projects with dynamic framework data.

```sql
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    framework_type VARCHAR(50),
    framework_data JSONB,
    user_id UUID,
    CONSTRAINT valid_framework_type CHECK (
        framework_type IN ('PICO', 'CoCoPop', 'PEO', 'SPIDER',
                          'SPICE', 'ECLIPSE', 'FINER')
    )
);
```

#### Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, auto-generated |
| `name` | VARCHAR(255) | No | Project name |
| `description` | TEXT | Yes | Project description |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |
| `framework_type` | VARCHAR(50) | Yes | PICO, CoCoPop, etc. |
| `framework_data` | JSONB | Yes | Dynamic framework fields |
| `user_id` | UUID | Yes | Owner (FK to auth.users) |

#### Framework Data Example

```json
{
  "P": "elderly adults (65+) with type 2 diabetes",
  "I": "metformin 500mg twice daily",
  "C": "placebo or standard care",
  "O": "HbA1c reduction"
}
```

---

### 2.2 Files Table

**Purpose:** Tracks uploaded MEDLINE and other research files.

```sql
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'uploaded',
    metadata JSONB
);
```

#### Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | FK to projects (CASCADE) |
| `filename` | VARCHAR(255) | No | Original filename |
| `file_path` | TEXT | No | Server storage path |
| `file_size` | BIGINT | Yes | Size in bytes |
| `file_type` | VARCHAR(50) | Yes | MEDLINE, CSV, PDF |
| `uploaded_at` | TIMESTAMPTZ | No | Upload timestamp |
| `status` | VARCHAR(50) | No | uploaded/processing/completed/error |
| `metadata` | JSONB | Yes | Additional file info |

#### Status Values

| Status | Meaning |
|--------|---------|
| `uploaded` | File saved, not yet parsed |
| `processing` | Parser running |
| `completed` | Parsing done, abstracts created |
| `error` | Parsing failed |

---

### 2.3 Abstracts Table

**Purpose:** Stores parsed MEDLINE abstracts for screening.

```sql
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
    status VARCHAR(20) DEFAULT 'pending',
    decision VARCHAR(20),
    ai_reasoning TEXT,
    human_decision VARCHAR(20),
    screened_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | FK to projects (CASCADE) |
| `file_id` | UUID | Yes | FK to files (CASCADE) |
| `pmid` | VARCHAR(20) | No | PubMed ID (UNIQUE) |
| `title` | TEXT | Yes | Article title |
| `abstract` | TEXT | Yes | Abstract text |
| `authors` | TEXT | Yes | Authors (semicolon separated) |
| `journal` | VARCHAR(255) | Yes | Journal name |
| `publication_date` | DATE | Yes | Publication date |
| `keywords` | TEXT[] | Yes | MeSH terms and keywords |
| `status` | VARCHAR(20) | No | pending/include/exclude/maybe |
| `decision` | VARCHAR(20) | Yes | AI decision |
| `ai_reasoning` | TEXT | Yes | AI explanation |
| `human_decision` | VARCHAR(20) | Yes | Human override |
| `screened_at` | TIMESTAMPTZ | Yes | When screened |
| `metadata` | JSONB | Yes | All MEDLINE tags |
| `created_at` | TIMESTAMPTZ | No | Import timestamp |

#### Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Not yet screened |
| `include` | Meets criteria |
| `exclude` | Does not meet criteria |
| `maybe` | Needs human review |

---

### 2.4 Chat Messages Table

**Purpose:** Stores conversation history for Define tool.

```sql
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);
```

#### Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | FK to projects (CASCADE) |
| `role` | VARCHAR(20) | No | user/assistant/system |
| `content` | TEXT | No | Message content |
| `created_at` | TIMESTAMPTZ | No | Message timestamp |
| `metadata` | JSONB | Yes | Additional data |

#### Role Values

| Role | Description |
|------|-------------|
| `user` | Human message |
| `assistant` | AI response |
| `system` | System message (rarely used) |

---

### 2.5 Query Strings Table

**Purpose:** Stores generated PubMed boolean search queries.

```sql
CREATE TABLE IF NOT EXISTS query_strings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    query_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);
```

#### Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | FK to projects (CASCADE) |
| `query_text` | TEXT | No | Full PubMed query |
| `query_type` | VARCHAR(50) | Yes | boolean/mesh/advanced |
| `created_at` | TIMESTAMPTZ | No | Generation timestamp |
| `metadata` | JSONB | Yes | Full AI response, etc. |

---

### 2.6 Analysis Runs Table

**Purpose:** Tracks all tool executions and their results.

```sql
CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tool VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    results JSONB,
    error_message TEXT,
    config JSONB,
    CONSTRAINT valid_tool CHECK (tool IN ('DEFINE', 'QUERY', 'REVIEW'))
);
```

#### Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | FK to projects (CASCADE) |
| `tool` | VARCHAR(20) | No | DEFINE/QUERY/REVIEW |
| `status` | VARCHAR(50) | No | pending/running/completed/failed |
| `started_at` | TIMESTAMPTZ | No | Start timestamp |
| `completed_at` | TIMESTAMPTZ | Yes | End timestamp |
| `results` | JSONB | Yes | Tool output |
| `error_message` | TEXT | Yes | Error details |
| `config` | JSONB | Yes | Tool configuration |

#### Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Not started |
| `running` | In progress |
| `completed` | Finished successfully |
| `failed` | Finished with error |

---

## 3. Indexes

```sql
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_project_id ON analysis_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_abstracts_project_id ON abstracts(project_id);
CREATE INDEX IF NOT EXISTS idx_abstracts_pmid ON abstracts(pmid);
CREATE INDEX IF NOT EXISTS idx_abstracts_status ON abstracts(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_query_strings_project_id ON query_strings(project_id);
```

---

## 4. Triggers

### 4.1 Auto-Update Timestamp

```sql
-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 5. Cascade Delete Behavior

### 5.1 Delete Chain

```
DELETE projects WHERE id = ?
    ├── DELETE files WHERE project_id = ?
    │       └── DELETE abstracts WHERE file_id = ?
    ├── DELETE chat_messages WHERE project_id = ?
    ├── DELETE query_strings WHERE project_id = ?
    ├── DELETE analysis_runs WHERE project_id = ?
    └── DELETE abstracts WHERE project_id = ?
```

### 5.2 Cascade Rules

| Parent | Child | On Delete |
|--------|-------|-----------|
| projects | files | CASCADE |
| projects | abstracts | CASCADE |
| projects | chat_messages | CASCADE |
| projects | query_strings | CASCADE |
| projects | analysis_runs | CASCADE |
| files | abstracts | CASCADE |

---

## 6. Row Level Security (RLS)

**Note:** RLS is currently commented out for development. Enable before production.

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE
    USING (auth.uid() = user_id);
```

---

## 7. JSONB Schemas

### 7.1 Framework Data (projects.framework_data)

```json
// PICO
{
  "P": "string",
  "I": "string",
  "C": "string",
  "O": "string"
}

// CoCoPop
{
  "Condition": "string",
  "Context": "string",
  "Population": "string"
}

// SPIDER
{
  "S": "string",
  "PI": "string",
  "D": "string",
  "E": "string",
  "R": "string"
}
```

### 7.2 Abstract Metadata (abstracts.metadata)

```json
{
  "MH": ["MeSH term 1", "MeSH term 2"],
  "PT": "Publication Type",
  "OT": ["keyword1", "keyword2"],
  "AD": "Author affiliation",
  "LA": "eng",
  "GR": "Grant number",
  "any_other_tag": "value"
}
```

### 7.3 Analysis Results (analysis_runs.results)

```json
// For QUERY tool
{
  "message": "markdown explanation",
  "concepts": [...],
  "queries": {
    "broad": "...",
    "focused": "...",
    "clinical_filtered": "..."
  },
  "toolbox": [...]
}

// For REVIEW tool
{
  "total_processed": 100,
  "total_abstracts": 150
}
```

---

## 8. Development Tasks

### 8.1 Implemented

- [x] All table definitions
- [x] Foreign key constraints
- [x] Cascade delete rules
- [x] Performance indexes
- [x] Updated_at trigger
- [x] Framework type constraint

### 8.2 Tasks for Later

- [ ] **DB-T001**: Enable Row Level Security
- [ ] **DB-T002**: Add user_id FK to auth.users
- [ ] **DB-T003**: Add soft delete support
- [ ] **DB-T004**: Add audit log table
- [ ] **DB-T005**: Add full-text search on abstracts

---

## 9. Migration Notes

### 9.1 Initial Setup

```sql
-- Run in Supabase SQL Editor
-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Run schema.sql contents
-- 3. Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

### 9.2 Adding New Framework Type

```sql
-- Update constraint to include new framework
ALTER TABLE projects
DROP CONSTRAINT valid_framework_type;

ALTER TABLE projects
ADD CONSTRAINT valid_framework_type CHECK (
    framework_type IN ('PICO', 'CoCoPop', 'PEO', 'SPIDER',
                      'SPICE', 'ECLIPSE', 'FINER', 'NEW_FRAMEWORK')
);
```

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial schema |
