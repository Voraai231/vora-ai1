import { db, hasFirebaseConfig } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";

/**
 * Frontend-only LemonSqueezy unlock flow:
 *   1. User clicks "Upgrade" → opens LemonSqueezy hosted checkout in new tab
 *   2. After payment, LemonSqueezy emails the license key + redirects to /upgrade-success
 *   3. We call LemonSqueezy's public licenses/validate endpoint (no API key required —
 *      it accepts the license key as the body and returns the variant info)
 *   4. On success we write the entitlement to Firestore so the tier persists across devices
 *
 * Configure these envs in Replit Secrets (all optional — UI gracefully degrades):
 *   VITE_LEMON_PRO_URL       — LemonSqueezy buy link for the Pro subscription
 *   VITE_LEMON_LIFETIME_URL  — LemonSqueezy buy link for the Lifetime product
 *   VITE_LEMON_PRO_VARIANT_IDS      — comma-separated variant IDs that grant Pro
 *   VITE_LEMON_LIFETIME_VARIANT_IDS — comma-separated variant IDs that grant Lifetime
 */

export const LEMON_PRO_URL = (import.meta.env.VITE_LEMON_PRO_URL as string | undefined) || "";
export const LEMON_LIFETIME_URL = (import.meta.env.VITE_LEMON_LIFETIME_URL as string | undefined) || "";

const PRO_VARIANTS = ((import.meta.env.VITE_LEMON_PRO_VARIANT_IDS as string | undefined) || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const LIFETIME_VARIANTS = ((import.meta.env.VITE_LEMON_LIFETIME_VARIANT_IDS as string | undefined) || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export interface LicenseValidationResult {
  valid: boolean;
  tier: "pro" | "billionaire" | null;
  variantId: string | null;
  variantName: string | null;
  productName: string | null;
  customerEmail: string | null;
  expiresAt: string | null;
  raw?: any;
  error?: string;
}

/** Hits LemonSqueezy's public license-validation endpoint. */
export async function validateLicenseKey(licenseKey: string): Promise<LicenseValidationResult> {
  const key = (licenseKey || "").trim();
  if (!key) return { valid: false, tier: null, variantId: null, variantName: null, productName: null, customerEmail: null, expiresAt: null, error: "Empty license key" };

  try {
    const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ license_key: key }).toString(),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.valid) {
      return {
        valid: false,
        tier: null,
        variantId: null,
        variantName: null,
        productName: null,
        customerEmail: null,
        expiresAt: null,
        raw: data,
        error: data?.error || `License is not valid (${res.status})`,
      };
    }

    const variantId = String(data?.meta?.variant_id ?? "");
    const tier: "pro" | "billionaire" | null = LIFETIME_VARIANTS.includes(variantId)
      ? "billionaire"
      : PRO_VARIANTS.includes(variantId)
      ? "pro"
      // If the operator hasn't configured variant IDs, default to "pro" so the unlock still works.
      : (PRO_VARIANTS.length === 0 && LIFETIME_VARIANTS.length === 0 ? "pro" : null);

    return {
      valid: true,
      tier,
      variantId,
      variantName: data?.meta?.variant_name ?? null,
      productName: data?.meta?.product_name ?? null,
      customerEmail: data?.meta?.customer_email ?? null,
      expiresAt: data?.license_key?.expires_at ?? null,
      raw: data,
    };
  } catch (err: any) {
    return { valid: false, tier: null, variantId: null, variantName: null, productName: null, customerEmail: null, expiresAt: null, error: err?.message || "Network error" };
  }
}

/** Persists the granted entitlement to Firestore for the signed-in user. */
export async function recordLicenseEntitlement(user: User, key: string, result: LicenseValidationResult): Promise<void> {
  if (!hasFirebaseConfig || !result.valid || !result.tier) return;
  const billing = doc(db, "users", user.uid, "billing", "current");
  await setDoc(
    billing,
    {
      tier: result.tier,
      licenseKey: key,
      provider: "lemonsqueezy",
      variantId: result.variantId,
      productName: result.productName,
      customerEmail: result.customerEmail,
      validatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // Mirror into a top-level `payments` collection for owner revenue dashboard.
  const payment = doc(db, "payments", `${user.uid}_${result.variantId || "unknown"}`);
  await setDoc(
    payment,
    {
      uid: user.uid,
      email: user.email || result.customerEmail || "",
      tier: result.tier,
      licenseKey: key,
      variantId: result.variantId,
      productName: result.productName,
      validatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Returns the existing license key persisted for this user, if any. */
export async function getStoredLicense(user: User): Promise<string | null> {
  if (!hasFirebaseConfig) return null;
  const billing = doc(db, "users", user.uid, "billing", "current");
  const snap = await getDoc(billing);
  return (snap.exists() && (snap.data().licenseKey as string)) || null;
}

export function buildCheckoutUrl(baseUrl: string, user: { uid?: string; email?: string | null } | null): string {
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    if (user?.email) url.searchParams.set("checkout[email]", user.email);
    if (user?.uid) url.searchParams.set("checkout[custom][uid]", user.uid);
    // Send the buyer back to /upgrade-success after successful purchase.
    const redirect = `${window.location.origin}/upgrade-success`;
    url.searchParams.set("checkout[success_url]", redirect);
    return url.toString();
  } catch {
    return baseUrl;
  }
}
