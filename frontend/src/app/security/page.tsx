import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Security",
  description: "How Identiq's non-custodial architecture actually works.",
};

const FLOW_STEPS = [
  {
    n: "01",
    title: "Identiq drafts the transaction",
    body: "When you register an identity or grant an app permission, the API builds the transaction — but leaves it unsigned. It never has the ability to sign on your behalf.",
  },
  {
    n: "02",
    title: "Your wallet signs it",
    body: "The unsigned transaction is sent to your own Stellar wallet (e.g. Freighter). You review and sign it there, on your device, with your key.",
  },
  {
    n: "03",
    title: "The signed result is submitted",
    body: "Only the already-signed transaction comes back to Identiq, which submits it to the network. At no point does a private key pass through Identiq's servers.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="hairline-grid border-b border-border-strong">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="eyebrow">Security</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Two boundaries, drawn deliberately
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Identiq is built around two rules that don&apos;t bend for convenience: it never takes custody of
              a user&apos;s signing keys, and it never stores the raw evidence behind a credential. Here&apos;s
              exactly how each one holds up in practice.
            </p>
          </div>
        </section>

        <section className="border-b border-border-strong">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">Boundary one</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Your keys never touch our servers</h2>
              <p className="mt-4 text-muted">
                Identity registration and permission grants are actions only you can authorize. Here&apos;s the
                exact flow, every time:
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 divide-y divide-border-strong border-t border-border-strong md:grid-cols-3 md:divide-x md:divide-y-0">
              {FLOW_STEPS.map((step) => (
                <div key={step.n} className="p-6 sm:p-8">
                  <span className="font-mono text-4xl font-semibold text-border-strong">{step.n}</span>
                  <h3 className="mt-4 text-lg font-medium text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">
              The one exception: Identiq&apos;s own operational signer, used only to sign credentials Identiq
              itself issues as an attester (e.g. confirming your KYC check passed). That&apos;s a platform key,
              scoped to platform actions — it is never used to act as a user, and never could be, since it has
              no relationship to any user&apos;s wallet.
            </p>
          </div>
        </section>

        <section className="border-b border-border-strong">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">Boundary two</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">We store a fingerprint, never the file</h2>
            </div>
            <div className="mt-8 max-w-2xl space-y-4 text-sm leading-relaxed text-muted">
              <p>
                When a credential is issued, Identiq runs the evidence that was checked through a one-way hash
                function (SHA-256) and keeps only the result — a fixed-length string that could only have come
                from that exact evidence, but reveals nothing about what the evidence actually was.
              </p>
              <p>
                That hash is anchored both in Identiq&apos;s database and on-chain, alongside the credential&apos;s
                type, issuer, and expiry. Anyone who independently holds the original evidence can confirm it
                matches — without Identiq ever having stored, transmitted, or been able to reconstruct the
                original file.
              </p>
              <p>
                This is enforced by design, not policy: the code path that issues a credential never accepts or
                persists a document, image, or file — only a reference and its hash.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">Verify it yourself</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Nothing here is a claim you have to trust</h2>
              <p className="mt-4 text-muted">
                The identity contract, API, SDK, and CLI are all open source. The non-custodial transaction flow
                lives in the Stellar integration module; the evidence-hashing logic is a few lines you can read
                end to end.
              </p>
              <a
                href="https://github.com/abayomiwav/identiq"
                className="mt-6 inline-block border border-border-strong bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-85"
              >
                View the source on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
