/**
 * MedAI Hub - Define Tool API
 * Framework selection, AI chat, and FINER assessment
 */

import { client } from "./client";
import {
  ChatMessage,
  ChatResponse,
  FinerAssessmentResponse,
  FrameworkSchema,
} from "./types";

export const defineApi = {
  /**
   * Get all available framework schemas
   */
  getFrameworks: async (): Promise<{
    frameworks: Record<string, FrameworkSchema>;
  }> => {
    const response = await client.get("/api/v1/define/frameworks");
    return response.data;
  },

  /**
   * Send a message to the AI chat
   */
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

  /**
   * Get conversation history for a project
   */
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

  /**
   * Clear conversation history for a project
   */
  clearConversation: async (projectId: string): Promise<void> => {
    await client.delete(`/api/v1/define/conversation/${projectId}`);
  },

  /**
   * Assess research question using FINER criteria
   */
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
};
