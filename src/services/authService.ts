const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiUser {
  id: string;
  email: string;
}

interface AuthResponse {
  user: ApiUser;
  token: string;
}

async function request(path: string, body?: Record<string, string>): Promise<AuthResponse | { user: ApiUser }> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Authentication request failed.');
  return data;
}

export function login(email: string, password: string) {
  return request('/api/auth/login', { email, password }) as Promise<AuthResponse>;
}

export function signup(email: string, password: string) {
  return request('/api/auth/signup', { email, password }) as Promise<AuthResponse>;
}

export async function restoreSession(token: string) {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Session expired.');
  return response.json() as Promise<{ user: ApiUser }>;
}

export async function logout(token: string) {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export { API_BASE };
