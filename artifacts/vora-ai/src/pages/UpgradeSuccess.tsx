import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { useToast } from "@/hooks/use-toast";
import { validateLicenseKey, recordLicenseEntitlement } from "@/lib/lemon";
import { VoraIcon } from "@/components/VoraIcon";
import { Loader2, CheckCircle2, KeyRound, Sparkles, ArrowRight } from "lucide-react";

export default function UpgradeSuccess() {
  const { user, signIn } = useAuth();
  const { refresh } = useTier();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Auto-fill license key from URL params (LemonSqueezy passes ?license_key=...)
  const initialKey = (() => {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get("license_key") || "";
    } catch { return ""; }
  })();

  const [key, setKey] = useState(initialKey);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grantedTier, setGrantedTier] = useState<string | null>(null);

  const handleActivate = async () => {
    setError(null);
    if (!user) {
      toast({ title: "Sign in first", description: "Sign in so we can attach your license to your account." });
      return;
    }
    if (!key.trim()) {
      setError("Paste the license key from your LemonSqueezy email.");
      return;
    }
    setBusy(true);
    try {
      const result = await validateLicenseKey(key.trim());
      if (!result.valid || !result.tier) {
        setError(result.error || "License is not valid.");
        return;
      }
      await recordLicenseEntitlement(user, key.trim(), result);
      await refresh();
      setGrantedTier(result.tier);
      setDone(true);
      toast({ title: "Welcome aboard", description: `Your ${result.tier === "billionaire" ? "Lifetime" : "Pro"} plan is active.` });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Auto-attempt activation if key is present in URL and user is signed in.
  useEffect(() => {
    if (initialKey && user && !done && !busy) {
      handleActivate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (done) {
    return (
      <Centered>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center neon-border mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">You're {grantedTier === "billionaire" ? "Lifetime" : "Pro"}.</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          All premium features are unlocked across every device you sign in on.
        </p>
        <Button onClick={() => setLocation("/")} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 shadow-[0_0_20px_rgba(0,255,255,0.4)]">
          Start building <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center neon-border mb-6">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">Activate your plan</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Paste the license key from your purchase email to unlock premium features on this account.
      </p>

      {!user ? (
        <Button onClick={signIn} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 shadow-[0_0_20px_rgba(0,255,255,0.4)]">
          Sign in with Google
        </Button>
      ) : (
        <div className="w-full max-w-md space-y-3">
          <div className="relative">
            <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleActivate(); } }}
              className="pl-9 bg-secondary/30 border-border/50 font-mono"
              disabled={busy}
            />
          </div>
          <Button
            onClick={handleActivate}
            disabled={busy || !key.trim()}
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_20px_rgba(0,255,255,0.4)]"
          >
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Activate
          </Button>
          {error && <div className="text-xs text-destructive text-center">{error}</div>}
          <p className="text-xs text-muted-foreground text-center">
            You can re-paste this key on any device to unlock there too.
          </p>
        </div>
      )}

      <Link href="/" className="mt-8">
        <Button variant="ghost" size="sm" className="text-muted-foreground">Back to dashboard</Button>
      </Link>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center neon-border">
          <VoraIcon className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold">Vora AI</span>
      </Link>
      {children}
    </div>
  );
}
