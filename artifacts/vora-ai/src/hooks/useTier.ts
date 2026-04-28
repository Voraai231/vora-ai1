import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, hasFirebaseConfig } from "@/lib/firebase";

/**
 * Internal tier values are kept stable for backwards compatibility:
 *   "starter"     ⇄ Free
 *   "pro"         ⇄ Pro ($12/mo)
 *   "billionaire" ⇄ Lifetime ($99 one-time)
 */
export type Tier = "starter" | "pro" | "billionaire";

export const TIER_LABEL: Record<Tier, string> = {
  starter: "Free",
  pro: "Pro",
  billionaire: "Lifetime",
};

export const FREE_PROJECT_LIMIT = 2;

export function useTier() {
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier>("starter");
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    if (!user) {
      const localTier = (typeof window !== "undefined" && (localStorage.getItem("vora.tier") as Tier)) || "starter";
      setTier(localTier);
      setLoading(false);
      return;
    }
    if (!hasFirebaseConfig) {
      setTier("starter");
      setLoading(false);
      return;
    }
    try {
      const docRef = doc(db, "users", user.uid, "billing", "current");
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setTier((snapshot.data().tier as Tier) || "starter");
      } else {
        setTier("starter");
      }
    } catch (err) {
      console.error("Error fetching tier", err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { fetchTier(); }, [fetchTier]);

  // Daily-active-users heartbeat — touch the user doc every login.
  useEffect(() => {
    if (!user || !hasFirebaseConfig) return;
    const userRef = doc(db, "users", user.uid);
    setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        lastSeenAt: serverTimestamp(),
      },
      { merge: true },
    ).catch(() => {});
  }, [user?.uid]);

  const upgrade = async (newTier: Tier) => {
    if (!user) {
      try { localStorage.setItem("vora.tier", newTier); } catch {}
      setTier(newTier);
      return;
    }
    if (hasFirebaseConfig) {
      try {
        const docRef = doc(db, "users", user.uid, "billing", "current");
        await setDoc(docRef, { tier: newTier, upgradedAt: serverTimestamp() }, { merge: true });
        setTier(newTier);
      } catch (err) {
        console.error("Error upgrading tier", err);
      }
    }
  };

  const isPaid = tier === "pro" || tier === "billionaire";
  return {
    tier,
    label: TIER_LABEL[tier],
    loading,
    upgrade,
    refresh: fetchTier,
    isPaid,
    canDownload: isPaid,
    projectLimit: tier === "starter" ? FREE_PROJECT_LIMIT : Infinity,
  };
}
