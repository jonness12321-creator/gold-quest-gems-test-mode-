import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  KYC_THRESHOLD,
  MAX_ADS_PER_HOUR,
  MIN_SECONDS_PER_AD,
  MIN_WITHDRAWAL,
  QUESTS,
} from "./coinquest";

function code(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 7; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return `CQ${out}`;
}

async function notify(userId: string, title: string, body: string, kind = "info") {
  await supabaseAdmin.from("notifications").insert({ user_id: userId, title, body, kind });
}

export async function ensureProfileImpl(input: {
  userId: string;
  email: string | null;
  name?: string | undefined;
  phone?: string | undefined;
  referralCode?: string | undefined;
  deviceId?: string | undefined;
}) {
  const existing = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", input.userId)
    .maybeSingle();

  if (existing.data) {
    const patch: { name?: string; device_id?: string } = {};
    if (input.name && !existing.data.name) patch.name = input.name;
    if (input.deviceId && !existing.data.device_id) patch.device_id = input.deviceId;
    if (Object.keys(patch).length) {
      await supabaseAdmin.from("profiles").update(patch).eq("id", input.userId);
    }
    return { ...existing.data, ...patch };
  }


  // one-account-per-device: flag rather than block, admins review
  let flagged = false;
  if (input.deviceId) {
    const dupes = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("device_id", input.deviceId)
      .limit(1);
    flagged = Boolean(dupes.data?.length);
  }

  let referralCode = code();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const clash = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!clash.data) break;
    referralCode = code();
  }

  let referrerId: string | null = null;
  const referredBy = input.referralCode?.trim().toUpperCase() || null;
  if (referredBy) {
    const ref = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", referredBy)
      .maybeSingle();
    referrerId = ref.data?.id ?? null;
  }

  const inserted = await supabaseAdmin
    .from("profiles")
    .insert({
      id: input.userId,
      name: input.name ?? "",
      email: input.email,
      phone: input.phone ?? null,
      referral_code: referralCode,
      referred_by: referrerId ? referredBy : null,
      device_id: input.deviceId ?? null,
      is_flagged: flagged,
    })
    .select("*")
    .single();

  if (inserted.error) throw new Error("Could not create your profile. Please try again.");

  if (referrerId) {
    await supabaseAdmin.from("referrals").insert({
      referrer_id: referrerId,
      referred_id: input.userId,
      code: referredBy!,
      bonus_amount: 0.5,
      status: "pending",
    });
    await notify(referrerId, "New referral joined", "A friend signed up with your code.", "referral");
  }

  await notify(
    input.userId,
    "Welcome to CoinQuest",
    "Complete your first starter quest to earn your first $1.00.",
    "welcome",
  );

  return inserted.data;
}

async function creditWallet(userId: string, amount: number, source: string, description: string) {
  const profile = await supabaseAdmin
    .from("profiles")
    .select("wallet_balance, lifetime_earned")
    .eq("id", userId)
    .single();
  if (profile.error) throw new Error("Wallet unavailable.");
  await supabaseAdmin
    .from("profiles")
    .update({
      wallet_balance: Number(profile.data.wallet_balance) + amount,
      lifetime_earned: Number(profile.data.lifetime_earned) + amount,
    })
    .eq("id", userId);
  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: userId,
    source,
    description,
    amount,
    kind: "earned",
    status: "completed",
  });
}

export async function startQuestImpl(userId: string, questKey: string) {
  const quest = QUESTS.find((q) => q.key === questKey);
  if (!quest) throw new Error("Unknown quest.");

  const open = await supabaseAdmin
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    .maybeSingle();
  if (open.data) return open.data;

  const created = await supabaseAdmin
    .from("quest_sessions")
    .insert({
      user_id: userId,
      quest_key: quest.key,
      ads_required: quest.ads,
      reward_amount: quest.reward,
    })
    .select("*")
    .single();
  if (created.error) throw new Error("Could not start this quest.");
  return created.data;
}

export async function reportAdImpl(userId: string, sessionId: string) {
  const session = await supabaseAdmin
    .from("quest_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();
  if (session.error || !session.data) throw new Error("Quest session not found.");
  if (session.data.status !== "started") throw new Error("This quest is already finished.");

  const nextCount = session.data.ads_watched + 1;

  // Server-side timing check: the elapsed wall clock must plausibly fit the ads.
  const elapsedSeconds = (Date.now() - new Date(session.data.started_at).getTime()) / 1000;
  if (elapsedSeconds < nextCount * MIN_SECONDS_PER_AD) {
    throw new Error("Ad was not watched long enough to count.");
  }

  // Rolling-hour rate limit across all sessions.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const recent = await supabaseAdmin
    .from("quest_sessions")
    .select("ads_watched")
    .eq("user_id", userId)
    .gte("started_at", hourAgo);
  const recentAds = (recent.data ?? []).reduce((sum, r) => sum + r.ads_watched, 0);
  if (recentAds >= MAX_ADS_PER_HOUR) {
    throw new Error("You've hit the hourly limit. Try again a little later.");
  }

  const done = nextCount >= session.data.ads_required;
  const updated = await supabaseAdmin
    .from("quest_sessions")
    .update({
      ads_watched: nextCount,
      status: done ? "verified" : "started",
      verified_at: done ? new Date().toISOString() : null,
    })
    .eq("id", sessionId)
    .select("*")
    .single();
  if (updated.error) throw new Error("Could not record that ad.");

  if (done) {
    const reward = Number(session.data.reward_amount);
    await creditWallet(
      userId,
      reward,
      "quest",
      `Starter quest — ${session.data.ads_required} ads`,
    );
    await supabaseAdmin
      .from("quest_sessions")
      .update({ status: "credited", credited_at: new Date().toISOString() })
      .eq("id", sessionId);
    await notify(userId, "Quest completed", `You earned $${reward.toFixed(2)}.`, "quest");
    return { ...updated.data, status: "credited", credited: true };
  }

  return { ...updated.data, credited: false };
}

export async function completeTaskImpl(userId: string, taskId: string) {
  const task = await supabaseAdmin.from("tasks").select("*").eq("id", taskId).single();
  if (task.error || !task.data?.is_active) throw new Error("Task unavailable.");

  const existing = await supabaseAdmin
    .from("user_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .maybeSingle();
  if (existing.data?.status === "completed") throw new Error("Task already completed.");

  const progress = Math.min((existing.data?.progress ?? 0) + 1, task.data.steps_total);
  const completed = progress >= task.data.steps_total;

  await supabaseAdmin.from("user_tasks").upsert(
    {
      user_id: userId,
      task_id: taskId,
      progress,
      status: completed ? "completed" : "active",
    },
    { onConflict: "user_id,task_id" },
  );

  if (completed) {
    const reward = Number(task.data.reward);
    await creditWallet(userId, reward, "task", task.data.title);
    await notify(userId, "Task completed", `${task.data.title} — $${reward.toFixed(2)} added.`, "task");
  }
  return { progress, completed };
}

export async function createWithdrawalImpl(
  userId: string,
  amount: number,
  payoutMethodId: string,
) {
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}.`);
  }
  const profile = await supabaseAdmin
    .from("profiles")
    .select("wallet_balance, held_balance, kyc_status")
    .eq("id", userId)
    .single();
  if (profile.error) throw new Error("Wallet unavailable.");

  const available = Number(profile.data.wallet_balance) - Number(profile.data.held_balance);
  if (amount > available) throw new Error("That's more than your available balance.");
  if (amount >= KYC_THRESHOLD && profile.data.kyc_status !== "verified") {
    throw new Error("Identity verification is required for this amount.");
  }

  const method = await supabaseAdmin
    .from("payout_methods")
    .select("id")
    .eq("id", payoutMethodId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!method.data) throw new Error("Choose a valid payout method.");

  const created = await supabaseAdmin
    .from("withdrawal_requests")
    .insert({ user_id: userId, amount, payout_method_id: payoutMethodId })
    .select("*")
    .single();
  if (created.error) throw new Error("Could not submit that withdrawal.");

  await supabaseAdmin
    .from("profiles")
    .update({ held_balance: Number(profile.data.held_balance) + amount })
    .eq("id", userId);

  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: userId,
    source: "withdrawal",
    description: "Withdrawal request",
    amount: -amount,
    kind: "withdrawn",
    status: "pending",
    reference_id: created.data.id,
  });

  await notify(userId, "Withdrawal submitted", `$${amount.toFixed(2)} is pending review.`, "wallet");
  return created.data;
}

export async function cancelWithdrawalImpl(userId: string, id: string) {
  const req = await supabaseAdmin
    .from("withdrawal_requests")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (req.error || req.data.status !== "pending") throw new Error("This request can't be cancelled.");

  await supabaseAdmin.from("withdrawal_requests").update({ status: "cancelled" }).eq("id", id);
  const profile = await supabaseAdmin
    .from("profiles")
    .select("held_balance")
    .eq("id", userId)
    .single();
  await supabaseAdmin
    .from("profiles")
    .update({
      held_balance: Math.max(0, Number(profile.data?.held_balance ?? 0) - Number(req.data.amount)),
    })
    .eq("id", userId);
  await supabaseAdmin
    .from("wallet_transactions")
    .update({ status: "failed", description: "Withdrawal cancelled" })
    .eq("reference_id", id);
  return { ok: true };
}

export async function submitKycImpl(userId: string, fullName: string, idNumber: string) {
  if (fullName.trim().length < 3 || idNumber.trim().length < 4) {
    throw new Error("Please enter your full name and a valid ID number.");
  }
  await supabaseAdmin.from("kyc_submissions").insert({
    user_id: userId,
    full_name: fullName.trim(),
    id_number: idNumber.trim(),
  });
  await supabaseAdmin.from("profiles").update({ kyc_status: "pending" }).eq("id", userId);
  return { ok: true };
}

type RoleRpcClient = {
  rpc: (
    fn: "has_role",
    args: { _user_id: string; _role: "admin" },
  ) => PromiseLike<{ data: unknown }>;
};

export async function assertAdmin(supabase: RoleRpcClient, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

export async function adminUpdateWithdrawalImpl(id: string, status: string, note: string | null) {
  const req = await supabaseAdmin.from("withdrawal_requests").select("*").eq("id", id).single();
  if (req.error) throw new Error("Request not found.");
  await supabaseAdmin
    .from("withdrawal_requests")
    .update({ status, admin_note: note })
    .eq("id", id);

  const profile = await supabaseAdmin
    .from("profiles")
    .select("wallet_balance, held_balance, lifetime_withdrawn")
    .eq("id", req.data.user_id)
    .single();
  const amount = Number(req.data.amount);

  if (status === "paid") {
    await supabaseAdmin
      .from("profiles")
      .update({
        wallet_balance: Number(profile.data?.wallet_balance ?? 0) - amount,
        held_balance: Math.max(0, Number(profile.data?.held_balance ?? 0) - amount),
        lifetime_withdrawn: Number(profile.data?.lifetime_withdrawn ?? 0) + amount,
      })
      .eq("id", req.data.user_id);
    await supabaseAdmin
      .from("wallet_transactions")
      .update({ status: "completed", description: "Withdrawal paid" })
      .eq("reference_id", id);
    await notify(req.data.user_id, "Withdrawal approved", `$${amount.toFixed(2)} has been paid out.`, "wallet");
  } else if (status === "rejected") {
    await supabaseAdmin
      .from("profiles")
      .update({ held_balance: Math.max(0, Number(profile.data?.held_balance ?? 0) - amount) })
      .eq("id", req.data.user_id);
    await supabaseAdmin
      .from("wallet_transactions")
      .update({ status: "failed", description: "Withdrawal rejected" })
      .eq("reference_id", id);
    await notify(req.data.user_id, "Withdrawal rejected", note ?? "Please contact support.", "wallet");
  }
  return { ok: true };
}

export async function adminUpdateKycImpl(id: string, status: string, note: string | null) {
  const row = await supabaseAdmin.from("kyc_submissions").select("*").eq("id", id).single();
  if (row.error) throw new Error("Submission not found.");
  await supabaseAdmin.from("kyc_submissions").update({ status, admin_note: note }).eq("id", id);
  await supabaseAdmin
    .from("profiles")
    .update({ kyc_status: status === "approved" ? "verified" : status })
    .eq("id", row.data.user_id);
  await notify(
    row.data.user_id,
    status === "approved" ? "Identity verified" : "Identity check rejected",
    note ?? "",
    "kyc",
  );
  return { ok: true };
}

export async function adminOverviewImpl() {
  const [withdrawals, kyc, tickets, flagged] = await Promise.all([
    supabaseAdmin
      .from("withdrawal_requests")
      .select("*, profiles:user_id(name, email)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("kyc_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("profiles")
      .select("id, name, email, device_id, is_flagged, created_at")
      .eq("is_flagged", true)
      .limit(100),
  ]);
  return {
    withdrawals: withdrawals.data ?? [],
    kyc: kyc.data ?? [],
    tickets: tickets.data ?? [],
    flagged: flagged.data ?? [],
  };
}
