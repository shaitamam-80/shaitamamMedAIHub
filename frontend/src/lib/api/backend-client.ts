/**
 * Backend API Client
 * ==================
 *
 * Handles all communication between the SR-Portal frontend and the
 * MedAI Hub FastAPI backend. This replaces the previous local API routes
 * (src/app/api/chat/route.ts) with calls to the external backend service.
 *
 * Architecture:
 *   SR-Portal (Vercel) --REST/SSE--> MedAI Hub Backend (Railway/FastAPI)
 *                                          |
 *                                     Gemini API + Skills
 *
 * The backend base URL is configured via NEXT_PUBLIC_BACKEND_URL env var.
 * In development: http://localhost:8000
 * In production: https://your-railway-app.railway.app
 */

import { createClient } from '@/lib/supabase/client';

// Backend base URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

/**
 * Get the current user's auth token from Supabase session.
 * Used to authenticate requests to the backend.
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Build the full API URL for an endpoint.
 */
function apiUrl(path: string): string {
  return `${BACKEND_URL}${API_PREFIX}${path}`;
}

/**
 * Common headers for API requests.
 */
async function getHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// ============================================================================
// Chat API (SSE Streaming)
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestPayload {
  messages: ChatMessage[];
  skillName: string;
  projectContext?: {
    projectId: string;
    stage: string;
    stageName: string;
  };
  language?: 'he' | 'en';
  attachedFileContent?: string;
}

/**
 * Send a chat message and get a streaming SSE response.
 *
 * Returns a ReadableStream that emits SSE events matching the format
 * expected by ChatInterface.tsx:
 *   data: {"content": "chunk of text"}
 *   data: {"error": "error message"}
 *   data: [DONE]
 */
export async function chatStream(payload: ChatRequestPayload): Promise<Response> {
  const headers = await getHeaders();

  const response = await fetch(apiUrl('/chat'), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Backend chat error (${response.status}): ${errorBody}`);
  }

  return response;
}

// ============================================================================
// Projects API
// ============================================================================

export interface Project {
  id: string;
  title: string;
  slug: string;
  description?: string;
  review_type: string;
  framework: string;
  current_stage: string;
  progress_percentage: number;
  status: string;
  prospero_id?: string;
  total_records_found: number;
  total_screened: number;
  total_included: number;
  total_excluded: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  review_type: string;
  framework: string;
}

/**
 * Get all projects for the current user.
 */
export async function getProjects(): Promise<Project[]> {
  const headers = await getHeaders();
  const response = await fetch(apiUrl('/projects'), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new project.
 */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const headers = await getHeaders();
  const response = await fetch(apiUrl('/projects'), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a specific project by ID.
 */
export async function getProject(projectId: string): Promise<Project> {
  const headers = await getHeaders();
  const response = await fetch(apiUrl(`/projects/${projectId}`), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch project: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Project Stages API
// ============================================================================

export interface ProjectStage {
  id: string;
  project_id: string;
  stage_name: string;
  status: string; // pending | in_progress | completed | skipped | not_applicable
  skill_name?: string;
  started_at?: string;
  completed_at?: string;
  checklist?: unknown[];
  metrics?: Record<string, unknown>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all stages for a specific project.
 * Returns 10 stages with their current status.
 */
export async function getProjectStages(projectId: string): Promise<ProjectStage[]> {
  const headers = await getHeaders();
  const response = await fetch(apiUrl(`/projects/${projectId}/stages`), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch project stages: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Stage Messages API (Phase 2)
// ============================================================================

export interface StageMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string;
  created_at: string;
}

export interface StageMessagesResponse {
  conversation_id: string | null;
  messages: StageMessage[];
}

/**
 * Get conversation messages for a specific project stage.
 * Returns empty array if no conversation exists yet.
 */
export async function getStageMessages(
  projectId: string,
  stageName: string
): Promise<StageMessagesResponse> {
  const headers = await getHeaders();
  const response = await fetch(
    apiUrl(`/projects/${projectId}/stages/${stageName}/messages`),
    { method: 'GET', headers }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch stage messages: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// Stage Status API (Phase 2)
// ============================================================================

/**
 * Update a stage's status (in_progress, completed, etc.)
 * Auto-recalculates project progress and current_stage on the backend.
 */
export async function updateStageStatus(
  projectId: string,
  stageName: string,
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
): Promise<ProjectStage> {
  const headers = await getHeaders();
  const response = await fetch(
    apiUrl(`/projects/${projectId}/stages/${stageName}`),
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to update stage status: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// Artifacts API (Phase 2)
// ============================================================================

export interface Artifact {
  id: string;
  project_id: string;
  stage_id?: string;
  filename: string;
  display_name?: string;
  file_type: string;
  content?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Get all artifacts for a project, optionally filtered by stage.
 */
export async function getProjectArtifacts(
  projectId: string,
  stageName?: string
): Promise<Artifact[]> {
  const headers = await getHeaders();
  const url = stageName
    ? apiUrl(`/projects/${projectId}/artifacts?stage_name=${stageName}`)
    : apiUrl(`/projects/${projectId}/artifacts`);
  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch artifacts: ${response.status}`);
  }
  return response.json();
}

/**
 * Get a single artifact by ID (includes content for download).
 */
export async function getArtifact(
  projectId: string,
  artifactId: string
): Promise<Artifact> {
  const headers = await getHeaders();
  const response = await fetch(
    apiUrl(`/projects/${projectId}/artifacts/${artifactId}`),
    { method: 'GET', headers }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch artifact: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// Review Workflow API
// ============================================================================

export interface ReviewState {
  project_id: string;
  current_stage: string;
  stage_display_name: string;
  status: string;
  artifacts: Record<string, unknown>;
  message_count: number;
  errors: string[];
}

/**
 * Get the current workflow state for a project.
 */
export async function getReviewState(projectId: string): Promise<ReviewState> {
  const headers = await getHeaders();
  const response = await fetch(apiUrl(`/review/state/${projectId}`), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch review state: ${response.status}`);
  }

  return response.json();
}

/**
 * Reset the workflow for a project.
 */
export async function resetReview(projectId: string): Promise<void> {
  const headers = await getHeaders();
  const response = await fetch(apiUrl(`/review/reset/${projectId}`), {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to reset review: ${response.status}`);
  }
}

// ============================================================================
// Stages API
// ============================================================================

export interface StageInfo {
  id: string;
  order: number;
  display_name_en: string;
  display_name_he: string;
}

/**
 * Get all workflow stages information.
 */
export async function getStages(): Promise<{ stages: StageInfo[]; total_stages: number }> {
  const headers = await getHeaders(false); // Public endpoint
  const response = await fetch(apiUrl('/review/stages'), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stages: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Full-Text Availability API
// ============================================================================

export interface FullTextResult {
  pmid: string;
  doi: string;
  title: string;
  available: boolean;
  source: string;
  pdf_url: string;
  oa_status: string;
  format: string;
  note: string;
}

export interface FullTextCheckResponse {
  results: FullTextResult[];
  summary: {
    total: number;
    available: number;
    not_available: number;
    sources: Record<string, number>;
  };
}

/**
 * Check full-text availability for articles by PMID or DOI.
 */
export async function checkFullTextAvailability(
  pmids: string[] = [],
  doi?: string,
  sources: string = 'all'
): Promise<FullTextCheckResponse> {
  const headers = await getHeaders();
  const response = await fetch(apiUrl('/fulltext/check'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ pmids, doi, sources }),
  });
  if (!response.ok) {
    throw new Error(`Failed to check full-text availability: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// Articles API
// ============================================================================

export interface Article {
  id: string;
  project_id: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  abstract_text?: string;
  authors?: Array<{ name: string; affiliation?: string }>;
  journal?: string;
  publication_year?: number;
  screening_status: string;
  study_design?: string;
  fulltext_available: boolean;
  created_at: string;
}

/**
 * Get articles for a project, optionally filtered by screening status.
 */
export async function getProjectArticles(
  projectId: string,
  screeningStatus?: string
): Promise<Article[]> {
  const headers = await getHeaders();
  const url = screeningStatus
    ? apiUrl(`/projects/${projectId}/articles?screening_status=${screeningStatus}`)
    : apiUrl(`/projects/${projectId}/articles`);
  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// Screening API
// ============================================================================

export interface ScreeningDecision {
  id: string;
  article_id: string;
  decided_by: string;
  decision: string;
  phase: string;
  exclusion_reason?: string;
  confidence_score?: number;
  rationale?: string;
  is_final: boolean;
  created_at: string;
}

/**
 * Get screening decisions for a project.
 */
export async function getScreeningDecisions(
  projectId: string,
  finalOnly: boolean = false
): Promise<ScreeningDecision[]> {
  const headers = await getHeaders();
  const url = finalOnly
    ? apiUrl(`/projects/${projectId}/screening?final_only=true`)
    : apiUrl(`/projects/${projectId}/screening`);
  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch screening decisions: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// Extraction Data API
// ============================================================================

export interface ExtractedStudy {
  study_id?: string;
  title?: string;
  authors?: string;
  year?: number;
  _study_design?: string;
  _design_confidence?: number;
  _template_id?: string;
  [key: string]: unknown;
}

export interface ExtractionData {
  extracted_studies: ExtractedStudy[];
  extraction_template?: string;
  current_design?: string;
  user_confirmed_complete?: boolean;
}

/**
 * Get extraction data for a project from its artifacts.
 */
export async function getExtractionData(projectId: string): Promise<ExtractionData | null> {
  const artifacts = await getProjectArtifacts(projectId, 'extraction');
  const extractionArtifact = artifacts.find(a => a.filename === 'extraction-data.json');
  if (extractionArtifact?.content) {
    try {
      return JSON.parse(extractionArtifact.content);
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================================================
// Risk of Bias Data API
// ============================================================================

export interface RobDomainJudgment {
  judgment: string;
  justification?: string;
}

export interface RobAssessment {
  study_id: string;
  tool_id: string;
  domain_judgments: Record<string, RobDomainJudgment>;
  overall_judgment: string;
  overall_justification?: string;
}

export interface RobData {
  tool_id: string;
  tool_name?: string;
  assessments: RobAssessment[];
  summary_table?: string;
}

/**
 * Get Risk of Bias data for a project from its artifacts.
 */
export async function getRobData(projectId: string): Promise<RobData | null> {
  const artifacts = await getProjectArtifacts(projectId, 'rob');
  const robArtifact = artifacts.find(a => a.filename === 'rob-data.json');
  if (robArtifact?.content) {
    try {
      return JSON.parse(robArtifact.content);
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================================================
// Synthesis Data API
// ============================================================================

export interface SynthesisData {
  meta_analysis?: Record<string, unknown>;
  grade_assessment?: Record<string, unknown>;
  forest_plots?: string[];
  summary_of_findings?: string;
}

/**
 * Get synthesis (meta-analysis + GRADE) data for a project.
 */
export async function getSynthesisData(projectId: string): Promise<SynthesisData | null> {
  const artifacts = await getProjectArtifacts(projectId, 'synthesis');
  const synthArtifact = artifacts.find(a => a.filename === 'synthesis-data.json');
  if (synthArtifact?.content) {
    try {
      return JSON.parse(synthArtifact.content);
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================================================
// Reporting / Manuscript Data API
// ============================================================================

export interface ManuscriptSectionData {
  section_id: string;
  section_name: string;
  content: string;
  prisma_items?: string;
  word_count?: number;
}

export interface ReportingData {
  manuscript_text?: string;
  sections?: ManuscriptSectionData[];
  prisma_flowchart?: string;
  prisma_flow_data?: Record<string, unknown>;
  tables?: string[];
  figures?: string[];
}

/**
 * Get reporting/manuscript data for a project from its artifacts.
 */
export async function getReportingData(projectId: string): Promise<ReportingData | null> {
  const artifacts = await getProjectArtifacts(projectId, 'manuscript');
  const reportArtifact = artifacts.find(a => a.filename === 'reporting-data.json');
  if (reportArtifact?.content) {
    try {
      return JSON.parse(reportArtifact.content);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get manuscript text artifact for download.
 */
export async function getManuscriptArtifact(projectId: string): Promise<Artifact | null> {
  const artifacts = await getProjectArtifacts(projectId, 'manuscript');
  return artifacts.find(a => a.filename === 'manuscript.md') || null;
}

// ============================================================================
// Review State Artifacts API
// ============================================================================

/**
 * Get workflow artifacts for a specific stage directly from the review state.
 * This is useful when data hasn't been persisted as separate artifacts yet
 * but exists in the LangGraph state.
 */
export async function getStageArtifactFromState(
  projectId: string,
  stageName: string
): Promise<Record<string, unknown> | null> {
  try {
    const state = await getReviewState(projectId);
    return (state.artifacts?.[stageName] as Record<string, unknown>) || null;
  } catch {
    return null;
  }
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check if the backend is healthy and reachable.
 */
export async function healthCheck(): Promise<{
  status: string;
  service: string;
  backend_url: string;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { status: 'unhealthy', service: 'MedAI Hub Backend', backend_url: BACKEND_URL };
    }

    const data = await response.json();
    return { ...data, backend_url: BACKEND_URL };
  } catch {
    return { status: 'unreachable', service: 'MedAI Hub Backend', backend_url: BACKEND_URL };
  }
}
