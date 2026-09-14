"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient px-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-primary/10 p-8 md:p-12 text-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/20 text-primary border border-primary/20">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              AI-Powered Personalized Learning
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              AI StudyMate
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
              Upload your study materials, chat with an AI tutor grounded in your documents,
              and test your knowledge with smart quizzes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="h-11 px-8">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-8 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white">
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
