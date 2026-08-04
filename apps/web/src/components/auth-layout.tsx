"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LogoMark } from "./logo-mark";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="hairline-grid relative flex min-h-screen flex-1 items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="corner-ticks panel relative w-full max-w-md p-8"
      >
        <Link href="/" className="flex items-center justify-center gap-2">
          <LogoMark size={32} />
        </Link>
        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-center text-sm text-muted">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </motion.div>
    </main>
  );
}
