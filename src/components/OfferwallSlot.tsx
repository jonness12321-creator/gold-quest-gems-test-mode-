import { ExternalLink, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * INTEGRATION POINT — offerwall networks.
 *
 * AdGem / OfferToro / Digital Turbine (Fyber) offerwalls need a native wrapper.
 * Each card below is a placeholder slot: swap `onOpen` for the SDK launch call
 * once the Capacitor shell is added.
 */
const NETWORKS = [
  { name: "AdGem", description: "Games & app installs", range: "$0.20 – $18.00" },
  { name: "OfferToro", description: "Surveys and sign-ups", range: "$0.10 – $12.00" },
  { name: "Digital Turbine", description: "Premium partner offers", range: "$0.50 – $25.00" },
  { name: "Torox", description: "Quick micro tasks", range: "$0.05 – $4.00" },
] as const;

export function OfferwallSlot() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {NETWORKS.map((network) => (
        <article key={network.name} className="surface-card flex flex-col gap-2 p-3">
          <span className="grid size-9 place-items-center rounded-xl bg-jade-gradient text-primary-foreground">
            <Layers className="size-4" />
          </span>
          <div>
            <p className="font-semibold leading-tight">{network.name}</p>
            <p className="text-xs text-muted-foreground">{network.description}</p>
          </div>
          <p className="text-amount text-sm text-gold-dark">{network.range}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-auto gap-1"
            onClick={() => toast.info(`${network.name} opens once the mobile app wrapper is installed.`)}
          >
            Open <ExternalLink className="size-3.5" />
          </Button>
        </article>
      ))}
    </div>
  );
}
