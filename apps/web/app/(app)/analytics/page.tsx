import { serverApi } from "@/lib/supabase/server";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  let quizIds: string[] = [];
  try {
    quizIds = await serverApi<string[]>("/quiz");
  } catch {
    quizIds = [];
  }

  return <AnalyticsClient initialQuizIds={quizIds} />;
}
