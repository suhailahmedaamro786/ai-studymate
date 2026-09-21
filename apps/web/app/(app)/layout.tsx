import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen min-w-0 bg-muted/30 flex flex-col">
      <Nav />
      <main className="flex-1 min-w-0 max-w-6xl mx-auto w-full p-3 sm:p-4 md:p-6">{children}</main>
      <Footer />
    </div>
  );
}
