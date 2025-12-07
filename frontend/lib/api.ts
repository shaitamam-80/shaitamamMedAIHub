/**
 * MedAI Hub - API Client
 * Uses axios with Supabase auth interceptor for all API calls
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { supabase } from "./supabase";

// API URL: Use environment variable, or default to production HTTPS
let API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.shaitamam.com";

// FIX: Force HTTPS for production domain to prevent Mixed Content errors
if (
  API_BASE_URL.includes("shaitamam.com") &&
  API_BASE_URL.startsWith("http://")
) {
  API_BASE_URL = API_BASE_URL.replace("http://", "https://");
}

// Type definitions
export interface Project {
  id: string;
  name: string;
  description?: string;
  framework_type?: string;
  framework_data?: Record<string, string>;
  created_at: string;
  updated_at: string;
  user_id?: string;
  current_step?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

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

// Legacy V1 types (for backward compatibility)
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
  category?: string;
  description?: string;
}

export interface QueryGenerateResponse {
  message: string; // Markdown
  concepts: ConceptAnalysis[];
  queries: QueryStrategies;
  toolbox: ToolboxItem[];
  framework_type: string;
  framework_data: Record<string, unknown>;
}

// ============================================================================
// V2 Query Types (Professional Report Format)
// ============================================================================

// Matches backend ConceptBlock.to_dict() output
export interface ConceptAnalysisV2 {
  // Primary backend fields
  key: string;                    // "P", "I", "C", "O"
  label: string;                  // "Population", "Intervention"
  original_value: string;         // User's input
  concept_number: number;         // 1, 2, 3, 4
  component: string;              // Same as label
  mesh_terms: string[];
  free_text_terms: string[];
  entry_terms?: string[];

  // Legacy field aliases for backward compatibility
  concept?: string;               // Alias for original_value
  component_key?: string;         // Alias for key
  mesh_queries?: {
    broad?: string;
    focused?: string;
    no_explosion?: string;
  };
}

export interface QueryStrategy {
  name: string;
  purpose: string;
  formula: string;
  query: string;
  query_narrow?: string;
  expected_yield: string;
  use_cases: string[];
  hedge_applied?: string;
  hedge_citation?: string;
}

export interface ToolboxFilter {
  category: string;
  label: string;
  query: string;
  description?: string;
}

export interface TranslationStatus {
  success: boolean;
  fields_translated: string[];
  fields_failed: string[];
  method: string;
}

export interface QueryWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
}

// ============================================================================
// Concept Analysis Types (for editable concept table)
// ============================================================================

export interface ConceptTerm {
  term: string;
  source: "mesh" | "entry_term" | "ai_generated" | "mesh_derived" | "user_added";
  selected: boolean;
}

export interface ConceptAnalysisItem {
  key: string;
  label: string;
  original_value: string;
  mesh_terms: ConceptTerm[];
  free_text_terms: ConceptTerm[];
}

export interface ConceptAnalysisResponse {
  project_id: string;
  framework_type: string;
  concepts: ConceptAnalysisItem[];
}

export interface QueryGenerateResponseV2 {
  // V2 fields
  report_title?: string;
  report_intro: string;
  concepts: ConceptAnalysisV2[];
  strategies: {
    comprehensive: QueryStrategy;
    direct: QueryStrategy;
    clinical: QueryStrategy;
  };
  toolbox: ToolboxFilter[];
  formatted_report: string;

  // Legacy compatibility
  queries: QueryStrategies;
  message: string;

  // Metadata
  framework_type: string;
  framework_data: Record<string, unknown>;
  research_question?: string;

  // Transparency
  translation_status?: TranslationStatus;
  warnings: QueryWarning[];
}

// ============================================================================
// PubMed Search Types (V2 with pagination)
// ============================================================================

export interface PubMedSearchResponseV2 {
  count: number;
  returned: number;
  page: number;
  total_pages: number;
  articles: PubMedArticle[];
  query: string;
}

export interface MedlineExportRequest {
  query: string;
  pmids?: string[];
  max_results?: number;
  format?: "medline" | "csv";
}

export interface ChatResponse {
  message: string;
  extracted_fields?: Record<string, string>;
}

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

export interface BatchAnalysisResponse {
  status: string;
  message: string;
  total_abstracts: number;
}

// ============================================================================
// PubMed Search Types
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

export interface ResearchQuestionsResponse {
  project_id: string;
  project_name: string;
  framework_type: string;
  framework_data: Record<string, string>;
  research_questions: string[];
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

export interface QueryHistoryItem {
  id: string;
  project_id: string;
  query_text: string;
  query_type: string;
  created_at: string;
}

// Create axios instance
const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth interceptor: automatically inject Supabase access token
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    } catch (error) {
      // If auth fails, continue without token (for public endpoints)
      console.warn("Failed to get auth session:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors consistently
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "An error occurred";
    return Promise.reject(new Error(message));
  }
);

// API Client object with all methods
export const apiClient = {
  // ========================================================================
  // Projects
  // ========================================================================

  createProject: async (data: {
    name: string;
    description?: string;
    framework_type?: string;
  }): Promise<Project> => {
    const response = await client.post("/api/v1/projects/", data);
    return response.data;
  },

  getProjects: async (): Promise<Project[]> => {
    const response = await client.get("/api/v1/projects/");
    return response.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await client.get(`/api/v1/projects/${id}`);
    return response.data;
  },

  updateProject: async (
    id: string,
    data: Record<string, unknown>
  ): Promise<Project> => {
    const response = await client.patch(`/api/v1/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await client.delete(`/api/v1/projects/${id}`);
  },

  // ========================================================================
  // Define - Frameworks
  // ========================================================================

  getFrameworks: async (): Promise<{
    frameworks: Record<string, FrameworkSchema>;
  }> => {
    const response = await client.get("/api/v1/define/frameworks");
    return response.data;
  },

  // ========================================================================
  // Define - Chat
  // ========================================================================

  chat: async (
    projectId: string,
    message: string,
    frameworkType: string,
    language: string = "en"
  ): Promise<ChatResponse> => {
    const response = await client.post("/api/v1/define/chat", {
      project_id: projectId,
      message,
      framework_type: frameworkType,
      language,
    });
    return response.data;
  },

  getConversation: async (
    projectId: string
  ): Promise<{
    messages: ChatMessage[];
    framework_data?: Record<string, string>;
  }> => {
    const response = await client.get(
      `/api/v1/define/conversation/${projectId}`
    );
    return response.data;
  },

  clearConversation: async (projectId: string): Promise<void> => {
    await client.delete(`/api/v1/define/conversation/${projectId}`);
  },

  // ========================================================================
  // Define - FINER Assessment
  // ========================================================================

  assessFiner: async (
    projectId: string,
    researchQuestion: string,
    frameworkType?: string,
    frameworkData?: Record<string, string>,
    language: string = "en"
  ): Promise<FinerAssessmentResponse> => {
    const response = await client.post("/api/v1/define/finer-assessment", {
      project_id: projectId,
      research_question: researchQuestion,
      framework_type: frameworkType,
      framework_data: frameworkData,
      language,
    });
    return response.data;
  },

  // ========================================================================
  // Query
  // ========================================================================

  generateQuery: async (projectId: string): Promise<QueryGenerateResponse> => {
    const response = await client.post("/api/v1/query/generate", {
      project_id: projectId,
      framework_data: {}, // Will be fetched from project backend-side if empty
    });
    return response.data;
  },

  generateQueryFromQuestion: async (
    projectId: string,
    researchQuestion: string,
    frameworkType?: string
  ): Promise<QueryGenerateResponse> => {
    const response = await client.post("/api/v1/query/generate-from-question", {
      project_id: projectId,
      research_question: researchQuestion,
      framework_type: frameworkType,
    });
    return response.data;
  },

  getQueryHistory: async (
    projectId: string
  ): Promise<{ queries: QueryHistoryItem[] }> => {
    const response = await client.get(`/api/v1/query/history/${projectId}`);
    return response.data;
  },

  getResearchQuestions: async (
    projectId: string
  ): Promise<ResearchQuestionsResponse> => {
    const response = await client.get(
      `/api/v1/query/research-questions/${projectId}`
    );
    return response.data;
  },

  // V2: Generate query with professional report format
  generateQueryV2: async (
    projectId: string,
    researchQuestion: string,
    frameworkType?: string
  ): Promise<QueryGenerateResponseV2> => {
    const response = await client.post("/api/v1/query/generate-from-question", {
      project_id: projectId,
      research_question: researchQuestion,
      framework_type: frameworkType,
    });
    return response.data;
  },

  // ========================================================================
  // Query - PubMed Search Execution
  // ========================================================================

  executePubMedSearch: async (
    query: string,
    maxResults: number = 20,
    sort: "relevance" | "date" = "relevance"
  ): Promise<PubMedSearchResponse> => {
    const response = await client.post("/api/v1/query/execute", {
      query,
      max_results: maxResults,
      sort,
    });
    return response.data;
  },

  // V2: Search with pagination
  executePubMedSearchPaginated: async (
    query: string,
    page: number = 1,
    maxResults: number = 20,
    sort: "relevance" | "date" = "relevance"
  ): Promise<PubMedSearchResponseV2> => {
    const response = await client.post("/api/v1/query/execute", {
      query,
      max_results: maxResults,
      page,
      sort,
    });
    return response.data;
  },

  validateQuery: async (query: string): Promise<QueryValidationResponse> => {
    const response = await client.post("/api/v1/query/validate", {
      query,
    });
    return response.data;
  },

  getPubMedAbstract: async (pmid: string): Promise<PubMedAbstractResponse> => {
    const response = await client.get(`/api/v1/query/abstract/${pmid}`);
    return response.data;
  },

  // V2: Export to MEDLINE or CSV format
  exportResults: async (
    query: string,
    pmids?: string[],
    maxResults: number = 100,
    format: "medline" | "csv" = "medline"
  ): Promise<Blob> => {
    const response = await client.post(
      "/api/v1/query/export",
      {
        query,
        pmids,
        max_results: maxResults,
        format,
      },
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  // ========================================================================
  // Review - File Upload
  // ========================================================================

  uploadMedlineFile: async (
    projectId: string,
    file: File
  ): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", projectId);

    // Axios automatically uses the auth interceptor for file uploads too
    const response = await client.post("/api/v1/review/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // ========================================================================
  // Review - Abstracts
  // ========================================================================

  getAbstracts: async (
    projectId: string,
    status?: string
  ): Promise<AbstractResponse[]> => {
    const params = status ? `?status=${status}` : "";
    const response = await client.get(
      `/api/v1/review/abstracts/${projectId}${params}`
    );
    return response.data;
  },

  updateAbstractDecision: async (
    abstractId: string,
    decision: string
  ): Promise<AbstractResponse> => {
    const response = await client.patch(
      `/api/v1/review/abstracts/${abstractId}`,
      { decision }
    );
    return response.data;
  },

  // ========================================================================
  // Review - Batch Analysis
  // ========================================================================

  startBatchAnalysis: async (
    projectId: string,
    fileId: string
  ): Promise<BatchAnalysisResponse> => {
    const response = await client.post("/api/v1/review/analyze", {
      project_id: projectId,
      file_id: fileId,
    });
    return response.data;
  },

  // ========================================================================
  // Health Check
  // ========================================================================

  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await client.get("/health");
    return response.data;
  },

  // ========================================================================
  // Query - Concept Analysis
  // ========================================================================

  /**
   * Analyze framework components and get MeSH + AI-generated terms
   * Returns editable concept table data
   */
  analyzeConceptsForProject: async (
    projectId: string
  ): Promise<ConceptAnalysisResponse> => {
    const response = await client.get(
      `/api/v1/query/analyze-concepts/${projectId}`
    );
    return response.data;
  },

  // ========================================================================
  // Screening
  // ========================================================================

  getCriteriaLibrary: async () => {
    const response = await client.get("/api/v1/screening/criteria-library");
    return response.data;
  },

  initCriteria: async (data: {
    project_id: string;
    review_type: string;
    filters: Record<string, unknown>;
  }) => {
    const response = await client.post("/api/v1/screening/init-criteria", data);
    return response.data;
  },

  processPmids: async (data: {
    project_id: string;
    pmids: string[];
    criteria_config: {
      review_type: string;
      languages: string[];
      population: { codes: string[]; custom_text?: string };
      study_design: { inclusion_codes: string[]; exclusion_codes: string[] };
      date_range_start?: number;
      date_range_end?: number;
      custom_inclusion?: string;
      custom_exclusion?: string;
    };
  }) => {
    const response = await client.post("/api/v1/screening/process-pmids", data);
    return response.data;
  },
};

export default apiClient;
