/**
 * MedAI Hub - API Client (Main Export)
 * Re-exports all API modules for convenient importing
 */

// Export all types
export * from "./types";

// Export individual API modules
export * from "./projects";
export * from "./define";
export * from "./query";
export * from "./review";

// Export the base client
export { client } from "./client";

// Export a combined apiClient object for backward compatibility
import { projectsApi } from "./projects";
import { defineApi } from "./define";
import { queryApi } from "./query";
import { reviewApi } from "./review";
import { client } from "./client";

export const apiClient = {
  // Projects
  ...projectsApi,

  // Define Tool
  ...defineApi,

  // Query Tool
  ...queryApi,

  // Review Tool
  ...reviewApi,

  // Health Check
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await client.get("/health");
    return response.data;
  },
};

export default apiClient;
