/**
 * MedAI Hub - Review Tool API
 * File upload and abstract screening
 */

import { client } from "./client";
import {
  AbstractResponse,
  BatchAnalysisResponse,
  FileUploadResponse,
} from "./types";

export const reviewApi = {
  /**
   * Upload a MEDLINE file for abstract screening
   */
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

  /**
   * Get abstracts for a project (optionally filter by status)
   */
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

  /**
   * Update decision for a single abstract
   */
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

  /**
   * Start AI batch analysis of abstracts
   */
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
};
