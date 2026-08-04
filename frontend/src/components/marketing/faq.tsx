"use client";

import { Disclosure } from "@/components/ui";

const FAQS = [
  {
    q: "Is my identity data safe?",
    a: "Identiq never stores your passport, ID scan, or any document. When you verify, only a cryptographic hash of the evidence checked is kept — a one-way fingerprint that proves something was verified without revealing what it was. Apps you approve receive a pass/fail result, never a document.",
  },
  {
    q: "Do I need to understand crypto to use this?",
    a: "You'll connect a Stellar wallet (like Freighter) once, since that's what your identity is anchored to — but day to day you're just approving or revoking which apps can check your verification status, the same way you'd manage connected apps on Google or GitHub.",
  },
  {
    q: "What does 'verify once' actually mean?",
    a: "You complete identity verification a single time. The result — e.g. \"KYC Tier 1: passed\" — is anchored to your identity with an expiry date. Any app you grant permission to can check that result instead of asking you to verify again.",
  },
  {
    q: "Can I control which apps see what?",
    a: "Yes — every app gets its own scoped, expiring permission grant for a specific credential type. You can review and revoke any app's access at any time from your dashboard; revocation takes effect immediately.",
  },
  {
    q: "Is Identiq free to use?",
    a: "Yes, currently free — Identiq runs on Stellar's public testnet today. Mainnet pricing, when it launches, will be usage-based (pay per verification), not a subscription.",
  },
  {
    q: "What if I run a business or platform, not just an individual account?",
    a: "Businesses can verify once too, the same way individuals do, and marketplaces or platforms can check that verification instead of collecting incorporation documents themselves. See the integration guide for developers who want to build this in.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-border-strong">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">Questions</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Common questions</h2>
        </div>

        <div className="mt-10 max-w-3xl">
          {FAQS.map((item) => (
            <Disclosure key={item.q} summary={item.q}>
              {item.a}
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  );
}
