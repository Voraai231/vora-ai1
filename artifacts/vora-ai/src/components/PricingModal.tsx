import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTier, TIER_LABEL } from "@/hooks/useTier";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsOwner } from "@/hooks/useIsOwner";
import { LEMON_PRO_URL, LEMON_LIFETIME_URL, buildCheckoutUrl, validateLicenseKey, recordLicenseEntitlement, getStoredLicense } from "@/lib/lemon";
import { Check, Crown, Sparkles, Loader2, KeyRound, ExternalLink, ShieldCheck, Globe } from "lucide-react";

export function PricingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tier, refresh } = useTier();
  const { user, signIn } = useAuth();
  const { isOwner } = useIsOwner();
  const { toast } = useToast();

  const [licenseInput, setLicenseInput] = useState("");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (open && user) {
      getStoredLicense(user).then((k) => { if (k) setLicenseInput(k); }).catch(() => {});
    }
  }, [open, user?.uid]);

  const handleBuy = (plan: "pro" | "lifetime") => {
    if (!user) {
      toast({ title: "Sign in first", description: "We'll attach the purchase to your account." });
      signIn();
      return;
    }
    const baseUrl = plan === "pro" ? LEMON_PRO_URL : LEMON_LIFETIME_URL;
    if (!baseUrl) {
      toast({
        title: "Checkout link not configured",
        description: `Add ${plan === "pro" ? "VITE_LEMON_PRO_URL" : "VITE_LEMON_LIFETIME_URL"} as a project secret to enable purchases.`,
        variant: "destructive",
      });
      return;
    }
    const url = buildCheckoutUrl(baseUrl, user);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleActivate = async () => {
    if (!user) {
      toast({ title: "Sign in first", description: "Sign in to attach this license to your account." });
      return;
    }
    if (!licenseInput.trim()) {
      toast({ title: "Paste your license key" });
      return;
    }
    setActivating(true);
    try {
      const res = await validateLicenseKey(licenseInput.trim());
      if (!res.valid || !res.tier) {
        toast({ title: "Invalid license", description: res.error || "Check the key and try again.", variant: "destructive" });
        return;
      }
      await recordLicenseEntitlement(user, licenseInput.trim(), res);
      await refresh();
      toast({ title: "Plan activated", description: `Welcome to Vora ${res.tier === "billionaire" ? "Lifetime" : "Pro"}.` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Could not activate", description: err?.message || "Please retry.", variant: "destructive" });
    } finally {
      setActivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[920px] bg-background/95 backdrop-blur-xl border-border/50 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-3xl font-bold tracking-tight mb-2 gradient-text">
            Build at the speed of thought.
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Pay once, own it forever — or stay on Free as long as you like.
          </DialogDescription>
          {tier !== "starter" && (
            <div className="mx-auto mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/40 text-primary text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> You're on Vora {TIER_LABEL[tier]}
            </div>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Free */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Free</h3>
            <div className="text-4xl font-bold mb-1">$0</div>
            <div className="text-xs text-muted-foreground mb-5">Forever. No card needed.</div>
            <ul className="space-y-2.5 mb-6 text-sm flex-1">
              <Row>Unlimited generations</Row>
              <Row>Up to 2 saved sites</Row>
              <Row>Voice & text input</Row>
              <Row>Live preview, undo/redo</Row>
              <Row dim>No download • No deploy</Row>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              {tier === "starter" ? "Current plan" : "Free tier"}
            </Button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-primary/60 bg-card p-6 flex flex-col relative shadow-[0_0_30px_rgba(0,255,255,0.18)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-[0_0_15px_rgba(0,255,255,0.5)]">
              Most popular
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Pro
            </h3>
            <div className="text-4xl font-bold mb-1">$12<span className="text-base text-muted-foreground font-normal">/mo</span></div>
            <div className="text-xs text-muted-foreground mb-5">Cancel anytime. Global cards via LemonSqueezy.</div>
            <ul className="space-y-2.5 mb-6 text-sm flex-1">
              <Row>Everything in Free</Row>
              <Row><strong>Unlimited</strong> saved sites</Row>
              <Row>Production ZIP download</Row>
              <Row>Magic Wand auto-fixer</Row>
              <Row>SEO Master & Promote Kit</Row>
              <Row>Remove "Built with Vora" badge</Row>
            </ul>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
              disabled={tier === "pro" || tier === "billionaire"}
              onClick={() => handleBuy("pro")}
            >
              {tier === "pro" ? "Current plan" : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Get Pro
                </>
              )}
            </Button>
          </div>

          {/* Lifetime */}
          <div className="rounded-2xl border border-yellow-500/40 bg-card p-6 flex flex-col relative overflow-hidden">
            <div className="absolute -inset-px bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none rounded-2xl" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-yellow-400 mb-1 flex items-center gap-1.5 relative">
              <Crown className="w-3.5 h-3.5" /> Lifetime
            </h3>
            <div className="text-4xl font-bold mb-1 relative">$99<span className="text-base text-muted-foreground font-normal"> once</span></div>
            <div className="text-xs text-muted-foreground mb-5 relative">Pay once. Own Vora forever.</div>
            <ul className="space-y-2.5 mb-6 text-sm flex-1 relative">
              <Row gold>Everything in Pro</Row>
              <Row gold>One-click deploy to Vercel/Netlify</Row>
              <Row gold>Priority Gemini routing</Row>
              <Row gold>All future Pro features included</Row>
              <Row gold>White-glove email support</Row>
            </ul>
            <Button
              variant="outline"
              className="w-full border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 relative"
              disabled={tier === "billionaire"}
              onClick={() => handleBuy("lifetime")}
            >
              {tier === "billionaire" ? "You're Lifetime" : (
                <>
                  <Crown className="w-4 h-4 mr-2" /> Go Lifetime
                </>
              )}
            </Button>
          </div>
        </div>

        {/* License key activation */}
        <div className="mt-8 rounded-xl border border-border/50 bg-secondary/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">Already purchased? Activate your license</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Paste the license key from your LemonSqueezy email. Works on any device once you're signed in.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={licenseInput}
              onChange={(e) => setLicenseInput(e.target.value)}
              className="bg-background border-border/50 font-mono text-sm"
              disabled={activating}
            />
            <Button
              onClick={handleActivate}
              disabled={activating || !licenseInput.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              {activating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Activate
            </Button>
          </div>
        </div>

        {isOwner && (
          <div className="mt-4 text-[11px] text-muted-foreground/60 text-center">
            Owner: tier flags are also writable directly via Firestore.
          </div>
        )}

        <p className="mt-6 text-[11px] text-muted-foreground text-center flex items-center justify-center gap-2 flex-wrap">
          Secure payment by LemonSqueezy <ExternalLink className="w-3 h-3" />
          <span>•</span>
          <a href="/privacy" className="hover:text-foreground">Privacy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-foreground">Terms</a>
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Row({ children, dim, gold }: { children: React.ReactNode; dim?: boolean; gold?: boolean }) {
  return (
    <li className={`flex items-start gap-2 ${dim ? "text-muted-foreground/60" : "text-foreground/85"}`}>
      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${gold ? "text-yellow-400" : "text-primary"}`} />
      <span>{children}</span>
    </li>
  );
}
