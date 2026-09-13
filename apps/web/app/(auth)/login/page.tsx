"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthError, setOauthError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        const msg = json.error?.message || json.error || "Login failed";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        setLoading(false);
        return;
      }

      if (json.data?.access_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: json.data.access_token,
          refresh_token: json.data.refresh_token || "",
        });
        if (sessionError) {
          setError(sessionError.message);
          setLoading(false);
          return;
        }
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setOauthError(error.message);
      }
    } catch {
      setOauthError("Failed to initiate Google sign-in. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">Log in to continue learning</p>
      </div>

      {(error || oauthError) && (
        <p className="text-sm text-red-500">{error || oauthError}</p>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in..." : "Log In"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGoogleSignIn}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
      </p>
    </form>
  );
}
