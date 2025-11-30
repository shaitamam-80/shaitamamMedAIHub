/**
 * MedAI Hub - Projects API
 * CRUD operations for research projects
 */

import { client } from "./client";
import { Project } from "./types";

export const projectsApi = {
  /**
   * Create a new project
   */
  createProject: async (data: {
    name: string;
    description?: string;
    framework_type?: string;
  }): Promise<Project> => {
    const response = await client.post("/api/v1/projects/", data);
    return response.data;
  },

  /**
   * Get all projects for current user
   */
  getProjects: async (): Promise<Project[]> => {
    const response = await client.get("/api/v1/projects/");
    return response.data;
  },

  /**
   * Get a single project by ID
   */
  getProject: async (id: string): Promise<Project> => {
    const response = await client.get(`/api/v1/projects/${id}`);
    return response.data;
  },

  /**
   * Update a project
   */
  updateProject: async (
    id: string,
    data: Record<string, unknown>
  ): Promise<Project> => {
    const response = await client.patch(`/api/v1/projects/${id}`, data);
    return response.data;
  },

  /**
   * Delete a project (CASCADE deletes all related data)
   */
  deleteProject: async (id: string): Promise<void> => {
    await client.delete(`/api/v1/projects/${id}`);
  },
};
