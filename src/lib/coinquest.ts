export const QUESTS = [
  { key: "starter_5", label: "5 Ads", ads: 5, reward: 1 },
  { key: "starter_25", label: "25 Ads", ads: 25, reward: 1 },
  { key: "starter_50", label: "50 Ads", ads: 50, reward: 1 },
] as const;

export type QuestKey = (typeof QUESTS)[number]["key"];

export const MIN_WITHDRAWAL = 5;
/** Minimum seconds a single rewarded video must run before the server accepts it. */
export const MIN_SECONDS_PER_AD = 5;
/** Fraud guard: max ads credited per user per rolling hour. */
export const MAX_ADS_PER_HOUR = 80;
/** Consecutive active days needed for a streak bonus. */
export const STREAK_GOAL = 7;
export const STREAK_BONUS = 1;
/** Credit paid to the referrer once their invitee finishes a first quest. */
export const REFERRAL_BONUS = 0.5;

export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
