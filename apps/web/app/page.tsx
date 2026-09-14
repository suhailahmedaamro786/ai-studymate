import { redirect } from "next/navigation";
import LandingPage from "@/components/landing-page";

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const code = params.code;

  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code as string)}`);
  }

  return <LandingPage />;
}
