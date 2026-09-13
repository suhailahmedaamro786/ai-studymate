import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getSession();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  if (isAuthRoute) {
    if (data.session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/documents") ||
    request.nextUrl.pathname.startsWith("/tutor") ||
    request.nextUrl.pathname.startsWith("/quiz") ||
    request.nextUrl.pathname.startsWith("/planner") ||
    request.nextUrl.pathname.startsWith("/career") ||
    request.nextUrl.pathname.startsWith("/analytics") ||
    request.nextUrl.pathname.startsWith("/admin");

  if (isProtectedRoute && !data.session) {
    return NextResponse.redirect(new URL("/login?expired=true", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
