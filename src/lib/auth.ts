import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

const TOKEN_KEY = "mobile_jwt";

function errMessage(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    const o = data as Record<string, unknown>;
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function login(
  email: string,
  password: string,
  tenantSlug = "demo"
): Promise<{
  token: string;
  user: { id: string; email: string; name: string | null; role: string };
}> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/mobile-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password, tenantSlug }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    throw new Error(
      `Cannot reach API (${API_URL}). Check EXPO_PUBLIC_API_URL. ${msg}`
    );
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Server returned non-JSON (${res.status}): ${text.slice(0, 120) || res.statusText}`
    );
  }

  if (!res.ok) {
    throw new Error(errMessage(data, `Login failed (${res.status})`));
  }

  const body = data as { token?: string };
  if (!body?.token) {
    throw new Error("Login response missing token");
  }

  await saveToken(body.token);
  return data as {
    token: string;
    user: { id: string; email: string; name: string | null; role: string };
  };
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
}
