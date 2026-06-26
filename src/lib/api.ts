// REST client for the standalone NestJS backend.
// Base URL is configurable; defaults to the local backend on :3001.
const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const apiBaseUrl = API_BASE;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      // NestJS validation errors come back as an array of strings.
      message = Array.isArray(body.message)
        ? body.message.join(", ")
        : body.message || message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
};

export interface AuthUser {
  id: number;
  unionId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: "user" | "brand" | "influencer" | "admin";
  onboardingComplete: boolean | null;
}

export const authApi = {
  // Returns the user, or null when not authenticated (401).
  me: async (): Promise<AuthUser | null> => {
    try {
      return await api.get<AuthUser>("/auth/me");
    } catch {
      return null;
    }
  },
  login: (email: string, password: string) =>
    api.post<{ success: boolean }>("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ success: boolean }>("/auth/register", { name, email, password }),
  logout: () => api.post<{ success: boolean }>("/auth/logout"),
  updateRole: (role: string) =>
    api.patch<{ success: boolean; role: string }>("/auth/role", { role }),
  completeOnboarding: () =>
    api.post<{ success: boolean }>("/auth/complete-onboarding"),
};

// Build the Kimi OAuth URL whose redirect_uri points at the backend callback.
export function getOAuthUrl(): string {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${API_BASE}/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}
