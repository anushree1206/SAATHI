import { customFetch } from "@workspace/api-client-react";

export async function apiGet<T>(path: string): Promise<T> {
  return customFetch<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return customFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

export async function apiDelete(path: string): Promise<void> {
  await customFetch<void>(path, { method: "DELETE" });
}
