import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-label",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://identiq.app";
const DESCRIPTION =
  "Identiq is decentralized identity infrastructure on Stellar. Verify once, then let apps request permission to check the result — never the underlying documents.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Identiq — Verify Once. Access Everywhere.",
    template: "%s · Identiq",
  },
  description: DESCRIPTION,
  keywords: [
    "decentralized identity",
    "Stellar",
    "Soroban",
    "KYC",
    "verifiable credentials",
    "identity as a service",
  ],
  openGraph: {
    title: "Identiq — Verify Once. Access Everywhere.",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Identiq",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Identiq — Verify Once. Access Everywhere.",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "flex items-start gap-3 w-full border border-border-strong bg-card p-4 text-sm text-foreground shadow-none",
              title: "font-medium",
              description: "text-muted",
              actionButton: "border border-border-strong bg-foreground text-background px-2.5 py-1 text-xs",
              cancelButton: "border border-border-strong px-2.5 py-1 text-xs",
            },
          }}
        />
      </body>
    </html>
  );
}
