import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function serverApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const normalizedPath = path.startsWith("/api") ? path : `/api${path}`;
  const res = await fetch(`${apiUrl}${normalizedPath}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    const message = json.error?.message || json.error || `HTTP ${res.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  const json = await res.json();
  if (json.error) {
    const message = json.error.message || json.error || "API error";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return json.data as T;
}
