"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { useAuth } from "@/context/auth-context";

const LINKS = [
  { href: "/dashboard", label: "Overview", dot: "bg-[#818cf8]", border: "border-[#818cf8]" },
  { href: "/dashboard/credentials", label: "Credentials", dot: "bg-accent-teal", border: "border-accent-teal" },
  { href: "/dashboard/permissions", label: "Connected apps", dot: "bg-accent-amber", border: "border-accent-amber" },
  { href: "/dashboard/apps", label: "My apps", dot: "bg-accent-rose", border: "border-accent-rose" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-full flex-col justify-between border border-surface-dark-border bg-surface-dark p-4 text-surface-dark-foreground md:w-60">
      <div>
        <Link href="/" className="flex items-center gap-2 px-2 py-2">
          <LogoMark size={26} variant="dark" />
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
                    ? `${link.border} bg-white/[0.06] text-surface-dark-foreground`
                    : "border-transparent text-white/50 hover:border-white/20 hover:text-surface-dark-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? link.dot : "bg-white/20"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 border-t border-surface-dark-border pt-4">
        <p className="truncate px-2 text-xs text-white/40">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-2 w-full px-3 py-2 text-left text-sm text-white/50 hover:text-surface-dark-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
