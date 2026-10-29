import { API_URL } from "./config";

const TOKEN_KEY = "mobile_jwt";

/** In-memory fallback — Expo Go SecureStore can fail on some devices. */
let memoryToken: string | null = null;

async function storeGet(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    const SecureStore = await import("expo-secure-store");
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function storeSet(token: string): Promise<void> {
  memoryToken = token;
  try {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // memoryToken is enough for this session
  }
}

async function storeClear(): Promise<void> {
  memoryToken = null;
  try {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

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
  return String(data);
}

export async function saveToken(token: string) {
  await storeSet(token);
}

export async function getToken(): Promise<string | null> {
  return storeGet();
}

export async function clearToken() {
  await storeClear();
}

export async function login(
  email: string,
  password: string,
  tenantSlug = "demo"
): Promise<{
  token: string;
  user: { id: string; email: string; name: string | null; role: string };
}> {
  const url = `${API_URL}/api/mobile-auth`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password, tenantSlug }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Cannot reach ${url} — ${msg}`);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Non-JSON (${res.status}): ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    throw new Error(errMessage(data, `HTTP ${res.status}`));
  }

  const body = data as { token?: string; user?: unknown };
  if (!body?.token) {
    throw new Error("Response missing token");
  }

  await storeSet(body.token);
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
