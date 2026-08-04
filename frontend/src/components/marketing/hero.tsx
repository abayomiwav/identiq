"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="hairline-grid relative overflow-hidden border-b border-border-strong">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <p className="eyebrow">Identity-as-a-Service &middot; Stellar / Soroban</p>

          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Verify once.
            <br />
            <span className="accent-text">Access everywhere.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            Identiq gives people ownership of their digital identity, and lets the apps they use verify trust
            without ever collecting — or storing — another passport scan.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="border border-border-strong bg-foreground px-6 py-3 text-center text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Create your identity &rarr;
            </Link>
            <a
              href="#developers"
              className="border border-border-strong px-6 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Read the docs
            </a>
          </div>

          <p className="mt-6 eyebrow !text-muted">No credit card &middot; no uploads until you choose to verify</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="corner-ticks panel relative mt-16 grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          {[
            { n: "01", label: "Identity", value: "1 wallet, verified once" },
            { n: "02", label: "Credentials", value: "KYC · Email · Business" },
            { n: "03", label: "Permission grants", value: "Per-app, revocable anytime" },
          ].map((row) => (
            <div key={row.label} className="p-6 sm:p-8">
              <p className="eyebrow">{row.n} &middot; {row.label}</p>
              <p className="mt-3 text-lg text-foreground">{row.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
