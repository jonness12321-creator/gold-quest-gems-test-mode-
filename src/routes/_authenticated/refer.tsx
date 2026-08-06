import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Share2, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState, SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/coinquest";

export const Route = createFileRoute("/_authenticated/refer")({
  head: () => ({
    meta: [
      { title: "Refer & earn — CoinQuest" },
      { name: "description", content: "Invite friends to CoinQuest and earn bonus credit." },
      { property: "og:title", content: "Refer & earn — CoinQuest" },
      { property: "og:description", content: "Invite friends to CoinQuest and earn bonus credit." },
    ],
  }),
  component: ReferPage,
});

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

  return (
    <AppShell subtitle="Refer">
      <section className="rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <h1 className="text-2xl">Invite friends, earn more</h1>
        <p className="mt-1 text-sm opacity-80">
          You earn {formatMoney(REFERRAL_BONUS)} once a friend finishes their first quest.
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

      <SectionTitle>Your referrals</SectionTitle>
      {!referrals.data?.length ? (
        <EmptyState
          icon={Users}
          title="No referrals yet"
          description="Share your code — bonuses appear here once friends join."
        />
      ) : (
        <ul className="space-y-2">
          {referrals.data.map((referral) => (
            <li key={referral.id} className="surface-card flex items-center justify-between p-3">
              <div>
                <p className="font-semibold capitalize">{referral.status}</p>
                <p className="text-xs text-muted-foreground">{formatDate(referral.created_at)}</p>
              </div>
              <span className="text-amount text-gold-dark">{formatMoney(referral.bonus_amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
