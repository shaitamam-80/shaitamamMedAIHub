const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  async createProject(data: { name: string; description?: string; framework_type?: string }) {
    return this.request('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProjects() {
    return this.request('/api/v1/projects');
  }

  async getProject(id: string) {
    return this.request(`/api/v1/projects/${id}`);
  }

  async updateProject(id: string, data: Record<string, unknown>) {
    return this.request(`/api/v1/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/api/v1/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Define - Frameworks
  async getFrameworks() {
    return this.request('/api/v1/define/frameworks');
  }

  // Define - Chat
  async chatForDefine(data: {
    project_id: string;
    message: string;
    framework_type: string;
  }) {
    return this.request('/api/v1/define/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversation(projectId: string) {
    return this.request(`/api/v1/define/conversation/${projectId}`);
  }

  // Query
  async generateQuery(data: { project_id: string; framework_data?: Record<string, string> }) {
    return this.request('/api/v1/query/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQueryHistory(projectId: string) {
    return this.request(`/api/v1/query/history/${projectId}`);
  }

  // Review
  async uploadFile(projectId: string, file: File) {
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

  async getAbstracts(projectId: string, status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/v1/review/abstracts/${projectId}${params}`);
  }

  async updateAbstract(abstractId: string, data: { decision: string; notes?: string }) {
    return this.request(`/api/v1/review/abstracts/${abstractId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async startBatchAnalysis(data: { project_id: string; batch_size?: number }) {
    return this.request('/api/v1/review/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
