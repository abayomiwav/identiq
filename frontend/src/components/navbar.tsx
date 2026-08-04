"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { LogoMark } from "./logo-mark";
import { useAuth } from "@/context/auth-context";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Why Identiq" },
  { href: "/#pricing", label: "Pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-strong bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <LogoMark size={26} />
          <span className="text-[15px] text-foreground">Identiq</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="eyebrow px-3 py-2 !text-[11px] text-muted transition-colors hover:!text-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link href="/dashboard" className="px-3 py-2 text-sm text-muted transition-colors hover:text-foreground">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="border border-border-strong px-4 py-2 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-sm text-muted transition-colors hover:text-foreground">
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center text-foreground md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`}
            />
            <span className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span
              className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border-strong px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="px-3 py-2 text-sm text-muted hover:text-foreground">
                {link.label}
              </a>
            ))}
            <div className="my-2 h-px bg-border-strong" />
            {user ? (
              <>
                <Link href="/dashboard" className="px-3 py-2 text-sm text-foreground">
                  Dashboard
                </Link>
                <button onClick={logout} className="px-3 py-2 text-left text-sm text-foreground">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2 text-sm text-foreground">
                  Sign in
                </Link>
                <Link href="/register" className="mt-1 bg-accent px-3 py-2 text-center text-sm font-medium text-accent-foreground">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </motion.div>
      )}
    </header>
  );
}
