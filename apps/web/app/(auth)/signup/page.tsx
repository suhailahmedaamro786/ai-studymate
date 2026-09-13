"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        const msg = json.error?.message || json.error || "Signup failed";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-sm text-muted-foreground">Sign up to start learning with AI</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Sign Up"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </form>
  );
}
