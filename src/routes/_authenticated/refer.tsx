import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Share2, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState, SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  REFERRAL_MAX_BONUS,
  REFERRAL_MILESTONE_BONUS,
  formatDate,
  formatMoney,
} from "@/lib/coinquest";

export const Route = createFileRoute("/_authenticated/refer")({
  head: () => ({
    meta: [
      { title: "Refer & earn — CoinQuest" },
      { name: "description", content: "Invite friends to CoinQuest and earn up to $3 per friend." },
      { property: "og:title", content: "Refer & earn — CoinQuest" },
      {
        property: "og:description",
        content: "Invite friends to CoinQuest and earn up to $3 per friend.",
      },
    ],
  }),
  component: ReferPage,
});

const MILESTONES = [
  {
    key: "signup_credited_at",
    emoji: "🎉",
    label: "Friend signs up",
    detail: "Credited when they successfully sign up with your code",
  },
  {
    key: "earning_credited_at",
    emoji: "🎯",
    label: "Friend completes their first Task, Offer or Quest",
    detail: "Any qualifying first earning from a Task, Offer or Quest counts",
  },
  {
    key: "withdrawal_credited_at",
    emoji: "💸",
    label: "Friend completes their first withdrawal",
    detail: "Earned when they successfully complete their first withdrawal",
  },
] as const;

function ReferPage() {
  const { session, profile } = useAuth();
  const code = profile?.referral_code ?? "";
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/auth?ref=${code}`;

  const referrals = useQuery({
    queryKey: ["referrals", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const mine = referrals.data?.filter((r) => r.referrer_id === session?.user.id) ?? [];

  return (
    <AppShell subtitle="Refer">
      <section className="rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <h1 className="text-2xl">Invite friends, earn more</h1>
        <p className="mt-1 text-sm opacity-80">
          Earn up to {formatMoney(REFERRAL_MAX_BONUS)} per friend.
        </p>
        <p className="text-amount mt-4 rounded-2xl bg-primary-foreground/10 px-4 py-3 text-center text-2xl tracking-widest">
          {code || "—"}
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="gold"
            className="flex-1 gap-2"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              toast.success("Invite link copied");
            }}
          >
            <Copy className="size-4" /> Copy link
          </Button>
          <Button
            variant="mint"
            className="flex-1 gap-2"
            onClick={async () => {
              if (navigator.share) await navigator.share({ title: "CoinQuest", url: link });
              else {
                await navigator.clipboard.writeText(link);
                toast.success("Invite link copied");
              }
            }}
          >
            <Share2 className="size-4" /> Share
          </Button>
        </div>
      </section>

      <SectionTitle>How you earn {formatMoney(REFERRAL_MAX_BONUS)}</SectionTitle>
      <ul className="space-y-2">
        {MILESTONES.map((milestone, index) => (
          <li key={milestone.key} className="surface-card flex items-center gap-3 p-3">
            <span className="text-xl">{milestone.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold">
                {index === 0 ? "" : "+"}
                {formatMoney(REFERRAL_MILESTONE_BONUS)} — {milestone.label}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <SectionTitle>Your referrals</SectionTitle>
      {!mine.length ? (
        <EmptyState
          icon={Users}
          title="No referrals yet"
          description="Share your code — bonuses appear here once friends join."
        />
      ) : (
        <ul className="space-y-2">
          {mine.map((referral) => (
            <li key={referral.id} className="surface-card space-y-2 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Joined {formatDate(referral.created_at)}
                </p>
                <span className="text-amount text-gold-dark">
                  {formatMoney(referral.bonus_amount)} / {formatMoney(REFERRAL_MAX_BONUS)}
                </span>
              </div>
              <ul className="space-y-1">
                {MILESTONES.map((milestone) => {
                  const done = Boolean(referral[milestone.key]);
                  return (
                    <li
                      key={milestone.key}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{milestone.emoji}</span>
                        {milestone.label}
                      </span>
                      <span
                        className={
                          done
                            ? "rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary"
                            : "rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground"
                        }
                      >
                        {done ? `Completed · ${formatMoney(REFERRAL_MILESTONE_BONUS)}` : "Pending"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>Terms & conditions</SectionTitle>
      <details className="surface-card p-3">
        <summary className="cursor-pointer text-sm font-semibold">
          Referral terms & conditions
        </summary>
        <div className="mt-2 space-y-2 text-xs text-muted-foreground">
          <p>
            Each referred friend can earn you up to {formatMoney(REFERRAL_MAX_BONUS)} in total —
            {" "}
            {formatMoney(REFERRAL_MILESTONE_BONUS)} per milestone, credited once per referral.
          </p>
          <p>
            Complete all 3 milestones within 1 year of your friend's signup to keep the referral
            rewards. If your referred friend does not complete their first withdrawal within 1 year
            of their signup, the first two {formatMoney(REFERRAL_MILESTONE_BONUS)} referral rewards
            credited for that referral will be reversed/removed from the referrer's balance.
          </p>
          <p>
            Self-referrals, duplicate accounts and fraudulent activity void all referral rewards.
          </p>
        </div>
      </details>
    </AppShell>
  );
}

