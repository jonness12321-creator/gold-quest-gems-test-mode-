import { ExternalLink, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * INTEGRATION POINT — offerwall networks.
 *
 * AdGem / OfferToro / Digital Turbine (Fyber) offerwalls need a native wrapper.
 * Each card below is a placeholder slot: swap `onOpen` for the SDK launch call
 * once the Capacitor shell is added.
 */
const NETWORKS = [
  { name: "AdGem", description: "Games & app installs" },
  { name: "OfferToro", description: "Surveys and sign-ups" },
  { name: "Digital Turbine", description: "Premium partner offers" },
  { name: "Torox", description: "Quick micro tasks" },
  { name: "Adscend", description: "Sign-up and trial offers" },
  { name: "Pollfish", description: "Paid survey panels" },
] as const;

export function OfferwallSlot({ limit }: { limit?: number }) {
  const networks = typeof limit === "number" ? NETWORKS.slice(0, limit) : NETWORKS;

  return (
    <div className="grid grid-cols-2 gap-3">
      {networks.map((network) => (
        <article key={network.name} className="surface-card flex flex-col gap-2 p-3">
          <span className="grid size-9 place-items-center rounded-xl bg-jade-gradient text-primary-foreground">
            <Layers className="size-4" />
          </span>
          <div>
            <p className="font-semibold leading-tight">{network.name}</p>
            <p className="text-xs text-muted-foreground">{network.description}</p>
          </div>
          <Button size="sm" variant="outline" className="mt-auto gap-1" disabled>
            Mobile app only <ExternalLink className="size-3.5" />
          </Button>
        </article>
      ))}
    </div>
  );
}
