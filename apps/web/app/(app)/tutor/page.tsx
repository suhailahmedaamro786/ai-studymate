import { serverApi } from "@/lib/supabase/server";
import { TutorClient } from "./tutor-client";

export default async function TutorPage() {
  let initialChats: any[] = [];
  try {
    initialChats = await serverApi<any[]>("/tutor/chats");
  } catch {
    initialChats = [];
  }

  return <TutorClient initialChats={initialChats} />;
}
