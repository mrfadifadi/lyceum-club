export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "member" | string;
  is_active: boolean;
  created_at?: string;
  photo_url?: string | null;
  major?: string | null;
}

export interface LoginResult {
  access_token: string;
  token_type?: string;
  expires_in: number;
  user: AuthUser;
}

const TOKEN_KEY = "lyceum-access-token";
const EXPIRY_KEY = "lyceum-access-token-expiry";
const USER_KEY = "lyceum-user";

export function saveAuthSession(result: LoginResult) {
  sessionStorage.setItem(TOKEN_KEY, result.access_token);
  sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + result.expires_in * 1000));
  if (result.user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (!isAuthenticated()) return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (!isAuthenticated()) return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = Number(sessionStorage.getItem(EXPIRY_KEY));
  if (!token || !Number.isFinite(expiry) || expiry <= Date.now()) {
    clearAuthSession();
    return false;
  }
  return true;
}
