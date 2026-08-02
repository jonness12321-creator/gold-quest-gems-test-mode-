import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { OfferwallSlot } from "@/components/OfferwallSlot";
import { SectionTitle } from "@/components/States";

export const Route = createFileRoute("/_authenticated/offers")({
  head: () => ({
    meta: [
      { title: "Offers — CoinQuest" },
      { name: "description", content: "Featured partner offers and offerwall networks." },
      { property: "og:title", content: "Offers — CoinQuest" },
      { property: "og:description", content: "Featured partner offers and offerwall networks." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  return (
    <AppShell subtitle="Offers">
      <h1 className="mt-2 text-2xl">Offers</h1>
      <p className="text-sm text-muted-foreground">Complete partner offers for bigger payouts.</p>

      <SectionTitle>Featured</SectionTitle>
      <FeaturedOffers />

      <SectionTitle>Offerwall</SectionTitle>
      <OfferwallSlot />
    </AppShell>
  );
}
