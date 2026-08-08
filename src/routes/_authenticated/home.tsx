import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Flame, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { OfferwallSlot } from "@/components/OfferwallSlot";
import { StarterQuests } from "@/components/StarterQuests";
import { SectionTitle } from "@/components/States";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — CoinQuest" },
      { name: "description", content: "Your daily quests, featured offers and streak bonus." },
      { property: "og:title", content: "Home — CoinQuest" },
      { property: "og:description", content: "Your daily quests, featured offers and streak bonus." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (profile && !profile.onboarded) void navigate({ to: "/onboarding", replace: true });
  }, [profile, navigate]);
  const streak = profile?.streak_count ?? 0;
  const goal = 7;

  return (
    <AppShell subtitle="Earn as you go">
      <section className="rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <p className="text-sm opacity-80">Welcome back{profile?.name ? `, ${profile.name}` : ""}</p>
        <h1 className="mt-1 text-2xl">Let's earn today</h1>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Flame className="size-4 text-gold" />
          <span className="font-semibold">{streak} day streak</span>
          <span className="opacity-70">· {Math.max(0, goal - streak)} to bonus</span>
        </div>
        <Progress value={(Math.min(streak, goal) / goal) * 100} className="mt-2 h-2 bg-primary-foreground/20" />
      </section>

      <SectionTitle>Starter Quests</SectionTitle>
      <StarterQuests />

      <SectionTitle>Featured Offers</SectionTitle>
      <FeaturedOffers limit={9} />
      <div className="mt-3 flex justify-center">
        <Link
          to="/featured"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          View All
        </Link>
      </div>

      <SectionTitle>
        <span className="flex items-center gap-2">
          Offerwall <Sparkles className="size-4 text-gold-dark" />
        </span>
      </SectionTitle>
      <OfferwallSlot limit={6} />
      <div className="mt-3 flex justify-center">
        <Link
          to="/offerwall"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          View All
        </Link>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Partner networks activate in the mobile app.
      </p>
    </AppShell>
  );
}
