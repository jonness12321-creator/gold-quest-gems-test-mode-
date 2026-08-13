import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { BrandMark } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CashGPT" },
      { name: "description", content: "Sign in or create your CashGPT account to start earning." },
      { property: "og:title", content: "Sign in — CashGPT" },
      { property: "og:description", content: "Sign in or create your CashGPT account to start earning." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  // Capture ?ref=CODE from an invite link so the profile is attributed on first sign-in.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) window.localStorage.setItem("coinquest.ref", ref.trim().toUpperCase().slice(0, 20));
  }, []);

  useEffect(() => {
    if (session) navigate({ to: "/home", replace: true });
  }, [session, navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-14" />
          <h1 className="text-2xl">Welcome to CashGPT</h1>
          <p className="text-sm text-muted-foreground">
            Watch, complete, cash out — real rewards in your wallet.
          </p>
        </div>

        <form
          className="surface-card mt-6 space-y-3 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const parsed = schema.safeParse({
              email: String(form.get("email")),
              password: String(form.get("password")),
            });
            if (!parsed.success) {
              toast.error(parsed.error.issues[0]?.message ?? "Check your details.");
              return;
            }
            setBusy(true);
            try {
              if (mode === "signup") {
                const { error } = await supabase.auth.signUp({
                  ...parsed.data,
                  options: { emailRedirectTo: window.location.origin },
                });
                if (error) throw error;
                toast.success("Check your email to confirm your account.");
              } else {
                const { error } = await supabase.auth.signInWithPassword(parsed.data);
                if (error) throw error;
              }
            } catch (error) {
              toast.error((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" maxLength={255} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              maxLength={72}
            />
          </div>
          <Button type="submit" variant="jade" className="w-full" disabled={busy}>
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
          <button
            type="button"
            className="w-full pt-1 text-xs font-semibold text-primary"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </form>
      </div>
    </main>
  );
}
