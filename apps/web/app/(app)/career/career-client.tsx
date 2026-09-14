"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Briefcase, AlertTriangle, CheckCircle2, Map, Sparkles, RotateCcw } from "lucide-react";

type Recommendation = {
  id: string;
  recommended_roles: string[];
  skill_gaps: string[];
  recommended_skills: string[];
  learning_paths: string[];
  created_at: string;
};

export function CareerClient({ initialRecommendations }: { initialRecommendations: Recommendation[] }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const rec = await api<Recommendation>("/career/analyze", { method: "POST" });
      setRecommendations((r) => [rec, ...r]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const latest = recommendations[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Career Assistant</h1>
        <p className="text-muted-foreground mt-1">Discover career paths aligned with your skills and interests</p>
      </div>

      {!latest ? (
        <Card className="py-12">
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto">
              <Briefcase className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-lg">Unlock Your Career Potential</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Complete your profile and let our AI analyze your skills, identify gaps, and recommend personalized career paths.
            </p>
            <Button onClick={analyze} disabled={analyzing} className="gap-2">
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze My Career Path
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Recommended Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {latest.recommended_roles.map((role) => (
                  <span key={role} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium">
                    {role}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Skill Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latest.skill_gaps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {latest.skill_gaps.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No significant skill gaps detected.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Recommended Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latest.recommended_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {latest.recommended_skills.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Build skills to see recommendations.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Map className="h-4 w-4" />
                Learning Paths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latest.learning_paths.length > 0 ? (
                <ul className="space-y-2">
                  {latest.learning_paths.map((path, i) => (
                    <li key={path} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {path}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No learning paths available yet.</p>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" onClick={analyze} disabled={analyzing} className="w-full gap-2">
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Refresh Analysis
              </>
            )}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
