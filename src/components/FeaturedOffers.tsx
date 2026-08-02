import { ArrowUpRight, Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/States";
import { formatMoney } from "@/lib/coinquest";
import { useOffers } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedOffers({ featuredOnly = true }: { featuredOnly?: boolean }) {
  const { data, isLoading, isError, refetch } = useOffers(featuredOnly);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data?.length) {
    return (
      <EmptyState
        icon={Gift}
        title="No offers available right now"
        description="Check back soon — new partner offers land every day."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((offer) => (
        <li key={offer.id} className="surface-card flex items-center gap-3 p-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-background-alt">
            <Gift className="size-5 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{offer.title}</p>
            <p className="truncate text-xs text-muted-foreground">{offer.description}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{offer.requirements}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-amount text-gold-dark">{formatMoney(offer.reward_amount)}</span>
            <Button size="sm" variant="mint" className="gap-1">
              Start <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
