"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function CtaSection() {
  return (
    <section id="pricing" className="border-t border-border-strong bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="eyebrow !text-accent">Pricing</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Free while Identiq is in testnet
          </h2>
          <p className="mt-4 max-w-xl text-white/60">
            Every identity, credential, and permission grant runs on Stellar testnet today, at no cost. Mainnet
            pricing will be usage-based — pay per verification, not per seat.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="border border-background bg-background px-6 py-3 text-center text-sm font-medium text-foreground hover:opacity-85">
              Create your identity
            </Link>
            <Link href="/dashboard/apps" className="border border-white/30 px-6 py-3 text-center text-sm font-medium text-background hover:bg-white/10">
              Register an app
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
