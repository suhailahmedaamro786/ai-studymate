import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn() },
  }),
}));

vi.mock("next/link", ({ children, ...props }: { children?: React.ReactNode; href?: string }) => {
  return props.href ? <a href={props.href}>{children}</a> : children;
});

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ..._props }: Record<string, unknown>) => children,
}));

vi.mock("lucide-react", () => {
  const MockIcon = (_props: Record<string, unknown>) => null as unknown as JSX.Element;
  return {
    __esModule: true,
    LayoutDashboard: MockIcon,
    FileText: MockIcon,
    MessageSquare: MockIcon,
    HelpCircle: MockIcon,
    CalendarCheck: MockIcon,
    Briefcase: MockIcon,
    BarChart3: MockIcon,
    LogOut: MockIcon,
    Menu: MockIcon,
    X: MockIcon,
    BookOpen: MockIcon,
  };
});

import { render, screen } from "@testing-library/react";
import Nav from "@/components/nav";

describe("Nav", () => {
  it("renders the StudyMate brand", () => {
    render(<Nav />);
    expect(screen.getByText("StudyMate")).toBeDefined();
  });

  it("renders primary navigation items", () => {
    render(<Nav />);
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Documents")).toBeDefined();
    expect(screen.getByText("AI Tutor")).toBeDefined();
    expect(screen.getByText("Quizzes")).toBeDefined();
    expect(screen.getByText("Planner")).toBeDefined();
    expect(screen.getByText("Career")).toBeDefined();
    expect(screen.getByText("Analytics")).toBeDefined();
  });

  it("renders a logout button", () => {
    render(<Nav />);
    expect(screen.getByText("Logout")).toBeDefined();
  });
});
