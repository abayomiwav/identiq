import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "About",
  description: "Why Identiq exists, and what it's built on.",
};

const PRINCIPLES = [
  {
    n: "01",
    title: "Never take custody of your keys",
    body: "Registering your identity and granting permissions are actions only you can authorize. Identiq builds the transaction; your own wallet signs it. We never hold a signing key that could act as you.",
  },
  {
    n: "02",
    title: "Never store raw evidence",
    body: "When a credential is issued, only a hash of the evidence checked is kept — never the document itself. A credential can be independently re-verified without Identiq, or anyone else, holding the original file.",
  },
  {
    n: "03",
    title: "Every check is permissioned, not public",
    body: "An app can only read a credential's status if you've granted it a scoped, expiring permission for that specific credential type. Nothing is visible by default, and every grant can be revoked instantly.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="hairline-grid border-b border-border-strong">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="eyebrow">About Identiq</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Verify once, not on every app you sign up for
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Every app that needs to know you&apos;re a real, verified person today asks you to upload a
              passport again. Identiq exists to break that loop: verify once, then grant each app a scoped,
              expiring, revocable permission to check the result. The app gets a pass/fail answer — never the
              document.
            </p>
          </div>
        </section>

        <section className="border-b border-border-strong">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">Principles</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">What this is built on</h2>
              <p className="mt-4 text-muted">
                Three rules, held to deliberately — see the{" "}
                <Link href="/security" className="accent-text hover:underline">
                  security page
                </Link>{" "}
                for how each one is actually enforced in code.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 divide-y divide-border-strong border-t border-border-strong md:grid-cols-3 md:divide-x md:divide-y-0">
              {PRINCIPLES.map((p) => (
                <div key={p.n} className="p-6 sm:p-8">
                  <span className="font-mono text-4xl font-semibold text-border-strong">{p.n}</span>
                  <h3 className="mt-4 text-lg font-medium text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">Where this is today</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Honest status</h2>
            </div>
            <div className="mt-8 max-w-2xl space-y-4 text-sm leading-relaxed text-muted">
              <p>
                Identiq runs on Stellar&apos;s public testnet today, not mainnet — it&apos;s free to use while
                that&apos;s true. The identity registry is a real, tested Soroban smart contract; the API,
                dashboard, SDK, and CLI are all fully functional against it.
              </p>
              <p>
                Next up: zero-knowledge proofs, so a credential&apos;s result can be proven without revealing the
                underlying data even to Identiq itself, and a mainnet deployment with usage-based pricing.
              </p>
              <p>
                The full source — contract, API, SDK, CLI, and this site — is public on{" "}
                <a href="https://github.com/abayomiwav/identiq" className="accent-text hover:underline">
                  GitHub
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
