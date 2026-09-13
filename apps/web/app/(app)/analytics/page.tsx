"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, BarChart3, Target, TrendingUp, Calendar, Award, AlertCircle } from "lucide-react";

type Attempt = {
  id: string;
  quiz_id: string;
  score: number;
  total_correct: number;
  total_questions: number;
  created_at: string;
};

function ScoreBadge({ score }: { score: number }) {
  const isGood = score >= 70;
  const isMid = score >= 40 && score < 70;
  return (
    <span className={`
      px-3 py-1 rounded-full text-sm font-semibold
      ${isGood ? "bg-green-50 text-green-700 border border-green-200" :
        isMid ? "bg-amber-50 text-amber-700 border border-amber-200" :
          "bg-red-50 text-red-700 border border-red-200"}
    `}>
      {score}%
    </span>
  );
}

export default function AnalyticsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const quizIds = await api<string[]>(`/quiz`).catch(() => []);
        const allAttempts: Attempt[] = [];
        for (const quizId of quizIds) {
          const data = await api<{ data: Attempt[] }>(`/quiz/${quizId}/attempts`).catch(() => ({ data: [] }));
          allAttempts.push(...(data.data || []));
        }
        allAttempts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAttempts(allAttempts);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const totalQuizzes = attempts.length;
  const bestScore = attempts.length ? Math.max(...attempts.map(a => a.score)) : 0;
  const recentTrend = attempts.length >= 2
    ? attempts[0].score - attempts[1].score
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your learning progress and performance over time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Quizzes Taken</p>
                <p className="text-3xl font-bold tracking-tight">{totalQuizzes}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Average Score</p>
                <p className="text-3xl font-bold tracking-tight">{avgScore}%</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <SimpleProgress value={avgScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Best Score</p>
                <p className="text-3xl font-bold tracking-tight">{bestScore}%</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-lg animate-shimmer" />
              ))}
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground mx-auto mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">No quiz attempts yet. Take a quiz to see your progress.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/30 rounded-lg px-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Quiz {a.quiz_id?.slice?.(0, 8) || a.quiz_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <ScoreBadge score={a.score} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.total_correct}/{a.total_questions} correct
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SimpleProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`h-2 bg-muted rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
