import Link from "next/link";

const FOOTER_LINKS = {
  product: [
    { href: "/tutor", label: "AI Tutor" },
    { href: "/documents", label: "Documents" },
    { href: "/quiz", label: "Quizzes" },
    { href: "/planner", label: "Study Planner" },
    { href: "/career", label: "Career Assistant" },
  ],
  resources: [
    { href: "#", label: "Documentation" },
    { href: "#", label: "GitHub" },
    { href: "#", label: "Hackathon" },
  ],
  team: [
    { href: "#team", label: "Meet the Team" },
  ],
  connect: [
    { href: "#", label: "GitHub" },
    { href: "#", label: "LinkedIn" },
    { href: "#", label: "Email" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.product.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.resources.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Team</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.team.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Connect</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.connect.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 AI StudyMate. Built with love by Team AI StudyMate.
          </p>
          <p className="text-xs text-muted-foreground">
            Student Leader: Suhail Ahmed Aamro
          </p>
        </div>
      </div>
    </footer>
  );
}
