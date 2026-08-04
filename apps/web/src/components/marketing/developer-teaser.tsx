"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const CODE = `import { IdentiqClient } from "@identiq/sdk";

const identiq = new IdentiqClient({ apiKey: process.env.IDENTIQ_API_KEY! });

const result = await identiq.checkAccess({
  identityId: user.identiqIdentityId,
  credentialType: "KYC_TIER1",
});

if (result.verified) {
  // proceed — no document upload required
}`;

export function DeveloperTeaser() {
  return (
    <section id="developers" className="border-t border-border-strong">
      <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="border-b border-border-strong px-4 py-16 sm:px-6 sm:py-20 lg:border-b-0 lg:border-r"
        >
          <p className="eyebrow">For developers</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Three lines instead of a KYC vendor</h2>
          <p className="mt-4 max-w-md text-muted">
            Check whether a user has already verified — without collecting a single document. The Identiq SDK, CLI,
            and REST API all speak the same permission model.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/apps"
              className="bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-85"
            >
              Open developer portal
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/docs`}
              className="border border-border-strong px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground hover:text-background"
            >
              API reference
            </a>
          </div>
        </motion.div>

        <motion.pre
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto bg-[#0a0a0a] p-6 text-xs leading-relaxed text-slate-300 sm:p-10 sm:text-sm"
        >
          <code>{CODE}</code>
        </motion.pre>
      </div>
    </section>
  );
}
