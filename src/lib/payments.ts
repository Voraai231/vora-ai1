import { db, hasFirebaseConfig } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";

export interface PaymentRequest {
  uid: string;
  email: string;
  displayName: string;
  txid: string;
  plan: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  notes?: string;
}

export async function submitPaymentRequest(
  user: User,
  txid: string,
  plan: string,
  amount: string,
  notes?: string
): Promise<string> {
  if (!hasFirebaseConfig) throw new Error("Firebase not configured");
  const ref = collection(db, "payment_requests");
  const docRef = await addDoc(ref, {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    txid: txid.trim(),
    plan,
    amount,
    status: "pending",
    notes: notes ?? "",
    createdAt: serverTimestamp(),
  } satisfies Omit<PaymentRequest, "createdAt"> & { createdAt: any });
  return docRef.id;
}
