/**
 * MedAI Hub - API Client (Main Export)
 * Re-exports all API modules for convenient importing
 */

// Export all types
export * from "./types";

// Export individual API modules
export * from "./projects";
export * from "./define";
export * from "./define-v3";

// Export the base client
export { client } from "./client";

// Export a combined apiClient object for backward compatibility
import { projectsApi } from "./projects";
import { defineApi } from "./define";
import defineV3Api from "./define-v3";
import { client } from "./client";

export const apiClient = {
  // Projects
  ...projectsApi,

  // Define Tool (v2.0 - chat-based)
  ...defineApi,

  // Define Tool v3.0 (wizard-based)
  defineV3: defineV3Api,

  // Health Check
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await client.get("/health");
    return response.data;
  },
};

export default apiClient;
