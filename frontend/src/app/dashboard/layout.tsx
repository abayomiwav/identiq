"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/context/auth-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="hairline-grid flex min-h-screen flex-1 items-center justify-center bg-[#f4f3fa]">
        <p className="eyebrow !text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="hairline-grid min-h-screen flex-1 bg-[#f4f3fa]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
