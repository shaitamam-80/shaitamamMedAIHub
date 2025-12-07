# MedAI Hub: Smart Screener Module (GEMS Integration)

Development Specification v1.01.

Overview

The Smart Screener is a new module for MedAI Hub that automates the screening of medical literature (Titles/Abstracts). It bridges the gap between the Query Tool (retrieval) and the Review Tool (full-text review).

Methodology: Based on GEMS v3.1 (Guided Evidence Mapping & Screening).

Core Architecture: Hybrid Filtering Engine:

Layer A (Python): Fast, deterministic rule-based filtering (metadata, date, language, publication type).

Layer B (Gemini AI): Semantic analysis, relevance checking, and classification.

## Database Schema (Supabase/PostgreSQL)

Run these SQL commands to prepare the database.
-- 1. Criteria Configuration (Snapshot of settings used for screening)
CREATE TABLE screening_criteria (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
review_type VARCHAR(50) NOT NULL, -- 'systematic', 'scoping', 'quick'
filters JSONB NOT NULL, -- Stores config: { years: 5, population_codes: ['P1'], ... }
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Decisions (Per article results)
CREATE TABLE article_decisions (
project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
pmid VARCHAR(20) NOT NULL,
title TEXT,

-- Decision Source & Status
source VARCHAR(20), -- 'rule_engine', 'ai_model', 'human_override'
status VARCHAR(20), -- 'included', 'excluded', 'unclear'
reason TEXT, -- e.g. "Excluded by Date (2015)" or "AI: Does not mention Intervention"

-- AI Metadata
evidence_quote TEXT, -- Verbatim quote from abstract
study_type_classification TEXT, -- e.g. "RCT", "Review"

-- Human Interaction
human_override_status VARCHAR(20),
human_notes TEXT,

updated_at TIMESTAMPTZ DEFAULT NOW(),
PRIMARY KEY (project_id, pmid)
);

CREATE INDEX idx_decisions_project ON article_decisions(project_id); 3. Backend Implementation (FastAPI)3.1. Parsing Service (app/services/medline_parser.py)Goal: Convert raw MEDLINE text format (from PubMed) into structured JSON.Critical Rules:Split by PMID-.Handle multi-line fields (indentation of 6 spaces).Extract: PMID, TI, AB, PT (Publication Type), MH (MeSH), DP (Date), LA (Language).3.2. Criteria Library (app/core/gems/criteria_library.py)Goal: Store the GEMS logic codes.Structure: Dictionary of dictionaries.P1: Adults (18+)S-Ex1: Exclude AnimalsS2: RCTs OnlyUsage: Frontend sends codes (e.g., ["P1", "S2"]), Backend looks up logic.3.3. Rule Engine - Layer A (app/services/rule_engine.py)Goal: Zero-cost filtering before AI.Logic:Input: Parsed Abstract + Criteria Config.Process:Check Date (DP vs date_range).Check Language (LA vs language).Check PubType (PT vs study_design_codes exclusions like Review, Editorial).Output: Pass (continue to AI) or Fail (save as Excluded).3.4. AI Service - Layer B (app/services/ai_service.py)Goal: Semantic understanding.Function: analyze_abstract_gems(abstract, context, criteria)Prompt Construction:System: "You are an expert Systematic Reviewer..." (Adjust tone based on Review Type).Context: Insert PICO/Framework data defined in Step 1.Rules: Insert natural language description of selected Criteria Codes.Output JSON: { status, reason, evidence_quote, study_type }.3.5. Orchestrator (app/services/screening_service.py)Goal: Manage the pipeline.Flow:Fetch MEDLINE from PubMed (pubmed_service.fetch_details_as_medline).Parse.Run Rule Engine (Layer A).Run AI Service (Layer B) in parallel (Semaphore limit: 5-10).Save all results to DB (article_decisions).Return stats.4. Frontend Implementation (Next.js)4.1. The Wizard (components/screening/ScreeningWizard.tsx)A 4-step guided process. State is managed at top level.Step 1: Framework ValidationDisplay current PICO/SPIDER data.User confirms or edits context.Step 2: Review Type SelectionCards for: Systematic (Strict), Scoping (Broad), Quick Answer (Synthesized).Step 3: Criteria BuilderTabbed interface (Population, Study Design, etc.).Checkboxes mapped to Criteria Library codes.Step 4: Execution Console"Terminal-like" view showing progress logs.Progress bar.Final stats summary (Included/Excluded).4.2. Results View (app/review/page.tsx integration)Smart Card Layout:Show "AI Recommendation" banner (Green/Red).Highlight evidence_quote in text.Allow easy Override.5. API Endpoints (app/api/routes/screening.py)POST /api/v1/screening/init-criteria: Save the config before starting.POST /api/v1/screening/process-pmids: Input list of PMIDs -> Run full pipeline.6. Logic Flow ExampleInput:Project: "Aspirin for Headache"Review Type: SystematicCriteria: S2 (RCTs Only), P1 (Adults)Process:Article A (Review): Rule Engine sees PT: Review. Action: EXCLUDE (Source: Rule).Article B (RCT, Rats): Rule Engine passes. AI reads abstract. Sees "rat model". Action: EXCLUDE (Source: AI, Reason: "Animal Study").Article C (RCT, Humans): Rule Engine passes. AI reads. Matches PICO. Action: INCLUDE (Source: AI).
