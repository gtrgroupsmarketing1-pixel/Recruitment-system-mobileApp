import { authFetch } from "./auth";

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(path, init);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text.slice(0, 120) || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    const err =
      data && typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: string }).error)
        : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}

export function fetchDashboard() {
  return json<{
    user: { name?: string; role: string; email?: string };
    kpis: Record<string, number>;
    todayTasks: Array<{ id: string; title: string; isOverdue: boolean }>;
    urgentRequisitions: Array<{
      id: string;
      reqCode: string;
      clientName: string;
      daysLeft: number | null;
    }>;
  }>("/api/mobile/dashboard");
}

export function fetchTasks(filter = "open") {
  return json<{
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      isOverdue: boolean;
      priority: string;
      context: { href: string; label: string } | null;
    }>;
  }>(`/api/mobile/tasks?filter=${filter}`);
}

export function completeTask(id: string) {
  return json<{ success: boolean }>(`/api/mobile/tasks/${id}/complete`, {
    method: "POST",
  });
}

export function fetchRequisitions() {
  return json<{
    requisitions: Array<{
      id: string;
      reqCode: string;
      roleCategory: string;
      clientName: string;
      vacancyTarget: number;
      mobilized: number;
      status: string;
    }>;
  }>("/api/mobile/requisitions");
}

export function fetchCandidates(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return json<{
    candidates: Array<{
      id: string;
      fullName: string;
      phone: string | null;
      nationality: string | null;
      portalStatus: string | null;
    }>;
  }>(`/api/mobile/candidates${qs}`);
}


export function fetchCrmLeads() {
  return json<{
    leads: Array<{
      id: string;
      phoneNumber: string;
      profileName: string | null;
      lastMessage: string | null;
      adId: string | null;
      status: string;
      candidateId: string | null;
      createdAt: string;
    }>;
  }>("/api/mobile/crm/leads");
}

export function convertCrmLead(
  id: string,
  body: { name: string; phone: string; trade?: string; nationality?: string }
) {
  return json<{ success: boolean; candidateId: string }>(
    `/api/mobile/crm/leads/${id}/convert`,
    { method: "POST", body: JSON.stringify(body) }
  );
}
