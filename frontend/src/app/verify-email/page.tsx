"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { ApiError, apiFetch } from "@/services/api";
import { Alert, Spinner } from "@/components/ui";

type Status = "verifying" | "verified" | "error";

function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [error, setError] = useState(token ? "" : "This link is missing its verification token.");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    apiFetch("/auth/verify-email", { method: "POST", body: { token }, auth: false })
      .then(() => setStatus("verified"))
      .catch((err: unknown) => {
        setStatus("error");
        setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Confirming the address you signed up with."
      footer={
        <Link href="/dashboard" className="text-foreground underline underline-offset-4">
          Go to dashboard
        </Link>
      }
    >
      {status === "verifying" && <Spinner label="Verifying…" />}
      {status === "verified" && <Alert tone="success">Your email is verified. You&apos;re all set.</Alert>}
      {status === "error" && <Alert>{error}</Alert>}
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
