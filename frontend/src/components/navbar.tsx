"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const userMenuRef = useRef<HTMLDivElement>(null);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (menuOpen) setMenuOpen(false);
    if (userMenuOpen) setUserMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    function onClick(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background transition-shadow ${
        scrolled ? "border-border-strong shadow-[0_1px_0_0_rgba(0,0,0,0.04)]" : "border-border"
      }`}
    >
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
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 border border-border-strong px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                <span className="flex h-6 w-6 items-center justify-center bg-accent text-xs font-medium text-accent-foreground">
                  {user.email.charAt(0).toUpperCase()}
                </span>
                <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="panel absolute right-0 mt-2 w-52 py-1"
                >
                  <p className="truncate border-b border-border px-3 py-2 text-xs text-muted">{user.email}</p>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-background"
                  >
                    <LayoutDashboard size={15} className="text-muted" />
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-background"
                  >
                    <LogOut size={15} className="text-muted" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                <LogIn size={15} />
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
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
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
                <p className="truncate px-3 py-1 text-xs text-muted">{user.email}</p>
                <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground">
                  <LayoutDashboard size={15} className="text-muted" />
                  Dashboard
                </Link>
                <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground">
                  <LogOut size={15} className="text-muted" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground">
                  <LogIn size={15} className="text-muted" />
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
