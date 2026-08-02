import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().max(80).optional(),
        phone: z.string().trim().max(30).optional(),
        referralCode: z.string().trim().max(20).optional(),
        deviceId: z.string().trim().max(64).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { ensureProfileImpl } = await import("./coinquest.server");
    return ensureProfileImpl({
      userId: context.userId,
      email: (context.claims["email"] as string | undefined) ?? null,
      ...data,
    });
  });

export const startQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ questKey: z.string().max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    const { startQuestImpl } = await import("./coinquest.server");
    return startQuestImpl(context.userId, data.questKey);
  });

export const reportAdWatched = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { reportAdImpl } = await import("./coinquest.server");
    return reportAdImpl(context.userId, data.sessionId);
  });

export const completeTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ taskId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { completeTaskImpl } = await import("./coinquest.server");
    return completeTaskImpl(context.userId, data.taskId);
  });

export const createWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ amount: z.number().positive().max(100000), payoutMethodId: z.string().uuid() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { createWithdrawalImpl } = await import("./coinquest.server");
    return createWithdrawalImpl(context.userId, data.amount, data.payoutMethodId);
  });

export const cancelWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { cancelWithdrawalImpl } = await import("./coinquest.server");
    return cancelWithdrawalImpl(context.userId, data.id);
  });

export const submitKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ fullName: z.string().trim().min(3).max(120), idNumber: z.string().trim().min(4).max(40) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { submitKycImpl } = await import("./coinquest.server");
    return submitKycImpl(context.userId, data.fullName, data.idNumber);
  });

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, adminOverviewImpl } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    return adminOverviewImpl();
  });

export const adminUpdateWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected", "paid"]),
        note: z.string().trim().max(300).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, adminUpdateWithdrawalImpl } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    return adminUpdateWithdrawalImpl(data.id, data.status, data.note ?? null);
  });

export const adminUpdateKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(300).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, adminUpdateKycImpl } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    return adminUpdateKycImpl(data.id, data.status, data.note ?? null);
  });
