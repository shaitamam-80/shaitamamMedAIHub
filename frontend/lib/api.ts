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

export interface ChatResponse {
  message: string;
  framework_data?: Record<string, string>;
  extracted_fields?: Record<string, string>;
  finer_assessment?: FinerAssessment;
  formulated_questions?: FormulatedQuestion[];
}

export interface FinerScore {
  score: "high" | "medium" | "low";
  reason: string;
}

export interface FinerAssessment {
  F: FinerScore;
  I: FinerScore;
  N: FinerScore;
  E: FinerScore;
  R: FinerScore;
  overall?: "proceed" | "revise" | "reconsider";
  overall_score?: number;
  recommendation?: "proceed" | "revise" | "reconsider";
  suggestions?: string[];
}

export interface FinerAssessmentResponse extends FinerAssessment {
  research_question: string;
  framework_type: string;
}

export interface FormulatedQuestion {
  type: "broad" | "focused" | "alternative";
  hebrew?: string;
  english: string;
  finer_assessment?: FinerAssessment;
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
  // Health Check
  // ========================================================================

  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await client.get("/health");
    return response.data;
  },
};

export default apiClient;
