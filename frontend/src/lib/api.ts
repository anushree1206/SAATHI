import { useMutation } from "@tanstack/react-query";

// Module-level auth token getter — set once in main.tsx
let _authTokenGetter: (() => string | null) | null = null;

export function setAuthTokenGetter(getter: () => string | null): void {
  _authTokenGetter = getter;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = _authTokenGetter?.() ?? null;
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> ?? {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(path, { ...options, headers });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const err: any = new Error(data?.error ?? `HTTP ${response.status}`);
    err.data = data;
    err.status = response.status;
    throw err;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

// --- Saathi chat types ---

export type SaathiPipelineStep = { agent: string; insight: string };

export type SaathiChatResponse = {
  response: string;
  conversationId?: string;
  pipeline?: SaathiPipelineStep[];
};

export type SaathiChatRequest = {
  message: string;
  language?: string;
  conversationId?: string;
};

// Drop-in replacement for the workspace useSaathiChat hook
export function useSaathiChat() {
  return useMutation({
    mutationFn: ({ data }: { data: SaathiChatRequest }) =>
      apiPost<SaathiChatResponse>("/api/saathi/chat", data),
  });
}
