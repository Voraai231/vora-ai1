import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider, hasFirebaseConfig } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
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
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    if (!hasFirebaseConfig) {
      toast({
        title: "Firebase not configured",
        description: "Please add Firebase credentials to your environment variables.",
        variant: "destructive"
      });
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    }
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
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
