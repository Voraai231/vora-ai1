import { db, hasFirebaseConfig } from "@/lib/firebase";
import { doc, setDoc, increment, serverTimestamp, collection, addDoc } from "firebase/firestore";

export type AnalyticsEvent =
  | "page_view"
  | "generation_started"
  | "generation_complete"
  | "project_saved"
  | "project_deleted"
  | "user_signed_in"
  | "export_zip"
  | "export_vercel"
  | "content_studio_used"
  | "magic_wand_used"
  | "seo_master_used";

export async function trackEvent(event: AnalyticsEvent, meta?: Record<string, any>) {
  if (!hasFirebaseConfig) return;
  try {
    const counterRef = doc(db, "analytics", "counters");
    await setDoc(counterRef, { [event]: increment(1), lastUpdated: serverTimestamp() }, { merge: true });

    await addDoc(collection(db, "analytics", "events", "log"), {
      event,
      ...meta,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Analytics error:", err);
  }
}

export async function trackPageView(page: string, uid?: string) {
  await trackEvent("page_view", { page, uid: uid ?? "anonymous" });
}
