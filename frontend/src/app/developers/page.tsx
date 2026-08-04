"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const CODE = `import { IdentiqClient } from "@identiq/sdk";

const identiq = new IdentiqClient({ apiKey: process.env.IDENTIQ_API_KEY! });

const result = await identiq.checkAccess({
  identityId: user.identiqIdentityId,
  credentialType: "KYC_TIER1",
});

if (result.verified) {
  // proceed — no document upload required
}`;

const CLI_CODE = `npm install -g @identiq/cli

identiq login
identiq apps create "My App" --redirect-uri https://myapp.com/callback`;

export default function DevelopersPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="hairline-grid border-b border-border-strong">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="eyebrow">Building on Identiq</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Skip the KYC vendor. Check, don&apos;t collect.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted">
                If you run a website, app, or platform and need to know a user is who they say they are, Identiq
                gives you a yes/no answer — never the underlying documents. No compliance team required to get
                started.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard/apps" className="bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-85">
                  Register your app
                </Link>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/docs`}
                  className="border border-border-strong px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground hover:text-background"
                >
                  API reference
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-border-strong">
          <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-2">
            <div className="border-b border-border-strong px-4 py-16 sm:px-6 sm:py-20 lg:border-b-0 lg:border-r">
              <p className="eyebrow">The SDK</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Three lines, one answer</h2>
              <p className="mt-4 max-w-md text-muted">
                Check whether a user has already verified — without collecting a single document. The Identiq
                SDK, CLI, and REST API all speak the same permission model.
              </p>
            </div>
            <pre className="overflow-x-auto bg-[#0a0a0a] p-6 text-xs leading-relaxed text-slate-300 sm:p-10 sm:text-sm">
              <code>{CODE}</code>
            </pre>
          </div>
        </section>

        <section>
          <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-2">
            <pre className="overflow-x-auto border-b border-border-strong bg-[#0a0a0a] p-6 text-xs leading-relaxed text-slate-300 sm:p-10 sm:text-sm lg:border-b-0 lg:border-r">
              <code>{CLI_CODE}</code>
            </pre>
            <div className="px-4 py-16 sm:px-6 sm:py-20">
              <p className="eyebrow">The CLI</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Manage your app from a terminal</h2>
              <p className="mt-4 max-w-md text-muted">
                Register apps, rotate API keys, and check who&apos;s logged in — without leaving the command line.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/apps" className="border border-border-strong px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground hover:text-background">
                  Open your apps
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
