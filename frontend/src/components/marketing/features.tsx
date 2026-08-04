"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Reusable identity",
    body: "One verified identity per person, anchored to their own Stellar wallet — not stored in Identiq's custody.",
  },
  {
    title: "Permission sharing",
    body: "Every app gets its own scoped, expiring grant. Revoke access to any app at any time, instantly.",
  },
  {
    title: "Credential expiration",
    body: "KYC tiers, proof of address, and business verification all carry real expiry windows — no stale trust.",
  },
  {
    title: "Business verification",
    body: "Companies verify once too, so marketplaces and platforms can trust a counterparty without a paperwork loop.",
  },
  {
    title: "Wallet reputation",
    body: "A transparent, deterministic trust score built from account age, active credentials, and grant history — every factor is independently checkable.",
  },
  {
    title: "Zero-knowledge proofs",
    body: "Coming soon: prove a credential's result without revealing the underlying data at all, even to Identiq.",
    soon: true,
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border-strong">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">What it does</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Built for trust, not surveillance</h2>
          <p className="mt-4 text-muted">
            Every piece of the system is designed around a single rule: never store what you don&apos;t have to.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 divide-y divide-border-strong border-t border-border-strong sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
              className="relative border-b border-border-strong p-6 sm:border-r sm:even:border-r-0 lg:border-r lg:[&:nth-child(3n)]:border-r-0"
            >
              {feature.soon && <span className="eyebrow absolute right-6 top-6 !text-muted">Soon</span>}
              <h3 className="text-base font-medium text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
