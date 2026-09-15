import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function _uploadWithToken(accessToken: string, file: File) {
  const backendFormData = new FormData();
  backendFormData.append("file", file);

  return fetch(`${API_URL}/api/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: backendFormData,
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    let accessToken = data.session?.access_token || null;

    if (!accessToken) {
      console.warn("[/api/upload] No auth session or access_token found in SSR cookies");
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No authenticated session" } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: "NO_FILE", message: "No file provided" } },
        { status: 400 }
      );
    }

    let backendRes = await _uploadWithToken(accessToken, file);

    // If the stored access token is expired, refresh it and retry once.
    // This matches the existing refresh-and-retry pattern in lib/api.ts.
    if (backendRes.status === 401) {
      console.warn("[/api/upload] Got 401 from backend, attempting token refresh");
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshed.session?.access_token) {
        backendRes = await _uploadWithToken(refreshed.session.access_token, file);
      }
    }

    const responseBody = await backendRes.text();
    const contentType = backendRes.headers.get("content-type") || "";

    return new NextResponse(responseBody, {
      status: backendRes.status,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json(
      { error: { code: "PROXY_ERROR", message: "Upload failed" } },
      { status: 500 }
    );
  }
}
