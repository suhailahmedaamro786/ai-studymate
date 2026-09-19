import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const isAuthRoute = (pathname: string) =>
  pathname.startsWith("/login") || pathname.startsWith("/signup");

const isProtectedRoute = (pathname: string) =>
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/documents") ||
  pathname.startsWith("/tutor") ||
  pathname.startsWith("/quiz") ||
  pathname.startsWith("/planner") ||
  pathname.startsWith("/career") ||
  pathname.startsWith("/analytics") ||
  pathname.startsWith("/admin");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Public routes do not need a Supabase server client.
  // This also prevents a missing/misconfigured deployment variable from
  // taking down the entire site with MIDDLEWARE_INVOCATION_FAILED.
  if (!isAuthRoute(pathname) && !isProtectedRoute(pathname)) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Auth routes can still render so the user can reach the client-side
  // login/signup flow. Protected routes fail closed when server auth is
  // unavailable instead of throwing a middleware 500.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedRoute(pathname)) {
      return NextResponse.redirect(new URL("/login?expired=true", request.url));
    }
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.getSession();

    // If Supabase is temporarily unavailable, do not break public/auth pages.
    // Protected routes fail closed.
    if (error) {
      if (isProtectedRoute(pathname)) {
        return NextResponse.redirect(new URL("/login?expired=true", request.url));
      }
      return response;
    }

    if (isAuthRoute(pathname)) {
      if (data.session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return response;
    }

    if (isProtectedRoute(pathname) && !data.session) {
      return NextResponse.redirect(new URL("/login?expired=true", request.url));
    }

    return response;
  } catch {
    if (isProtectedRoute(pathname)) {
      return NextResponse.redirect(new URL("/login?expired=true", request.url));
    }
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
