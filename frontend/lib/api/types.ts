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
