import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasFirebaseConfig } from "@/lib/firebase";
import { getOwnerConfig } from "@/lib/admin";

const SUPER_ADMIN_UID: string = (import.meta.env.VITE_OWNER_UID as string | undefined) ?? "";

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
  const isSuperAdmin = !!uid && !!SUPER_ADMIN_UID && uid === SUPER_ADMIN_UID;
  const isFirestoreOwner = !!uid && !!firestoreOwnerUid && uid === firestoreOwnerUid;
  const isOwner = isSuperAdmin || isFirestoreOwner;

  return { isOwner, isSuperAdmin, isFirestoreOwner, checked, superAdminConfigured: !!SUPER_ADMIN_UID };
}
