import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LogoMark } from "@/components/logo-mark";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="hairline-grid flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <LogoMark size={40} />
        <p className="eyebrow mt-6">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Page not found</h1>
        <p className="mt-3 max-w-sm text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist, or has moved.
        </p>
        <Link
          href="/"
          className="mt-8 border border-border-strong bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-85"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
