import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { BrandMark } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const { session, loading, profile, profileLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (profileLoading) return;
    navigate({ to: profile && !profile.onboarded ? "/onboarding" : "/home", replace: true });
  }, [session, loading, profile, profileLoading, navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <BrandMark className="size-16 animate-pulse" />
      <h1 className="text-2xl">CashGPT</h1>
      <p className="text-sm text-muted-foreground">Loading your wallet…</p>
    </main>
  );
}
