"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const AUDIENCES = [
  {
    n: "For individuals",
    title: "Verify once, skip the repeat uploads",
    body: "Prove who you are one time. From then on, apps ask Identiq for a yes/no — you never dig out a passport scan again.",
    cta: { label: "Create your identity", href: "/register" },
  },
  {
    n: "For businesses",
    title: "Trust a counterparty without a paperwork loop",
    body: "Marketplaces and platforms can confirm a business is verified before doing a deal — without collecting incorporation documents themselves.",
    cta: { label: "See how it works", href: "/#how-it-works" },
  },
  {
    n: "For platforms & apps",
    title: "Skip building your own KYC stack",
    body: "Integrate a permission check instead of a document pipeline. Three lines of code instead of a compliance vendor contract.",
    cta: { label: "Read the integration guide", href: "/developers" },
  },
];

export function Audiences() {
  return (
    <section className="border-t border-border-strong">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">Who it&apos;s for</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">One identity layer, three audiences</h2>
          <p className="mt-4 text-muted">Whoever you are, the same rule applies: you decide what gets shared, and with whom.</p>
        </div>

        <div className="mt-12 grid grid-cols-1 divide-y divide-border-strong border-t border-border-strong md:grid-cols-3 md:divide-x md:divide-y-0">
          {AUDIENCES.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col p-6 sm:p-8"
            >
              <p className="eyebrow">{audience.n}</p>
              <h3 className="mt-3 text-lg font-medium text-foreground">{audience.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{audience.body}</p>
              <Link href={audience.cta.href} className="mt-5 text-sm font-medium accent-text hover:underline">
                {audience.cta.label} &rarr;
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
