"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Quiz, QuizAttempt } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, AlertTriangle, Lightbulb } from "lucide-react";

type Step = "config" | "attempt" | "results";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-red-50 text-red-700 border-red-200",
};

function SimpleProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`h-2 bg-muted rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-primary rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function QuizPage() {
  const [step, setStep] = useState<Step>("config");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api<Quiz>("/quiz/generate", {
        method: "POST",
        body: JSON.stringify({ topic, difficulty, question_count: count }),
      });
      setQuiz(data);
      setStep("attempt");
      setAnswers({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const submitAttempt = async () => {
    if (!quiz) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<QuizAttempt>(`/quiz/${quiz.id}/attempt`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      setResult(data);
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("config");
    setQuiz(null);
    setAnswers({});
    setResult(null);
    setError("");
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = quiz ? Math.round((answeredCount / quiz.questions.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz</h1>
          <p className="text-muted-foreground mt-1">Test your knowledge with AI-generated quizzes</p>
        </div>
      </div>

      {step === "config" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate a Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={generateQuiz} className="space-y-5">
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  placeholder="e.g., Photosynthesis"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <Label htmlFor="count">Questions: {count}</Label>
                <input
                  id="count"
                  type="range"
                  min={3}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full mt-1.5"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Quiz"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "attempt" && quiz && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{quiz.topic}</h2>
              <p className="text-sm text-muted-foreground">{quiz.questions.length} questions &middot; {quiz.difficulty}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${DIFFICULTY_COLORS[quiz.difficulty] || DIFFICULTY_COLORS.medium}`}>
              {quiz.difficulty}
            </span>
          </div>

          <SimpleProgress value={progressPercent} />
          <p className="text-xs text-muted-foreground text-right">{answeredCount} of {quiz.questions.length} answered</p>

          {quiz.questions.map((q, i) => (
            <Card key={q.id} className={`transition-colors ${answers[q.id] ? "border-primary/30" : ""}`}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <p className="font-medium leading-relaxed pt-0.5">{q.question_text}</p>
                </div>
                <div className="space-y-2 pl-10">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.label;
                    return (
                      <label
                        key={opt.label}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                          transition-all duration-200
                          ${isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt.label}
                          checked={isSelected}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt.label }))}
                          className="accent-primary w-4 h-4"
                        />
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{opt.label}.</span>
                          <span className="text-sm">{opt.text}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            onClick={submitAttempt}
            disabled={loading || answeredCount !== quiz.questions.length}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Answers
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {step === "results" && result && (
        <div className="space-y-5">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-8 text-center space-y-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto">
                <Trophy className="h-8 w-8" />
              </div>
              <div className="text-5xl font-bold tracking-tight">{result.score}%</div>
              <p className="text-muted-foreground">
                {result.total_correct} out of {result.total_questions} questions correct
              </p>
              <SimpleProgress value={result.score} className="max-w-xs mx-auto" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Weak Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.evaluation.weak_topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.evaluation.weak_topics.map((t) => (
                      <span key={t} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{t}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None — great job!</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Strong Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.evaluation.strong_topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.evaluation.strong_topics.map((t) => (
                      <span key={t} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">{t}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Keep practicing!</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.evaluation.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Answer Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.details.map((d, i) => (
                <div
                  key={d.question_id}
                  className={`p-4 rounded-lg border ${d.is_correct ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {d.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Question {i + 1}</p>
                      {d.explanation && (
                        <p className="text-sm text-muted-foreground mt-1">{d.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={reset} variant="outline" className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            New Quiz
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
