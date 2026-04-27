import { db, hasFirebaseConfig } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { updateProject } from "@/lib/projects";

export interface SharedProject {
  slug: string;
  title: string;
  prompt: string;
  html: string;
  ownerUid: string;
  ownerName: string;
  createdAt: Timestamp | Date;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "project";
}

function randomSuffix(length = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function shareProject(params: {
  user: User;
  projectId: string;
  title: string;
  prompt: string;
  html: string;
  existingSlug?: string;
}): Promise<string> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  const { user, projectId, title, prompt, html, existingSlug } = params;

  const slug = existingSlug || `${slugify(title)}-${randomSuffix()}`;

  const sharedRef = doc(db, "sharedProjects", slug);
  await setDoc(sharedRef, {
    slug,
    title,
    prompt,
    html,
    ownerUid: user.uid,
    ownerName: user.displayName || "Anonymous",
    updatedAt: serverTimestamp(),
    ...(existingSlug ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true });

  if (!existingSlug) {
    await updateProject(user, projectId, { sharedSlug: slug } as any);
  }

  return slug;
}

export async function unshareProject(user: User, projectId: string, slug: string): Promise<void> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  const sharedRef = doc(db, "sharedProjects", slug);
  await deleteDoc(sharedRef);
  await updateProject(user, projectId, { sharedSlug: null } as any);
}

export async function getSharedProject(slug: string): Promise<SharedProject | null> {
  if (!hasFirebaseConfig) return null;
  const sharedRef = doc(db, "sharedProjects", slug);
  const snapshot = await getDoc(sharedRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as SharedProject;
}
