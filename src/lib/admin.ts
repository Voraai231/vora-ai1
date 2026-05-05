import { db, hasFirebaseConfig } from "@/lib/firebase";
import {
  collection, doc, getCountFromServer, getDoc,
  getDocs, setDoc, deleteDoc, updateDoc, query, orderBy,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { User } from "firebase/auth";

export interface PaymentRequestRow {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  txid: string;
  plan: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  notes: string;
  createdAt: Timestamp | Date | null;
}

export async function getPaymentRequests(): Promise<PaymentRequestRow[]> {
  if (!hasFirebaseConfig) return [];
  try {
    const q = query(collection(db, "payment_requests"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRequestRow));
  } catch {
    // fallback without orderBy if index not ready
    const snap = await getDocs(collection(db, "payment_requests"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRequestRow));
  }
}

export async function approvePaymentRequest(requestId: string, uid: string): Promise<void> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  // Mark request approved
  await updateDoc(doc(db, "payment_requests", requestId), {
    status: "approved",
    approvedAt: serverTimestamp(),
  });
  // Activate Pro tier for the user
  await setDoc(doc(db, "users", uid, "billing", "current"), {
    tier: "pro",
    upgradedAt: serverTimestamp(),
    source: "binance_pay",
    paymentRequestId: requestId,
  }, { merge: true });
}

export async function rejectPaymentRequest(requestId: string): Promise<void> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  await updateDoc(doc(db, "payment_requests", requestId), {
    status: "rejected",
    rejectedAt: serverTimestamp(),
  });
}

export interface AdminProjectRow {
  id: string;
  ownerUid: string;
  title: string;
  prompt: string;
  html: string;
  updatedAt: Timestamp | Date | null;
  createdAt: Timestamp | Date | null;
  sharedSlug?: string | null;
}

export interface OwnerConfig {
  ownerUid: string;
  ownerEmail: string;
  claimedAt: Timestamp | Date;
}

export interface AnalyticsCounters {
  page_view?: number;
  generation_started?: number;
  generation_complete?: number;
  project_saved?: number;
  user_signed_in?: number;
  export_zip?: number;
  export_vercel?: number;
  content_studio_used?: number;
  magic_wand_used?: number;
  seo_master_used?: number;
}

const CONFIG_PATH = ["meta", "config"] as const;

export async function getOwnerConfig(): Promise<OwnerConfig | null> {
  if (!hasFirebaseConfig) return null;
  const snapshot = await getDoc(doc(db, ...CONFIG_PATH));
  if (!snapshot.exists()) return null;
  return snapshot.data() as OwnerConfig;
}

export async function claimOwnership(user: User): Promise<OwnerConfig> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  const existing = await getOwnerConfig();
  if (existing) return existing;
  const data: OwnerConfig = {
    ownerUid: user.uid,
    ownerEmail: user.email || "",
    claimedAt: serverTimestamp() as unknown as Timestamp,
  };
  await setDoc(doc(db, ...CONFIG_PATH), data);
  return data;
}

// Ensures owner user document exists in Firestore users collection
export async function initializeOwnerProfile(user: User): Promise<void> {
  if (!hasFirebaseConfig) return;
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastSeenAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getTotalUsers(): Promise<number> {
  if (!hasFirebaseConfig) return 0;
  const snapshot = await getCountFromServer(collection(db, "users"));
  return snapshot.data().count;
}

// No collectionGroup — fetch users first, then each user's projects
// This avoids any Firestore index requirement entirely
export async function getAllProjects(max = 200): Promise<AdminProjectRow[]> {
  if (!hasFirebaseConfig) return [];

  const usersSnap = await getDocs(collection(db, "users"));
  const rows: AdminProjectRow[] = [];

  for (const userDoc of usersSnap.docs) {
    if (rows.length >= max) break;
    const uid = userDoc.id;
    try {
      const projSnap = await getDocs(collection(db, "users", uid, "projects"));
      for (const d of projSnap.docs) {
        if (rows.length >= max) break;
        const data = d.data() as any;
        rows.push({
          id: d.id,
          ownerUid: uid,
          title: data.title || "Untitled",
          prompt: data.prompt || "",
          html: data.html || "",
          updatedAt: data.updatedAt || null,
          createdAt: data.createdAt || null,
          sharedSlug: data.sharedSlug || null,
        });
      }
    } catch {
      // Skip users whose projects we can't read
    }
  }

  // Client-side sort newest first
  return rows.sort((a, b) => {
    const toMs = (v: any) =>
      v instanceof Timestamp ? v.toMillis()
      : v instanceof Date ? v.getTime()
      : typeof v === "number" ? v
      : 0;
    return toMs(b.updatedAt) - toMs(a.updatedAt);
  });
}

export async function getTotalProjects(): Promise<number> {
  if (!hasFirebaseConfig) return 0;
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    let total = 0;
    for (const userDoc of usersSnap.docs) {
      const snap = await getCountFromServer(
        collection(db, "users", userDoc.id, "projects")
      );
      total += snap.data().count;
    }
    return total;
  } catch {
    return 0;
  }
}

export async function getTotalSharedProjects(): Promise<number> {
  if (!hasFirebaseConfig) return 0;
  const snapshot = await getCountFromServer(collection(db, "sharedProjects"));
  return snapshot.data().count;
}

export async function adminDeleteProject(ownerUid: string, projectId: string): Promise<void> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  await deleteDoc(doc(db, "users", ownerUid, "projects", projectId));
}

export async function getAnalyticsCounters(): Promise<AnalyticsCounters> {
  if (!hasFirebaseConfig) return {};
  try {
    const snapshot = await getDoc(doc(db, "analytics", "counters"));
    if (!snapshot.exists()) return {};
    return snapshot.data() as AnalyticsCounters;
  } catch {
    return {};
  }
}
