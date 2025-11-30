/**
 * MedAI Hub - API Type Definitions
 * All TypeScript interfaces for API requests and responses
 */

// ============================================================================
// Projects
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  framework_type?: string;
  framework_data?: Record<string, string>;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// ============================================================================
// Define Tool - Chat
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  extracted_fields?: Record<string, string>;
}

// ============================================================================
// Define Tool - Frameworks
// ============================================================================

export interface FrameworkField {
  key: string;
  label: string;
  description: string;
}

export interface FrameworkSchema {
  name: string;
  description: string;
  fields: FrameworkField[];
}

// ============================================================================
// Define Tool - FINER Assessment
// ============================================================================

export interface FinerScore {
  score: "high" | "medium" | "low";
  reason: string;
}

export interface FinerAssessmentResponse {
  F: FinerScore;
  I: FinerScore;
  N: FinerScore;
  E: FinerScore;
  R: FinerScore;
  overall: "proceed" | "revise" | "reconsider";
  suggestions: string[];
  research_question: string;
  framework_type: string;
}

// ============================================================================
// Query Tool - Generation
// ============================================================================

export interface ConceptAnalysis {
  concept_number: number;
  component: string;
  free_text_terms: string[];
  mesh_terms: string[];
}

export interface QueryStrategies {
  broad: string;
  focused: string;
  clinical_filtered: string;
}

export interface ToolboxItem {
  label: string;
  query: string;
}

export interface QueryGenerateResponse {
  message: string; // Markdown
  concepts: ConceptAnalysis[];
  queries: QueryStrategies;
  toolbox: ToolboxItem[];
  framework_type: string;
  framework_data: Record<string, unknown>;
}

export interface QueryHistoryItem {
  id: string;
  project_id: string;
  query_text: string;
  query_type: string;
  created_at: string;
}

export interface ResearchQuestionsResponse {
  project_id: string;
  project_name: string;
  framework_type: string;
  framework_data: Record<string, string>;
  research_questions: string[];
}

// ============================================================================
// Query Tool - PubMed Search
// ============================================================================

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pubdate: string;
  doi?: string;
  pubtype?: string[];
}

export interface PubMedSearchResponse {
  count: number;
  returned: number;
  articles: PubMedArticle[];
  query: string;
}

export interface QueryValidationResponse {
  valid: boolean;
  count: number;
  query_translation: string;
  errors: string[];
}

export interface PubMedAbstractResponse {
  pmid: string;
  title: string;
  abstract: string;
  authors: string;
  journal: string;
  year: string;
  keywords: string[];
}

// ============================================================================
// Review Tool - Files
// ============================================================================

export interface FileUploadResponse {
  id: string;
  project_id: string;
  filename: string;
  file_type: string;
  status: "uploaded" | "processing" | "completed" | "error";
  total_abstracts?: number;
  processed_abstracts?: number;
  error_message?: string;
  created_at: string;
}

// ============================================================================
// Review Tool - Abstracts
// ============================================================================

export interface AbstractResponse {
  id: string;
  file_id: string;
  pmid: string;
  title?: string;
  abstract_text?: string;
  authors?: string;
  journal?: string;
  publication_date?: string;
  keywords?: string[];
  status: "pending" | "include" | "exclude" | "maybe";
  ai_decision?: string;
  ai_reasoning?: string;
  human_decision?: string;
  user_notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BatchAnalysisResponse {
  status: string;
  message: string;
  total_abstracts: number;
}
