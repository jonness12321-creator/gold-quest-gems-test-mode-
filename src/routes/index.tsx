import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { BrandMark } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate({ to: session ? "/home" : "/auth", replace: true });
  }, [session, loading, navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <BrandMark className="size-16 animate-pulse" />
      <h1 className="text-2xl">CoinQuest</h1>
      <p className="text-sm text-muted-foreground">Loading your wallet…</p>
    </main>
  );
}
