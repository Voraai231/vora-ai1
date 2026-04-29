import { db, hasFirebaseConfig } from "@/lib/firebase";
import {
  collection, collectionGroup, doc, getCountFromServer, getDoc,
  getDocs, query, orderBy, limit, setDoc, deleteDoc,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { User } from "firebase/auth";

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

export async function getTotalUsers(): Promise<number> {
  if (!hasFirebaseConfig) return 0;
  const snapshot = await getCountFromServer(collection(db, "users"));
  return snapshot.data().count;
}

export async function getAllProjects(max = 200): Promise<AdminProjectRow[]> {
  if (!hasFirebaseConfig) return [];
  const q = query(collectionGroup(db, "projects"), orderBy("updatedAt", "desc"), limit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data() as any;
    const ownerUid = d.ref.parent.parent?.id || "unknown";
    return {
      id: d.id,
      ownerUid,
      title: data.title || "Untitled",
      prompt: data.prompt || "",
      html: data.html || "",
      updatedAt: data.updatedAt || null,
      createdAt: data.createdAt || null,
      sharedSlug: data.sharedSlug || null,
    };
  });
}

export async function getTotalProjects(): Promise<number> {
  if (!hasFirebaseConfig) return 0;
  const snapshot = await getCountFromServer(collectionGroup(db, "projects"));
  return snapshot.data().count;
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
