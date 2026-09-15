import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    // Authenticate server-side using existing SSR setup
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token || null;

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

    // Forward the file to FastAPI with the server-side access token
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const backendRes = await fetch(`${API_URL}/api/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: backendFormData,
    });

    const responseBody = await backendRes.text();
    const contentType = backendRes.headers.get("content-type") || "";
    if (!backendRes.ok) {
      console.warn(`[/api/upload] Backend returned ${backendRes.status} for ${backendRes.url}`);
    }

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
