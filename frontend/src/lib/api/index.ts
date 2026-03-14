/**
 * API Service Layer (#12)
 * Centralized API client for backend integration.
 * All mock data calls can be swapped to real API endpoints here.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  // If no API_BASE configured, we're in mock mode — import mock data
  if (!API_BASE) {
    // Mock mode: return data from mock-data.ts
    // This will be replaced with real fetch calls when backend is ready
    throw new Error(`API not configured. Set NEXT_PUBLIC_API_URL to enable backend.`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}

// Employee endpoints
export const employeeApi = {
  getAll: () => request<any[]>('/api/employees'),
  getById: (id: string) => request<any>(`/api/employees/${id}`),
  create: (data: any) => request<any>('/api/employees', { method: 'POST', body: data }),
  update: (id: string, data: any) => request<any>(`/api/employees/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string) => request<void>(`/api/employees/${id}`, { method: 'DELETE' }),
  getSentiment: (id: string) => request<any>(`/api/employees/${id}/sentiment`),
};

// Meeting endpoints
export const meetingApi = {
  getAll: () => request<any[]>('/api/meetings'),
  getUpcoming: () => request<any[]>('/api/meetings/upcoming'),
  getById: (id: string) => request<any>(`/api/meetings/${id}`),
  create: (data: any) => request<any>('/api/meetings', { method: 'POST', body: data }),
};

// Commitment endpoints
export const commitmentApi = {
  getAll: () => request<any[]>('/api/commitments'),
  resolve: (id: string) => request<any>(`/api/commitments/${id}/resolve`, { method: 'POST' }),
  unresolve: (id: string) => request<any>(`/api/commitments/${id}/unresolve`, { method: 'POST' }),
};

// Transcript endpoints
export const transcriptApi = {
  getAll: () => request<any[]>('/api/transcripts'),
  getByEmployee: (id: string) => request<any[]>(`/api/transcripts/${id}`),
  upload: (data: any) => request<any>('/api/transcripts/upload', { method: 'POST', body: data }),
};

// Notes endpoints
export const noteApi = {
  getAll: () => request<any[]>('/api/notes'),
  create: (data: any) => request<any>('/api/notes', { method: 'POST', body: data }),
  getByEmployee: (empId: string) => request<any[]>(`/api/notes/${empId}`),
  delete: (id: string) => request<void>(`/api/notes/${id}`, { method: 'DELETE' }),
};

// Recent Changes endpoints
export const recentChangesApi = {
  getAll: (limit: number = 20) => request<any[]>(`/api/recent-changes?limit=${limit}`),
};

// Department endpoints
export const departmentApi = {
  getAll: () => request<any[]>('/api/departments'),
  getById: (id: string) => request<any>(`/api/departments/${id}`),
};

// Notification endpoints
export const notificationApi = {
  getAll: () => request<any[]>('/api/notifications'),
  markRead: (id: string) => request<void>(`/api/notifications/${id}/read`, { method: 'POST' }),
  getMailSummary: () => request<any[]>('/api/notifications/mail-summary'),
};

// Analytics endpoints
export const analyticsApi = {
  getSentimentTrends: () => request<any>('/api/analytics/sentiment'),
  getEngagement: () => request<any>('/api/analytics/engagement'),
  getRiskHeatmap: () => request<any>('/api/analytics/risk-heatmap'),
  getAttrition: () => request<any>('/api/analytics/attrition'),
};

// Auth endpoints
export const authApi = {
  login: (data: { email: string; password: string }) => request<any>('/api/auth/login', { method: 'POST', body: data }),
  verifyOtp: (data: { userId: string; code: string }) => request<any>('/api/auth/verify-otp', { method: 'POST', body: data }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  getProfile: () => request<any>('/api/auth/profile'),
  updateProfile: (data: { name: string }) => request<any>('/api/auth/profile', { method: 'PATCH', body: data }),
};

// HR Team endpoints
export const hrTeamApi = {
  getAll: () => request<any[]>('/api/hr-team'),
  add: (data: any) => request<any>('/api/hr-team', { method: 'POST', body: data }),
};

// AI endpoints
export const aiApi = {
  chat: (data: { message: string; context?: any }) => request<any>('/api/ai/chat', { method: 'POST', body: data }),
  getEmployeeInsight: (employee: any) => request<any>('/api/ai/employee', { method: 'POST', body: { employee } }),
  getMeetingBrief: (employeeId: string) => request<any>('/api/ai/meeting-brief', { method: 'POST', body: { employeeId } }),
  getMeetingPrep: (employeeId: string) => request<any>(`/api/ai/meeting-prep/${employeeId}`),
};
