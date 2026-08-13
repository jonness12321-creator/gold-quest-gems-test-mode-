import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-only API surface for future Providers / Network offer management screens. */

export const listOfferProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listProvidersImpl } = await import("./offers/sync.server");
    return listProvidersImpl();
  });

export const upsertOfferProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(80),
        slug: z
          .string()
          .trim()
          .min(1)
          .max(40)
          .regex(/^[a-z0-9-]+$/),
        providerType: z.enum(["offerwall", "cpa", "cpi", "survey", "other"]),
        enabled: z.boolean().default(false),
        syncConfig: z.record(z.string(), z.unknown()).default({}),
        defaultRevenueShare: z.number().min(0).max(1).default(0.6),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { upsertProviderImpl } = await import("./offers/sync.server");
    return upsertProviderImpl(data);
  });

export const syncOfferProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ providerId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { syncProviderImpl } = await import("./offers/sync.server");
    return syncProviderImpl(data.providerId);
  });
