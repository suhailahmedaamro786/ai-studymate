import { serverApi } from "@/lib/supabase/server";
import { CareerClient } from "./career-client";

export default async function CareerPage() {
  let initialRecommendations: any[] = [];
  try {
    initialRecommendations = await serverApi<any[]>("/career/recommendations");
  } catch {
    initialRecommendations = [];
  }

  return <CareerClient initialRecommendations={initialRecommendations} />;
}
