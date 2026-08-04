"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppWindow, LayoutDashboard, Link2, LogOut, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { useAuth } from "@/context/auth-context";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, color: "text-accent", border: "border-accent" },
  {
    href: "/dashboard/credentials",
    label: "Credentials",
    icon: ShieldCheck,
    color: "text-accent-teal",
    border: "border-accent-teal",
  },
  {
    href: "/dashboard/permissions",
    label: "Connected apps",
    icon: Link2,
    color: "text-accent-amber",
    border: "border-accent-amber",
  },
  {
    href: "/dashboard/apps",
    label: "My apps",
    icon: AppWindow,
    color: "text-accent-rose",
    border: "border-accent-rose",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-full flex-col border border-border-strong bg-card md:h-full md:w-60 md:justify-between md:p-4">
      <div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-2 md:py-2">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="font-semibold">Identiq</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground md:hidden"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border-strong px-2 py-1 md:mt-6 md:flex-col md:border-t-0 md:px-0 md:py-0">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap border-l-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? `${link.border} bg-background text-foreground`
                    : "border-transparent text-muted hover:border-border-strong hover:text-foreground"
                }`}
              >
                <Icon size={16} className={active ? link.color : "text-muted"} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="hidden border-t border-border-strong pt-4 md:mt-6 md:block">
        <p className="truncate px-2 text-xs text-muted">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-muted hover:text-foreground"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
