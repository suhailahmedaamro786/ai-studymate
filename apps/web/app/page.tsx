import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeamSection } from "@/components/team-section";
import { Footer } from "@/components/footer";
import {
  MessageSquare,
  FileText,
  HelpCircle,
  CalendarCheck,
  Briefcase,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  BookOpen,
  Upload,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Tutor",
    description: "Ask questions grounded in your study materials with accurate, cited answers.",
    href: "/tutor",
  },
  {
    icon: FileText,
    title: "Document Intelligence",
    description: "Upload PDFs and build a searchable knowledge base for your courses.",
    href: "/documents",
  },
  {
    icon: HelpCircle,
    title: "Smart Quizzes",
    description: "AI-generated quizzes adapt to your topics and difficulty preferences.",
    href: "/quiz",
  },
  {
    icon: CalendarCheck,
    title: "Study Planner",
    description: "Get personalized study plans with smart task scheduling.",
    href: "/planner",
  },
  {
    icon: Briefcase,
    title: "Career Assistant",
    description: "Discover career paths, skill gaps, and personalized learning roadmaps.",
    href: "/career",
  },
];

const steps = [
  { icon: Upload, title: "Upload", description: "Add your study materials as PDFs" },
  { icon: MessageSquare, title: "Ask", description: "Chat with AI grounded in your documents" },
  { icon: HelpCircle, title: "Practice", description: "Take quizzes to test your knowledge" },
  { icon: CalendarCheck, title: "Plan", description: "Follow a structured study schedule" },
  { icon: Briefcase, title: "Grow", description: "Explore career paths aligned with your skills" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Learning Platform
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
            Your AI-Powered
            <br />
            <span className="text-primary">Personal Study Companion</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
            Learn smarter with AI tutoring, document intelligence, smart quizzes, and personalized career guidance — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/20">
              <Link href="/dashboard">
                Get Started Free
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/tutor">
                <MessageSquare className="h-4 w-4" />
                Try AI Tutor
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Instant answers</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Source-grounded</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>All-in-one</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Everything you need to excel
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              From uploading notes to landing your dream job, AI StudyMate supports your entire learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.title} href={feature.href}>
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer group">
                    <CardContent className="pt-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Get started in minutes with our simple workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center group">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      {i < steps.length - 1 && (
                        <div className="hidden lg:block absolute top-6 left-[calc(100%+8px)] w-[calc(100%-16px)] h-px bg-border" />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to study smarter?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join students using AI StudyMate to transform their learning experience.
          </p>
          <Button asChild size="lg" className="shadow-lg shadow-primary/20">
            <Link href="/dashboard">Start Learning Now</Link>
          </Button>
        </div>
      </section>

      {/* Team */}
      <TeamSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
