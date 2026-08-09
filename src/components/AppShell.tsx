import { Link } from "@tanstack/react-router";
import { Bell, Coins } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "./BottomNav";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`grid size-10 place-items-center rounded-2xl bg-jade-gradient text-primary-foreground shadow-lift ${className}`}
    >
      <span className="font-display text-xl leading-none">C</span>
    </span>
  );
}

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { session, profile } = useAuth();
  const unread = useQuery({
    queryKey: ["notifications-unread", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      return count ?? 0;
    },
  });

  const firstName = (profile?.name ?? "").trim().split(/\s+/)[0] || "there";
  void subtitle;

  const available = Number(profile?.wallet_balance ?? 0) - Number(profile?.held_balance ?? 0);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
        <Link to="/profile" aria-label="Open profile and settings" className="flex items-center gap-2">
          <BrandMark />
          <span className="block leading-tight">
            <span className="block text-xs text-muted-foreground">Hello</span>
            <span className="block font-display text-lg leading-tight">{firstName}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative grid size-10 place-items-center rounded-full border border-border bg-card shadow-soft"
          >
            <Bell className="size-4 text-primary" />
            {(unread.data ?? 0) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread.data}
              </span>
            )}
          </Link>
          <Link
            to="/wallet"
            aria-label="Open wallet"
            className="flex items-center gap-1.5 rounded-full bg-gold-gradient px-3 py-2 text-gold-foreground shadow-gold"
          >
            <Coins className="size-4" />
            <span className="text-amount text-sm">{formatMoney(available)}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  subtitle,
  hideNav = false,
}: {
  children: React.ReactNode;
  subtitle?: string;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader {...(subtitle ? { subtitle } : {})} />
      <main className="mx-auto w-full max-w-lg px-4 py-4">{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
