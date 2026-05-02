import { db, hasFirebaseConfig } from "@/lib/firebase";
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";

export interface Project {
  id: string;
  title: string;
  prompt: string;
  html: string;
  sitemap: string;
  robotsTxt: string;
  seoKeywords: string;
  seoDescription: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  thumbnail?: string;
  sharedSlug?: string | null;
}

export async function saveProject(
  user: User,
  data: {
    title: string;
    prompt: string;
    html: string;
    sitemap?: string;
    robotsTxt?: string;
    seoKeywords?: string;
    seoDescription?: string;
    thumbnail?: string;
  }
): Promise<string> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  const projectsRef = collection(db, "users", user.uid, "projects");
  const docRef = await addDoc(projectsRef, {
    title: data.title,
    prompt: data.prompt,
    html: data.html,
    sitemap: data.sitemap ?? "",
    robotsTxt: data.robotsTxt ?? "",
    seoKeywords: data.seoKeywords ?? "",
    seoDescription: data.seoDescription ?? "",
    thumbnail: data.thumbnail ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateProject(user: User, projectId: string, data: Partial<Project>): Promise<void> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  const docRef = doc(db, "users", user.uid, "projects", projectId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProject(user: User, projectId: string): Promise<void> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  const docRef = doc(db, "users", user.uid, "projects", projectId);
  await deleteDoc(docRef);
}

export async function listProjects(user: User): Promise<Project[]> {
  if (!hasFirebaseConfig) return [];
  const projectsRef = collection(db, "users", user.uid, "projects");
  const q = query(projectsRef, orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Project[];
}

export async function getProject(user: User, projectId: string): Promise<Project | null> {
  if (!hasFirebaseConfig) return null;
  const docRef = doc(db, "users", user.uid, "projects", projectId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as Project;
  return null;
}
