import { registerPlugin } from "@capacitor/core";

interface AppodealPlugin {
  isRewardedVideoLoaded(): Promise<{ loaded: boolean }>;
  showRewardedVideo(): Promise<{ rewarded: boolean; amount?: number; currency?: string }>;
}

const Appodeal = registerPlugin<AppodealPlugin>("Appodeal");

/**
 * INTEGRATION POINT — rewarded video ads.
 *
 * Wired to the native Appodeal SDK via a custom Capacitor plugin (see
 * android/.../AppodealPlugin.java). Falls back to `completed: false` when
 * running in a plain browser (no native bridge) or when no ad is ready.
 *
 * The wallet is NEVER credited from here — the client only reports that an ad
 * finished; the server verifies session timing and rate limits before crediting.
 */
export type AdResult = { completed: boolean; provider: string };

export async function playRewardedAd(): Promise<AdResult> {
  try {
    const { loaded } = await Appodeal.isRewardedVideoLoaded();
    if (!loaded) return { completed: false, provider: "appodeal" };
    const result = await Appodeal.showRewardedVideo();
    return { completed: result.rewarded, provider: "appodeal" };
  } catch {
    // Not running inside the native app (no bridge available)
    return { completed: false, provider: "appodeal" };
  }
}

/** Stable-ish device fingerprint used for the one-account-per-device rule. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "coinquest.device_id";
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const seed = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(new Date().getTimezoneOffset()),
    Math.random().toString(36).slice(2),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const id = `dev_${Math.abs(hash).toString(36)}`;
  window.localStorage.setItem(KEY, id);
  return id;
}
