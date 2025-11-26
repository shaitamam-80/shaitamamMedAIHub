const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
}

export interface ChatMessage {
  id: string;
  project_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
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
  status: 'pending' | 'included' | 'excluded' | 'maybe';
  ai_decision?: string;
  ai_reasoning?: string;
  user_decision?: string;
  user_notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface FileUploadResponse {
  id: string;
  project_id: string;
  filename: string;
  file_type: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  total_abstracts?: number;
  processed_abstracts?: number;
  error_message?: string;
  created_at: string;
}

export interface QueryGenerateResponse {
  query: string;
  explanation?: string;
  framework_data?: Record<string, string>;
}

export interface ChatResponse {
  message: string;
  framework_data?: Record<string, string>;
  conversation_id?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Projects
  async createProject(data: { name: string; description?: string; framework_type?: string }): Promise<Project> {
    return this.request('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProjects(): Promise<Project[]> {
    return this.request('/api/v1/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/api/v1/projects/${id}`);
  }

  async updateProject(id: string, data: Record<string, unknown>): Promise<Project> {
    return this.request(`/api/v1/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request(`/api/v1/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Define - Frameworks
  async getFrameworks(): Promise<{ frameworks: Record<string, FrameworkSchema> }> {
    return this.request('/api/v1/define/frameworks');
  }

  // Define - Chat
  async chatForDefine(data: {
    project_id: string;
    message: string;
    framework_type: string;
  }): Promise<ChatResponse> {
    return this.request('/api/v1/define/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversation(projectId: string): Promise<{ messages: ChatMessage[]; framework_data?: Record<string, string> }> {
    return this.request(`/api/v1/define/conversation/${projectId}`);
  }

  // Query
  async generateQuery(data: { project_id: string; framework_data?: Record<string, string> }): Promise<QueryGenerateResponse> {
    return this.request('/api/v1/query/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQueryHistory(projectId: string): Promise<QueryGenerateResponse[]> {
    return this.request(`/api/v1/query/history/${projectId}`);
  }

  // Review
  async uploadFile(projectId: string, file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);

    const url = `${this.baseUrl}/api/v1/review/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  async getAbstracts(projectId: string, status?: string): Promise<AbstractResponse[]> {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/v1/review/abstracts/${projectId}${params}`);
  }

  async updateAbstract(abstractId: string, data: { decision: string; notes?: string }): Promise<AbstractResponse> {
    return this.request(`/api/v1/review/abstracts/${abstractId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async startBatchAnalysis(data: { project_id: string; batch_size?: number }): Promise<{ status: string; message: string }> {
    return this.request('/api/v1/review/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
