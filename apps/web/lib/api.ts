"use client";

import { createClient } from "@/lib/supabase/client";

type ApiError = { code: string; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function refreshSession(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.refreshSession();
  return data.session?.access_token || null;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const normalizedPath = path.startsWith("/api") ? path : `/api${path}`;
  const res = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    const refreshedToken = await refreshSession();
    if (refreshedToken) {
      const retryHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
        "Authorization": `Bearer ${refreshedToken}`,
      };
      const retryRes = await fetch(`${API_URL}${normalizedPath}`, {
        ...options,
        headers: retryHeaders,
      });
      if (retryRes.ok) {
        const json = await retryRes.json();
        if (json.error) {
          const error: ApiError = json.error;
          throw new Error(error.message);
        }
        return json.data as T;
      }
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login?expired=true";
    }
    throw new Error("Session expired");
  }

  const json = await res.json();
  if (!res.ok || json.error) {
    const error: ApiError = json.error || { code: "UNKNOWN", message: "An error occurred" };
    throw new Error(error.message);
  }
  return json.data as T;
}

export async function apiMultipart<T>(
  path: string,
  formData: FormData
): Promise<T> {
  let token = await getToken();

  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const normalizedPath = path.startsWith("/api") ? path : `/api${path}`;
  const res = await fetch(`${API_URL}${normalizedPath}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    const refreshedToken = await refreshSession();
    if (refreshedToken) {
      const retryHeaders: HeadersInit = {
        "Authorization": `Bearer ${refreshedToken}`,
      };
      const retryRes = await fetch(`${API_URL}${normalizedPath}`, {
        method: "POST",
        headers: retryHeaders,
        body: formData,
      });
      if (retryRes.ok) {
        const json = await retryRes.json();
        if (json.error) {
          const error: ApiError = json.error;
          throw new Error(error.message);
        }
        return json.data as T;
      }
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login?expired=true";
    }
    throw new Error("Session expired");
  }

  const json = await res.json();
  if (!res.ok || json.error) {
    const error: ApiError = json.error || { code: "UNKNOWN", message: "An error occurred" };
    throw new Error(error.message);
  }
  return json.data as T;
}
