"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  HelpCircle,
  CalendarCheck,
  Briefcase,
  BarChart3,
  LogOut,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/tutor", label: "AI Tutor", icon: MessageSquare },
  { href: "/quiz", label: "Quizzes", icon: HelpCircle },
  { href: "/planner", label: "Planner", icon: CalendarCheck },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="group-hover:text-primary transition-colors">StudyMate</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden md:block">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background animate-in">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                    transition-colors
                    ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
