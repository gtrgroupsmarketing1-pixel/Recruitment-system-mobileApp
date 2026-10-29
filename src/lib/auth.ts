import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

const TOKEN_KEY = "mobile_jwt";

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
): Promise<{ token: string; user: { id: string; email: string; name: string | null; role: string } }> {
  const res = await fetch(`${API_URL}/api/mobile-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenantSlug }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  await saveToken(data.token);
  return data;
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
