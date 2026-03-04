import axios from 'axios';

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
  const { data } = await api.post<{ access_token: string; user: { id: string; role: string; email: string } }>(
    '/auth/login',
    { email, password },
  );
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

/** Work Orders (used by voice tool calls) */
export async function getUnitByTenant(tenantId: string) {
  const { data } = await api.get(`/units/by-tenant/${tenantId}`);
  return data;
}

export async function createWorkOrder(body: {
  unitId: string;
  issueCategory: string;
  issueDescription: string;
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

export async function getTechnicianSchedule() {
  const { data } = await api.get('/work-orders?status=ASSIGNED');
  return data;
}

export async function updateWorkOrderStatus(
  id: string,
  status: string,
  notes?: string,
) {
  const { data } = await api.patch(`/work-orders/${id}`, { status, ...(notes && { resolutionNotes: notes }) });
  return data;
}

export default api;
