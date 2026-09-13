"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminPage() {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<any>(`/admin/health`)
      .then(setHealth)
      .catch(() => setError("Failed to load admin data"));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {health ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(health).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-2xl font-bold">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : !error ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-lg animate-shimmer" />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
