import { serverApi } from "@/lib/supabase/server";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage() {
  let initialDocs: any[] = [];
  try {
    initialDocs = await serverApi<any[]>("/documents");
  } catch {
    initialDocs = [];
  }

  return <DocumentsClient initialDocuments={initialDocs} />;
}
