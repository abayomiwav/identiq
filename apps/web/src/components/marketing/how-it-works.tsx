"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    title: "Verify once",
    body: "Connect a Stellar wallet and complete verification a single time. Identiq anchors the result on-chain as a hash — never the document itself.",
  },
  {
    step: "02",
    title: "Grant permission",
    body: "When an app needs proof of who you are, you choose exactly what to share — and for how long. Nothing is shared by default.",
  },
  {
    step: "03",
    title: "Apps check, not collect",
    body: "The app calls Identiq to confirm your credential is valid. It gets a pass/fail result, not a copy of your passport.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="max-w-xl">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">One verification. Every app.</h2>
        <p className="mt-4 text-muted">Replace repetitive KYC with a single reusable identity.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 divide-y divide-border-strong border border-border-strong md:grid-cols-3 md:divide-x md:divide-y-0">
        {STEPS.map((item, index) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="p-6 sm:p-8"
          >
            <span className="font-mono text-4xl font-semibold text-border-strong">{item.step}</span>
            <h3 className="mt-4 text-lg font-medium text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
