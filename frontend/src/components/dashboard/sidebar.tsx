"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { useAuth } from "@/context/auth-context";

const LINKS = [
  { href: "/dashboard", label: "Overview", dot: "bg-accent", border: "border-accent" },
  { href: "/dashboard/credentials", label: "Credentials", dot: "bg-accent-teal", border: "border-accent-teal" },
  { href: "/dashboard/permissions", label: "Connected apps", dot: "bg-accent-amber", border: "border-accent-amber" },
  { href: "/dashboard/apps", label: "My apps", dot: "bg-accent-rose", border: "border-accent-rose" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-full flex-col justify-between border border-border-strong bg-card p-4 md:w-60">
      <div>
        <Link href="/" className="flex items-center gap-2 px-2 py-2">
          <LogoMark size={26} />
          <span className="font-semibold">Identiq</span>
        </Link>
        <nav className="mt-6 flex flex-col gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 border-l-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? `${link.border} bg-background text-foreground`
                    : "border-transparent text-muted hover:border-border-strong hover:text-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? link.dot : "bg-border-strong/30"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 border-t border-border-strong pt-4">
        <p className="truncate px-2 text-xs text-muted">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-2 w-full px-3 py-2 text-left text-sm text-muted hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
