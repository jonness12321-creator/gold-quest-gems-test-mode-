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

export const adminDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { adminDashboardImpl } = await import("./offers/admin.server");
    return adminDashboardImpl();
  });

export const listAdminOffers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        source: z.enum(["all", "manual", "network"]).default("all"),
        search: z.string().trim().max(80).optional(),
        status: z.enum(["all", "active", "inactive", "featured", "expired"]).default("all"),
        providerId: z.string().uuid().optional(),
        country: z.string().trim().max(4).optional(),
        limit: z.number().int().min(1).max(200).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listAdminOffersImpl } = await import("./offers/admin.server");
    return listAdminOffersImpl(data);
  });

export const saveManualOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(2).max(120),
        description: z.string().trim().max(600).default(""),
        requirements: z.string().trim().max(600).default(""),
        icon: z.string().trim().max(300).default("gift"),
        rewardAmount: z.number().min(0).max(10000),
        networkPayout: z.number().min(0).max(10000).nullable().optional(),
        clickUrl: z.string().trim().url().max(1000).nullable().optional(),
        countries: z.array(z.string().trim().min(2).max(3)).max(60).default([]),
        devices: z.array(z.string().trim().max(20)).max(10).default([]),
        expiresAt: z.string().datetime().nullable().optional(),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        sortOrder: z.number().int().min(0).max(9999).default(0),
        adminPriority: z.number().int().min(0).max(9999).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { upsertManualOfferImpl } = await import("./offers/admin.server");
    return upsertManualOfferImpl(data);
  });

export const deleteManualOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { deleteManualOfferImpl } = await import("./offers/admin.server");
    return deleteManualOfferImpl(data.id);
  });

export const updateOfferControls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        adminPriority: z.number().int().min(0).max(9999).optional(),
        sortOrder: z.number().int().min(0).max(9999).optional(),
        rewardAmount: z.number().min(0).max(10000).optional(),
        revenueShare: z.number().min(0).max(1).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { updateOfferControlsImpl } = await import("./offers/admin.server");
    return updateOfferControlsImpl(data);
  });
