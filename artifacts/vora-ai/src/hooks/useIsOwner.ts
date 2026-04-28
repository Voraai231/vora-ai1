import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasFirebaseConfig } from "@/lib/firebase";
import { getOwnerConfig } from "@/lib/admin";

const SUPER_ADMIN_UID: string = (import.meta.env.VITE_OWNER_UID as string | undefined) ?? "";

// Hard-coded owner email allow-list. The deployment owner is locked to this account.
// Add additional emails by setting VITE_OWNER_EMAILS as a comma-separated list.
const HARDCODED_OWNER_EMAILS = ["saeedautomations295@gmail.com"];
const ENV_OWNER_EMAILS = ((import.meta.env.VITE_OWNER_EMAILS as string | undefined) || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const OWNER_EMAILS = new Set([
  ...HARDCODED_OWNER_EMAILS.map((e) => e.toLowerCase()),
  ...ENV_OWNER_EMAILS,
]);

export function useIsOwner() {
  const { user } = useAuth();
  const [firestoreOwnerUid, setFirestoreOwnerUid] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    getOwnerConfig()
      .then((cfg) => {
        if (!cancelled) setFirestoreOwnerUid(cfg?.ownerUid ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const uid = user?.uid ?? null;
  const email = (user?.email || "").toLowerCase();
  const isSuperAdmin = !!uid && !!SUPER_ADMIN_UID && uid === SUPER_ADMIN_UID;
  const isFirestoreOwner = !!uid && !!firestoreOwnerUid && uid === firestoreOwnerUid;
  const isEmailOwner = !!email && OWNER_EMAILS.has(email);
  const isOwner = isSuperAdmin || isFirestoreOwner || isEmailOwner;

  return {
    isOwner,
    isSuperAdmin,
    isFirestoreOwner,
    isEmailOwner,
    checked,
    superAdminConfigured: !!SUPER_ADMIN_UID,
    ownerEmails: Array.from(OWNER_EMAILS),
  };
}
