# MedAI Hub - Database Schema Documentation

## Overview

MedAI Hub uses Supabase (PostgreSQL) as its database. The schema is designed for multi-tenant use with user-level data isolation via Row Level Security (RLS).

## Setup Instructions

### 1. Create Tables

Run `schema.sql` in Supabase SQL Editor to create all tables:

```bash
# In Supabase Dashboard:
# SQL Editor → New Query → Paste contents of docs/schema.sql → Run
```

### 2. Enable Row Level Security

After tables are created, run `rls_policies.sql`:

```bash
# SQL Editor → New Query → Paste contents of docs/rls_policies.sql → Run
```

## Entity Relationship Diagram

```
┌─────────────┐
│   projects  │
├─────────────┤
│ id (PK)     │
│ user_id     │──────────────────────────────────────┐
│ name        │                                      │
│ description │                                      │
│ framework_* │                                      │
└──────┬──────┘                                      │
       │                                             │
       │ 1:N                                         │
       ▼                                             │
┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│    files    │  │  chat_msgs  │  │query_strings│   │
├─────────────┤  ├─────────────┤  ├─────────────┤   │
│ id (PK)     │  │ id (PK)     │  │ id (PK)     │   │
│ project_id  │  │ project_id  │  │ project_id  │   │
│ filename    │  │ role        │  │ query_text  │   │
│ ...         │  │ content     │  │ ...         │   │
└──────┬──────┘  └─────────────┘  └─────────────┘   │
       │                                             │
       │ 1:N                                         │
       ▼                                             │
┌─────────────┐                                      │
│  abstracts  │     ┌──────────────┐                │
├─────────────┤     │analysis_runs │                │
│ id (PK)     │     ├──────────────┤                │
│ project_id  │     │ id (PK)      │                │
│ file_id     │     │ project_id   │────────────────┘
│ pmid        │     │ tool         │
│ ...         │     │ status       │
└─────────────┘     └──────────────┘
```

## Tables

### projects

Main entity for research projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Project name |
| description | TEXT | Optional description |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Auto-updated timestamp |
| framework_type | VARCHAR(50) | PICO, CoCoPop, etc. |
| framework_data | JSONB | Dynamic framework fields |
| user_id | UUID | Owner's user ID |

**Constraints:**
- `framework_type` must be one of: PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER

### files

Uploaded MEDLINE and research files.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to projects |
| filename | VARCHAR(255) | Original filename |
| file_path | TEXT | Storage path |
| file_size | BIGINT | Size in bytes |
| file_type | VARCHAR(50) | MEDLINE, CSV, PDF |
| uploaded_at | TIMESTAMPTZ | Upload timestamp |
| status | VARCHAR(50) | uploaded, processing, completed, error |
| metadata | JSONB | Additional file info |

### abstracts

Parsed literature abstracts for screening.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to projects |
| file_id | UUID | Foreign key to files |
| pmid | VARCHAR(20) | PubMed ID (unique) |
| title | TEXT | Article title |
| abstract | TEXT | Abstract text |
| authors | TEXT | Author list |
| journal | VARCHAR(255) | Journal name |
| publication_date | DATE | Publication date |
| keywords | TEXT[] | Array of keywords |
| status | VARCHAR(20) | pending, included, excluded, maybe |
| decision | VARCHAR(20) | AI decision: include/exclude |
| ai_reasoning | TEXT | AI's reasoning |
| human_decision | VARCHAR(20) | Human override |
| screened_at | TIMESTAMPTZ | When screened |
| metadata | JSONB | Additional MEDLINE fields |
| created_at | TIMESTAMPTZ | Record creation |

### chat_messages

Conversation history for Define tool.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to projects |
| role | VARCHAR(20) | user, assistant, system |
| content | TEXT | Message content |
| created_at | TIMESTAMPTZ | Message timestamp |
| metadata | JSONB | Additional data |

### query_strings

Generated PubMed search queries.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to projects |
| query_text | TEXT | Boolean query string |
| query_type | VARCHAR(50) | boolean, mesh, advanced |
| created_at | TIMESTAMPTZ | Generation timestamp |
| metadata | JSONB | Additional info |

### analysis_runs

Tool execution tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to projects |
| tool | VARCHAR(20) | DEFINE, QUERY, REVIEW |
| status | VARCHAR(50) | pending, running, completed, failed |
| started_at | TIMESTAMPTZ | Start time |
| completed_at | TIMESTAMPTZ | End time |
| results | JSONB | Tool-specific results |
| error_message | TEXT | Error details if failed |
| config | JSONB | Configuration used |

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_analysis_runs_project_id ON analysis_runs(project_id);
CREATE INDEX idx_abstracts_project_id ON abstracts(project_id);
CREATE INDEX idx_abstracts_pmid ON abstracts(pmid);
CREATE INDEX idx_abstracts_status ON abstracts(status);
CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX idx_query_strings_project_id ON query_strings(project_id);
```

## Triggers

### Auto-update timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security

All tables have RLS enabled with these policy patterns:

### Direct User Tables (projects)
```sql
-- Users can only access their own projects
USING (auth.uid() = user_id)
```

### Related Tables (files, abstracts, etc.)
```sql
-- Access via project ownership
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = table.project_id
        AND projects.user_id = auth.uid()
    )
)
```

## JSONB Usage

### framework_data Example (PICO)
```json
{
  "population": "Adults over 65 with type 2 diabetes",
  "intervention": "Metformin monotherapy",
  "comparison": "Lifestyle modifications alone",
  "outcome": "HbA1c reduction at 6 months"
}
```

### metadata Example (abstracts)
```json
{
  "mesh_terms": ["Diabetes Mellitus, Type 2", "Metformin"],
  "publication_types": ["Randomized Controlled Trial"],
  "country": "United States",
  "language": "English"
}
```

## Cascade Deletes

All foreign keys use `ON DELETE CASCADE`:
- Deleting a project deletes all associated files, abstracts, messages, queries, and runs
- Deleting a file deletes associated abstracts

## Common Queries

### Get project with abstracts count
```sql
SELECT
    p.*,
    COUNT(a.id) as abstract_count
FROM projects p
LEFT JOIN abstracts a ON a.project_id = p.id
WHERE p.id = 'project-uuid'
GROUP BY p.id;
```

### Get screening progress
```sql
SELECT
    status,
    COUNT(*) as count
FROM abstracts
WHERE project_id = 'project-uuid'
GROUP BY status;
```

### Get recent activity
```sql
SELECT
    'project' as type,
    name as title,
    updated_at
FROM projects
WHERE user_id = 'user-uuid'
ORDER BY updated_at DESC
LIMIT 10;
```

## Backup Recommendations

1. Enable Supabase Point-in-Time Recovery
2. Schedule daily backups
3. Test restore procedures regularly
4. Export critical data periodically

## Migration Notes

When adding new tables:
1. Create table with schema
2. Add necessary indexes
3. Create RLS policies
4. Update backend services
5. Update frontend types
