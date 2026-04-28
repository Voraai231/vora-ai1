import { db, hasFirebaseConfig } from "@/lib/firebase";
import { collection, collectionGroup, doc, getCountFromServer, getDoc, getDocs, query, orderBy, limit, setDoc, serverTimestamp, Timestamp, where } from "firebase/firestore";
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

export async function getAllProjects(max = 100): Promise<AdminProjectRow[]> {
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

/** Count users active in the last N hours (default 24) using the lastSeenAt heartbeat. */
export async function getDailyActiveUsers(hours = 24): Promise<number> {
  if (!hasFirebaseConfig) return 0;
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const q = query(collection(db, "users"), where("lastSeenAt", ">=", cutoff));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (err) {
    console.warn("DAU query failed (likely missing index)", err);
    return 0;
  }
}

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","with","for","to","of","in","on","at","by","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","will","would","could","should","may","might","must","can","this","that","these",
  "those","it","its","i","you","he","she","they","we","my","your","our","their","me","him","her","them","us","not","no",
  "yes","very","just","more","most","some","any","all","each","every","other","such","than","then","so","also","page",
  "section","add","make","use","using","one","two","three","website","site","app","ui","color","dark","light","theme",
  "modern","clean","simple","beautiful","background","text","button","layout","design","new","like","including","include",
  "from","into","about","up","down","out","over","as",
]);

export interface PromptWord { word: string; count: number; }

export async function getPopularPromptWords(topN = 12): Promise<PromptWord[]> {
  const projects = await getAllProjects(500);
  const freq = new Map<string, number>();
  for (const p of projects) {
    const tokens = (p.prompt || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  }
  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export interface RevenueSummary {
  proCount: number;
  lifetimeCount: number;
  estimatedMrr: number;     // monthly recurring revenue from active Pro subs ($12/mo)
  estimatedLtv: number;     // total realised lifetime cash from one-time Lifetime ($99) buyers
  total: number;            // estimatedMrr + estimatedLtv (snapshot of "this month + all-time lifetime")
  recent: { uid: string; email: string; tier: string; productName?: string; validatedAt: any }[];
}

export async function getRevenueSummary(): Promise<RevenueSummary> {
  if (!hasFirebaseConfig) {
    return { proCount: 0, lifetimeCount: 0, estimatedMrr: 0, estimatedLtv: 0, total: 0, recent: [] };
  }
  try {
    const snap = await getDocs(query(collection(db, "payments"), orderBy("validatedAt", "desc"), limit(50)));
    let pro = 0, life = 0;
    const recent: RevenueSummary["recent"] = [];
    snap.docs.forEach((d) => {
      const data = d.data() as any;
      if (data.tier === "pro") pro++;
      else if (data.tier === "billionaire") life++;
      recent.push({
        uid: data.uid || d.id,
        email: data.email || "",
        tier: data.tier || "?",
        productName: data.productName || "",
        validatedAt: data.validatedAt,
      });
    });
    const estimatedMrr = pro * 12;
    const estimatedLtv = life * 99;
    return { proCount: pro, lifetimeCount: life, estimatedMrr, estimatedLtv, total: estimatedMrr + estimatedLtv, recent: recent.slice(0, 10) };
  } catch (err) {
    console.warn("Revenue query failed", err);
    return { proCount: 0, lifetimeCount: 0, estimatedMrr: 0, estimatedLtv: 0, total: 0, recent: [] };
  }
}
