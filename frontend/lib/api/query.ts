/**
 * MedAI Hub - Query Tool API
 * PubMed query generation and search execution
 */

import { client } from "./client";
import {
  PubMedAbstractResponse,
  PubMedSearchResponse,
  QueryGenerateResponse,
  QueryHistoryItem,
  QueryValidationResponse,
  ResearchQuestionsResponse,
} from "./types";

export const queryApi = {
  /**
   * Generate PubMed query from project framework data
   */
  generateQuery: async (projectId: string): Promise<QueryGenerateResponse> => {
    const response = await client.post("/api/v1/query/generate", {
      project_id: projectId,
      framework_data: {}, // Will be fetched from project backend-side if empty
    });
    return response.data;
  },

  /**
   * Generate PubMed query from a research question
   */
  generateQueryFromQuestion: async (
    projectId: string,
    researchQuestion: string,
    frameworkType?: string
  ): Promise<QueryGenerateResponse> => {
    const response = await client.post(
      "/api/v1/query/generate-from-question",
      {
        project_id: projectId,
        research_question: researchQuestion,
        framework_type: frameworkType,
      }
    );
    return response.data;
  },

  /**
   * Get query generation history for a project
   */
  getQueryHistory: async (
    projectId: string
  ): Promise<{ queries: QueryHistoryItem[] }> => {
    const response = await client.get(`/api/v1/query/history/${projectId}`);
    return response.data;
  },

  /**
   * Get research questions for a project
   */
  getResearchQuestions: async (
    projectId: string
  ): Promise<ResearchQuestionsResponse> => {
    const response = await client.get(
      `/api/v1/query/research-questions/${projectId}`
    );
    return response.data;
  },

  /**
   * Execute a PubMed search query
   */
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

  /**
   * Validate a PubMed query
   */
  validateQuery: async (query: string): Promise<QueryValidationResponse> => {
    const response = await client.post("/api/v1/query/validate", {
      query,
    });
    return response.data;
  },

  /**
   * Get full abstract for a PubMed article
   */
  getPubMedAbstract: async (pmid: string): Promise<PubMedAbstractResponse> => {
    const response = await client.get(`/api/v1/query/abstract/${pmid}`);
    return response.data;
  },
};
