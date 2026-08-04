import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border-strong">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <LogoMark size={24} />
              <span className="font-semibold">Identiq</span>
            </div>
            <p className="mt-3 text-sm text-muted">
              Decentralized identity infrastructure on Stellar. Verify once, access everywhere.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="eyebrow">Product</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/#how-it-works" className="hover:text-foreground">How it works</Link></li>
                <li><Link href="/#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/register" className="hover:text-foreground">Get started</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="eyebrow">Building on Identiq</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/developers" className="hover:text-foreground">Integration guide</Link></li>
                <li>
                  <a href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/docs`} className="hover:text-foreground">
                    API reference
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="eyebrow">Company</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
                <li><a href="https://github.com/abayomiwav/identiq" className="hover:text-foreground">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border-strong pt-6 text-xs text-muted sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Identiq. All rights reserved.</p>
          <p className="eyebrow !text-muted">identiq.app</p>
        </div>
      </div>
    </footer>
  );
}
