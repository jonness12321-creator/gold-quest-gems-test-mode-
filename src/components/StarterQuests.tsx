import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Play, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { QUESTS, formatMoney } from "@/lib/coinquest";
import { playRewardedAd } from "@/lib/ads";
import { reportAdWatched, startQuest } from "@/lib/coinquest.functions";

function Dial({ value, total }: { value: number; total: number }) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 64 64" className="size-16">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--muted)" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--mint)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (circumference * pct) / 100}
        transform="rotate(-90 32 32)"
        style={{ transition: "stroke-dashoffset 400ms ease" }}
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        className="text-amount"
        fontSize="15"
        fill="var(--foreground)"
      >
        {value}/{total}
      </text>
    </svg>
  );
}

export function StarterQuests() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const start = useServerFn(startQuest);
  const report = useServerFn(reportAdWatched);

  const sessions = useQuery({
    queryKey: ["quest-sessions", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("quest_sessions")
        .select("*")
        .order("started_at", { ascending: false });
      return data ?? [];
    },
  });

  const run = useMutation({
    mutationFn: async (questKey: string) => {
      const questSession = await start({ data: { questKey } });
      // INTEGRATION POINT: replace with the native rewarded-ad bridge.
      const result = await playRewardedAd();
      if (!result.completed) throw new Error("Ad was closed early.");
      // The wallet is credited only after the server verifies this session.
      return report({ data: { sessionId: questSession.id } });
    },
    onSuccess: (result) => {
      if (result.credited) toast.success("Quest complete — wallet credited!");
      else toast.success("Ad verified. Keep going!");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || "That ad couldn't be verified."),
    onSettled: () => setBusy(null),
  });

  return (
    <div className="grid grid-cols-3 gap-3">
      {QUESTS.map((quest) => {
        const active = sessions.data?.find(
          (s) => s.quest_key === quest.key && s.status === "started",
        );
        const credited = sessions.data?.some(
          (s) => s.quest_key === quest.key && s.status === "credited",
        );
        const watched = active?.ads_watched ?? (credited ? quest.ads : 0);
        const isBusy = busy === quest.key;
        return (
          <article
            key={quest.key}
            className="surface-card flex flex-col items-center gap-2 p-3 text-center"
          >
            <Dial value={watched} total={quest.ads} />
            <p className="text-xs font-semibold">{quest.label}</p>
            <p className="text-amount text-sm text-gold-dark">{formatMoney(quest.reward)}</p>
            <Button
              size="sm"
              variant={credited ? "outline" : "gold"}
              className="w-full gap-1"
              disabled={isBusy || credited}
              onClick={() => {
                setBusy(quest.key);
                run.mutate(quest.key);
              }}
            >
              {credited ? (
                <>
                  <Check className="size-3.5" /> Done
                </>
              ) : isBusy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Ad
                </>
              ) : (
                <>
                  <Play className="size-3.5" /> Watch
                </>
              )}
            </Button>
          </article>
        );
      })}
    </div>
  );
}
