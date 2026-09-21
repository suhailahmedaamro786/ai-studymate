"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { StudyPlanWithTasks, StudyTaskResponse } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Calendar, Clock, Target, CheckCircle2, RotateCcw, ChevronRight } from "lucide-react";

type Step = "create" | "plan";

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

export default function PlannerPage() {
  const [step, setStep] = useState<Step>("create");
  const [goal, setGoal] = useState("");
  const [hours, setHours] = useState(2);
  const [deadline, setDeadline] = useState("");
  const [plan, setPlan] = useState<StudyPlanWithTasks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<StudyTaskResponse[]>([]);

  const generatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api<StudyPlanWithTasks>("/planner/plans", {
        method: "POST",
        body: JSON.stringify({
          goal,
          available_hours_per_day: hours,
          deadline,
        }),
      });
      setPlan(data);
      setTasks(data.tasks || []);
      setStep("plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: StudyTaskResponse) => {
    try {
      const updated = await api<StudyTaskResponse>(`/planner/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      });
      setTasks((t) => t.map((x) => (x.id === task.id ? updated : x)));
    } catch {
      // ignore
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-w-0 max-w-3xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Study Planner</h1>
        <p className="text-muted-foreground mt-1">Create a personalized study schedule powered by AI</p>
      </div>

      {step === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Create Study Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={generatePlan} className="space-y-5">
              <div>
                <Label htmlFor="goal">Study Goal</Label>
                <Input
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  placeholder="e.g., Prepare for biology final exam"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="hours">Available Hours Per Day: <span className="text-primary font-semibold">{hours}h</span></Label>
                <Input
                  id="hours"
                  type="number"
                  min={1}
                  max={12}
                  step={0.5}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Plan"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "plan" && plan && (
        <div className="space-y-5">
          {/* Plan Header */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">{plan.plan.goal}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Deadline: {plan.plan.deadline}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{plan.plan.available_hours_per_day}h per day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span>{tasks.length} tasks</span>
                </div>
              </div>
              <div className="mt-4">
                <SimpleProgress value={progressPercent} />
                <p className="text-xs text-muted-foreground mt-1">{completedCount} of {tasks.length} completed</p>
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Tasks</h2>
            {tasks.length === 0 ? (
              <Card className="py-8">
                <CardContent className="text-center">
                  <p className="text-muted-foreground">No tasks yet. Your plan will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    className={`transition-all ${task.completed ? "opacity-60 bg-muted/30" : "hover:shadow-sm"}`}
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => toggleTask(task)}
                          className={`
                            flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0
                            transition-colors
                            ${task.completed
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground hover:border-primary"
                            }
                          `}
                          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                        >
                          {task.completed && <CheckCircle2 className="h-3 w-3" />}
                        </button>
                        <div className="min-w-0">
                          <p className={`font-medium text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{task.scheduled_date}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => { setStep("create"); setPlan(null); setTasks([]); }}
          >
            <RotateCcw className="h-4 w-4" />
            Create New Plan
          </Button>
        </div>
      )}
    </div>
  );
}
