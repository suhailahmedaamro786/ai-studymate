import { Suspense } from "react";
import { createClient, serverApi } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TeamSection } from "@/components/team-section";
import {
  MessageSquare,
  FileText,
  HelpCircle,
  CalendarCheck,
  Briefcase,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";

async function DashboardContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/login");
  }

  const [documents, chats, quizzes] = await Promise.all([
    serverApi<any[]>(`/documents`).catch(() => []),
    serverApi<any[]>(`/tutor/chats`).catch(() => []),
    serverApi<any[]>(`/quiz`).catch(() => []),
  ]);

  const profile = await serverApi<any>(`/profiles/me`).catch(() => null);
  const displayName = profile?.display_name || data.session.user.email?.split("@")[0] || "Student";
  const greeting =
    new Date().getHours() < 12
      ? `Good morning, ${displayName}`
      : new Date().getHours() < 18
        ? `Good afternoon, ${displayName}`
        : `Good evening, ${displayName}`;

  const stats = [
    { label: "Documents", value: documents?.length ?? 0, href: "/documents", icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Chats", value: chats?.length ?? 0, href: "/tutor", icon: MessageSquare, color: "text-green-600 bg-green-50" },
    { label: "Quizzes", value: quizzes?.length ?? 0, href: "/quiz", icon: HelpCircle, color: "text-purple-600 bg-purple-50" },
  ];

  const quickActions = [
    { href: "/tutor", title: "Ask a question", description: "Chat with your AI tutor", icon: MessageSquare },
    { href: "/documents", title: "Upload PDF", description: "Add study materials", icon: FileText },
    { href: "/quiz", title: "Take a quiz", description: "Test your knowledge", icon: HelpCircle },
    { href: "/planner", title: "Plan studies", description: "Create a study schedule", icon: CalendarCheck },
  ];

  const features = [
    { href: "/tutor", title: "AI Tutor", description: "Get answers grounded in your documents", icon: MessageSquare },
    { href: "/documents", title: "Documents", description: "Upload and manage your PDFs", icon: FileText },
    { href: "/quiz", title: "Quizzes", description: "Test knowledge with AI-generated quizzes", icon: HelpCircle },
    { href: "/planner", title: "Planner", description: "AI-generated study plans", icon: CalendarCheck },
    { href: "/career", title: "Career", description: "Explore career paths and skill gaps", icon: Briefcase },
  ];

  const hasActivity = stats.some((s) => s.value > 0);

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Welcome back</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{greeting}</h1>
          <p className="text-muted-foreground max-w-xl">
            Your AI-powered learning companion. What would you like to work on today?
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button key={action.title} asChild variant="outline" size="sm" className="gap-1.5 bg-background/80 backdrop-blur">
                  <Link href={action.href}>
                    <Icon className="h-4 w-4" />
                    {action.title}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                    </div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Explore AI StudyMate</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Activity Summary */}
      {hasActivity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activity Summary
            </CardTitle>
            <CardDescription>Your recent study activity at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center py-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{stats[0].value}</p>
                <p className="text-xs text-muted-foreground mt-1">Documents</p>
              </div>
              <div className="text-center py-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{stats[1].value}</p>
                <p className="text-xs text-muted-foreground mt-1">Chats</p>
              </div>
              <div className="text-center py-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{stats[2].value}</p>
                <p className="text-xs text-muted-foreground mt-1">Quizzes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Section */}
      <TeamSection />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-64 animate-shimmer" />
            <div className="h-4 bg-muted rounded w-96 animate-shimmer" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-lg animate-shimmer" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-shimmer" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
