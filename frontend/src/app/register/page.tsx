"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { TextField } from "@/components/text-field";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/services/api";
import { Alert, Button } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      toast.success("Account created");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome to Identiq"
      subtitle="Create your account, then link a Stellar wallet to anchor your identity."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <Alert>{error}</Alert>}

        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
