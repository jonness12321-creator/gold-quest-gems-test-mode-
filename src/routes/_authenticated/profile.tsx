import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  ChevronRight,
  FileText,
  LogOut,
  Shield,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { signOutEverywhere, useAuth } from "@/lib/auth";
import { KYC_THRESHOLD, formatMoney } from "@/lib/coinquest";
import { submitKyc } from "@/lib/coinquest.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — CoinQuest" },
      { name: "description", content: "Manage your CoinQuest account, verification and settings." },
      { property: "og:title", content: "Profile — CoinQuest" },
      {
        property: "og:description",
        content: "Manage your CoinQuest account, verification and settings.",
      },
    ],
  }),
  component: ProfilePage,
});

const kycSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full legal name").max(120),
  idNumber: z.string().trim().min(4, "Enter a valid ID number").max(40),
});

function ProfilePage() {
  const { session, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const kyc = useServerFn(submitKyc);

  const kycRecord = useQuery({
    queryKey: ["kyc", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("kyc_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const savePref = useMutation({
    mutationFn: async (values: { push_enabled?: boolean; language?: string }) => {
      const { error } = await supabase.from("profiles").update(values).eq("id", session!.user.id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["profile"] }),
    onError: () => toast.error("Couldn't save that setting."),
  });

  const sendKyc = useMutation({
    mutationFn: (values: z.infer<typeof kycSchema>) => kyc({ data: values }),
    onSuccess: () => {
      toast.success("Verification submitted — we'll review it soon.");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't submit verification."),
  });

  const status = profile?.kyc_status ?? "unverified";

  return (
    <AppShell subtitle="Profile">
      <section className="surface-card mt-2 flex items-center gap-3 p-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-jade-gradient font-display text-2xl text-primary-foreground">
          {(profile?.name ?? "C").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{profile?.name ?? "CoinQuest user"}</p>
          <p className="truncate text-xs text-muted-foreground">{profile?.email ?? session?.user.email}</p>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-background-alt px-2 py-0.5 text-[11px] font-semibold capitalize">
            <BadgeCheck className="size-3.5 text-primary" /> {status}
          </p>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="surface-card p-3">
          <p className="text-xs text-muted-foreground">Lifetime earned</p>
          <p className="text-amount text-lg">{formatMoney(profile?.lifetime_earned)}</p>
        </div>
        <div className="surface-card p-3">
          <p className="text-xs text-muted-foreground">Withdrawn</p>
          <p className="text-amount text-lg">{formatMoney(profile?.lifetime_withdrawn)}</p>
        </div>
      </div>

      <SectionTitle>Verification</SectionTitle>
      <div className="surface-card space-y-3 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="font-semibold">KYC status: <span className="capitalize">{status}</span></p>
            <p className="text-xs text-muted-foreground">
              Required once lifetime earnings pass {formatMoney(KYC_THRESHOLD)}.
            </p>
            {kycRecord.data?.admin_note && (
              <p className="mt-1 text-xs text-muted-foreground">Note: {kycRecord.data.admin_note}</p>
            )}
          </div>
        </div>
        {status !== "approved" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="jade" size="sm">
                {status === "pending" ? "Update submission" : "Verify identity"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Identity verification</DialogTitle>
                <DialogDescription>
                  We only use this to confirm payouts. Never share your password.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const parsed = kycSchema.safeParse({
                    fullName: String(form.get("fullName")),
                    idNumber: String(form.get("idNumber")),
                  });
                  if (!parsed.success) {
                    toast.error(parsed.error.issues[0]?.message ?? "Check your details.");
                    return;
                  }
                  sendKyc.mutate(parsed.data);
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full legal name</Label>
                  <Input id="fullName" name="fullName" maxLength={120} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="idNumber">Government ID number</Label>
                  <Input id="idNumber" name="idNumber" maxLength={40} />
                </div>
                <DialogFooter>
                  <Button type="submit" variant="gold" disabled={sendKyc.isPending}>
                    Submit
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <SectionTitle>Settings</SectionTitle>
      <div className="surface-card divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">Push notifications</p>
            <p className="text-xs text-muted-foreground">Payout and quest alerts</p>
          </div>
          <Switch
            checked={profile?.push_enabled ?? true}
            onCheckedChange={(checked) => savePref.mutate({ push_enabled: checked })}
          />
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">Language</p>
            <p className="text-xs text-muted-foreground">App display language</p>
          </div>
          <select
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            value={profile?.language ?? "en"}
            onChange={(event) => savePref.mutate({ language: event.target.value })}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="es">Español</option>
          </select>
        </div>
        <button
          className="flex w-full items-center justify-between p-4 text-left"
          onClick={() => navigate({ to: "/wallet" })}
        >
          <span className="flex items-center gap-2 font-semibold">
            <Wallet className="size-4 text-primary" /> Wallet & payouts
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
        <button
          className="flex w-full items-center justify-between p-4 text-left"
          onClick={() => navigate({ to: "/legal/terms" })}
        >
          <span className="flex items-center gap-2 font-semibold">
            <FileText className="size-4 text-primary" /> Legal & policies
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
        {isAdmin && (
          <button
            className="flex w-full items-center justify-between p-4 text-left"
            onClick={() => navigate({ to: "/admin" })}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Shield className="size-4 text-primary" /> Admin panel
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <Button
        variant="outline"
        className="mt-4 w-full gap-2"
        onClick={async () => {
          await signOutEverywhere(queryClient);
          navigate({ to: "/auth", replace: true });
        }}
      >
        <LogOut className="size-4" /> Sign out
      </Button>
    </AppShell>
  );
}
