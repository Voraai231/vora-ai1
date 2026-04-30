import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, hasFirebaseConfig } from "@/lib/firebase";

export type Tier = "starter" | "pro" | "billionaire";

const ROOT_OWNER_EMAIL = "saeedautomations295@gmail.com";

export function isRootOwner(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === ROOT_OWNER_EMAIL.toLowerCase();
}

export function useTier() {
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier>("starter");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isRootOwner(user?.email)) {
      setTier("billionaire");
      setLoading(false);
      return;
    }

    if (!user) {
      const localTier = localStorage.getItem("vora.tier") as Tier;
      setTier(localTier || "starter");
      setLoading(false);
      return;
    }

    if (!hasFirebaseConfig) {
      setTier("starter");
      setLoading(false);
      return;
    }

    const fetchTier = async () => {
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
    };

    fetchTier();
  }, [user]);

  const upgrade = async (newTier: Tier) => {
    if (!user) {
      localStorage.setItem("vora.tier", newTier);
      setTier(newTier);
      return;
    }
    
    if (hasFirebaseConfig) {
      try {
        const docRef = doc(db, "users", user.uid, "billing", "current");
        await setDoc(docRef, {
          tier: newTier,
          upgradedAt: serverTimestamp()
        }, { merge: true });
        setTier(newTier);
      } catch (err) {
        console.error("Error upgrading tier", err);
      }
    }
  };

  return { tier, loading, upgrade };
}
