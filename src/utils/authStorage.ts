import type { User } from '../contexts/AuthContext';

const USERS_KEY = 'vent_registered_users';
const REMEMBER_KEY = 'vent_remember_me';
const REMEMBERED_EMAIL_KEY = 'vent_remembered_email';
const TOKEN_KEY = 'vent_auth_token';

export interface StoredUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readUsers(): StoredUserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string): StoredUserRecord | undefined {
  const normalized = email.trim().toLowerCase();
  return readUsers().find((u) => u.email === normalized);
}

export async function registerUser(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase();
  if (findUserByEmail(normalized)) {
    throw new Error('An account with this email already exists. Try logging in.');
  }
  const record: StoredUserRecord = {
    id: crypto.randomUUID(),
    email: normalized,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  writeUsers([...readUsers(), record]);
  return { id: record.id, email: record.email };
}

export async function verifyUser(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase();
  const record = findUserByEmail(normalized);
  if (!record) {
    throw new Error('No account found for this email. Please sign up first.');
  }
  const passwordHash = await hashPassword(password);
  if (passwordHash !== record.passwordHash) {
    throw new Error('Incorrect password. Please try again.');
  }
  return { id: record.id, email: record.email };
}

export function persistSession(user: User, rememberMe: boolean) {
  const payload = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem('user', payload);
    localStorage.setItem(REMEMBER_KEY, 'true');
    localStorage.setItem(REMEMBERED_EMAIL_KEY, user.email);
    sessionStorage.removeItem('user');
  } else {
    sessionStorage.setItem('user', payload);
    localStorage.removeItem('user');
    localStorage.setItem(REMEMBER_KEY, 'false');
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }
}

export function persistToken(token: string, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function loadRememberedEmail(): string {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
}

export function loadPersistedUser(): User | null {
  const raw =
    localStorage.getItem('user') ??
    sessionStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
