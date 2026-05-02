import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, hasFirebaseConfig, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

async function upsertUserProfile(user: User) {
  if (!hasFirebaseConfig) return;
  try {
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
  } catch (err) {
    console.error("Failed to upsert user profile", err);
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) void upsertUserProfile(currentUser);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    if (!hasFirebaseConfig) {
      toast({ title: "Firebase not configured", variant: "destructive" });
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!hasFirebaseConfig) {
      toast({ title: "Firebase not configured", variant: "destructive" });
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    if (!hasFirebaseConfig) {
      toast({ title: "Firebase not configured", variant: "destructive" });
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    await upsertUserProfile(cred.user);
  };

  const signOut = async () => {
    if (!hasFirebaseConfig) return;
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signInWithEmail, registerWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
