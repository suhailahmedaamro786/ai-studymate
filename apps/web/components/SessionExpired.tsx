"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SessionExpired() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/login?expired=true";
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Session Expired</h2>
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
