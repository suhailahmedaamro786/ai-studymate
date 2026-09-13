import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md p-8">{children}</div>
    </div>
  );
}
