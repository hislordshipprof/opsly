import axios from 'axios';
import type { User } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: API_URL });

/** Attach JWT to every request if available */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('opsly_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Auth */
export async function login(email: string, password: string) {
  const { data } = await api.post<{ access_token: string; user: User }>(
    '/auth/login',
    { email, password },
  );
  return data;
}

export async function register(body: { name: string; email: string; password: string; role: string }) {
  const { data } = await api.post('/auth/register', body);
  return data;
}

/** Voice */
export interface VoiceTokenResponse {
  sessionId: string;
  ephemeralToken: string;
  model: string;
  systemInstruction: string;
  tools: unknown[];
  voiceConfig: { voiceName: string };
}

export async function getVoiceToken(): Promise<VoiceTokenResponse> {
  const { data } = await api.post<VoiceTokenResponse>('/ai/voice/token');
  return data;
}

export async function endVoiceSession(
  sessionId: string,
  transcript?: Array<{ role: string; content: string }>,
) {
  await api.post(`/ai/voice/${sessionId}/end`, { transcript });
}

/** Chat (text fallback for AI agents) */
export interface ChatResponse {
  text: string;
  sessionId: string;
  agentName?: string;
}

export async function chat(message: string, sessionId?: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/ai/chat', {
    message,
    ...(sessionId && { sessionId }),
  });
  return data;
}

/** Work Orders (used by voice tool calls) */
export async function getUnitByTenant(tenantId: string) {
  const { data } = await api.get(`/units/by-tenant/${tenantId}`);
  return data;
}

export async function createWorkOrder(body: {
  unitId: string;
  issueCategory: string;
  issueDescription: string;
  priority?: string;
}) {
  const { data } = await api.post('/work-orders', body);
  return data;
}

export async function getWorkOrderByNumber(orderNumber: string) {
  const { data } = await api.get(`/work-orders/by-number/${orderNumber}`);
  return data;
}

export async function getOpenWorkOrders() {
  const { data } = await api.get('/work-orders');
  return data;
}

export async function updateWorkOrderStatus(
  id: string,
  status: string,
  notes?: string,
) {
  const { data } = await api.patch(`/work-orders/${id}/status`, { status, ...(notes && { notes }) });
  return data;
}

// ─── Dashboard APIs ────────────────────────────────────

export async function getWorkOrders(params?: Record<string, string | number | undefined>) {
  const filtered = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v != null),
  );
  const { data } = await api.get('/work-orders', { params: filtered });
  return data;
}

export async function getWorkOrder(id: string) {
  const { data } = await api.get(`/work-orders/${id}`);
  return data;
}

export async function getWorkOrderEvents(id: string) {
  const { data } = await api.get(`/work-orders/${id}/events`);
  return data;
}

export async function getDashboardMetrics() {
  const { data } = await api.get('/work-orders/metrics');
  return data;
}

export async function getTechnicianSummaries() {
  const { data } = await api.get('/work-orders/technicians');
  return data;
}

export async function assignTechnician(workOrderId: string, technicianId: string) {
  const { data } = await api.patch(`/work-orders/${workOrderId}/assign`, { technicianId });
  return data;
}

export async function getUsers(role?: string) {
  const { data } = await api.get('/users', { params: role ? { role } : {} });
  return data;
}

export async function getProperties() {
  const { data } = await api.get('/properties');
  return data;
}

// ─── Technician Schedule APIs ─────────────────────────

export async function getTechnicianSchedule(date?: string) {
  const { data } = await api.get('/schedules', { params: date ? { date } : {} });
  return data;
}

export async function updateStopStatus(stopId: string, status: string, notes?: string) {
  const { data } = await api.patch(`/schedules/stops/${stopId}/status`, {
    status,
    ...(notes && { notes }),
  });
  return data;
}

// ─── Escalation APIs ─────────────────────────────────

export async function getActiveEscalations() {
  const { data } = await api.get('/escalations');
  return data;
}

export async function acknowledgeEscalation(escalationId: string, notes?: string) {
  const { data } = await api.patch(`/escalations/${escalationId}/acknowledge`, {
    ...(notes && { notes }),
  });
  return data;
}

// ─── Photo Assessment APIs ────────────────────────────

export interface PhotoAssessmentResult {
  aiSeverityScore: number;
  visionAssessment: {
    damageType: string;
    severity: string;
    confidence: number;
    description: string;
    recommendations: string[];
    recommendedPriority: string;
  };
  photoUrl: string;
}

export async function uploadPhoto(
  workOrderId: string,
  file: File,
): Promise<PhotoAssessmentResult> {
  // Convert File to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data (remove "data:image/jpeg;base64," prefix)
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const { data } = await api.post<PhotoAssessmentResult>(`/work-orders/${workOrderId}/photos`, {
    imageBase64: base64,
    mimeType: file.type,
  });

  return data;
}

/** Standalone photo assessment — no work order needed */
export async function assessPhotoStandalone(
  file: File,
): Promise<{ assessment: PhotoAssessmentResult['visionAssessment'] }> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const { data } = await api.post('/ai/assess-photo', {
    imageBase64: base64,
    mimeType: file.type,
  });

  return data;
}

/** AI Insights — maintenance tips for an issue */
export async function getMaintenanceTips(issueCategory: string, issueDescription: string) {
  const { data } = await api.post<{ tips: string }>('/ai/maintenance-tips', { issueCategory, issueDescription });
  return data.tips;
}

/** AI Insights — tenant unit health summary */
export async function getTenantInsights() {
  const { data } = await api.get<{ summary: string }>('/ai/tenant-insights');
  return data.summary;
}

/** AI Insights — recap of last AI session */
export async function getSessionRecap() {
  const { data } = await api.get<{ recap: string | null; sessionAge: string | null }>('/ai/session-recap');
  return data;
}

export default api;
