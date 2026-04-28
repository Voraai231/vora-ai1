import { db, hasFirebaseConfig } from "@/lib/firebase";
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, limit, serverTimestamp, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";

export interface Project {
  id: string;
  title: string;
  prompt: string;
  html: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  thumbnail?: string;
  sharedSlug?: string | null;
}

export async function saveProject(user: User, data: { title: string; prompt: string; html: string; thumbnail?: string }): Promise<string> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  
  const projectsRef = collection(db, "users", user.uid, "projects");
  const docRef = await addDoc(projectsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateProject(user: User, projectId: string, data: Partial<Project>): Promise<void> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");

  const docRef = doc(db, "users", user.uid, "projects", projectId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
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
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Project[];
}

export async function getLatestProject(user: User): Promise<Project | null> {
  if (!hasFirebaseConfig) return null;
  const projectsRef = collection(db, "users", user.uid, "projects");
  const q = query(projectsRef, orderBy("updatedAt", "desc"), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Project;
}

export async function getProject(user: User, projectId: string): Promise<Project | null> {
  if (!hasFirebaseConfig) return null;

  const docRef = doc(db, "users", user.uid, "projects", projectId);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Project;
  }
  return null;
}
