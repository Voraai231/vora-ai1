import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTier } from "@/hooks/useTier";
import { useAuth } from "@/contexts/AuthContext";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { Check, Crown, Sparkles, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

const PLANS = [
  {
    id: "starter" as const,
    label: "Starter",
    price: "Free",
    amountInPaise: 0,
    color: "border-border/50",
    icon: null,
    description: "Get started for free",
    features: [
      "Unlimited AI generations",
      "Cloud save (5 projects)",
      "Voice & text input",
      "Live iframe preview",
    ],
  },
  {
    id: "pro" as const,
    label: "Pro",
    price: "₹749",
    amountInPaise: 74900,
    color: "border-primary/50 neon-border",
    icon: <Sparkles className="w-4 h-4" />,
    badge: "Most Popular",
    description: "For serious builders",
    features: [
      "Everything in Starter",
      "Unlimited cloud projects",
      "Magic Wand auto-fixer",
      "SEO Master",
      "Social Promote Kit",
      "Download as ZIP",
      "Content Studio access",
    ],
  },
  {
    id: "billionaire" as const,
    label: "Billionaire",
    price: "₹3,999",
    amountInPaise: 399900,
    color: "border-yellow-500/40",
    icon: <Crown className="w-4 h-4" />,
    description: "Maximum power",
    features: [
      "Everything in Pro",
      "Direct Vercel deployment",
      "Custom domain support",
      "Priority Gemini access",
      "White-glove support",
      "Early access to new features",
    ],
  },
];

export function PricingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tier, upgrade } = useTier();
  const { user } = useAuth();
  const { openCheckout } = useRazorpay();
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const hasRazorpay = !!import.meta.env.VITE_RAZORPAY_KEY_ID;

  const handleUpgrade = async (planId: "starter" | "pro" | "billionaire") => {
    const plan = PLANS.find((p) => p.id === planId)!;

    if (planId === "starter") {
      await upgrade("starter");
      onOpenChange(false);
      return;
    }

    if (!hasRazorpay) {
      await upgrade(planId);
      toast({ title: `Upgraded to ${plan.label}`, description: "Payment gateway not configured — tier applied directly." });
      onOpenChange(false);
      return;
    }

    setProcessingPlan(planId);
    try {
      await openCheckout({
        amountInPaise: plan.amountInPaise,
        planName: plan.label,
        description: `Vora AI ${plan.label} — Monthly`,
        userName: user?.displayName || "",
        userEmail: user?.email || "",
        onSuccess: async (paymentId) => {
          await upgrade(planId);
          void trackEvent("payment_success" as any, {
            plan: planId,
            paymentId,
            uid: user?.uid,
          });
          toast({
            title: `Welcome to ${plan.label}! 🎉`,
            description: `Payment confirmed. ID: ${paymentId.slice(0, 16)}…`,
          });
          onOpenChange(false);
          setProcessingPlan(null);
        },
        onFailure: (error) => {
          toast({ title: "Payment failed", description: error, variant: "destructive" });
          setProcessingPlan(null);
        },
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setProcessingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px] bg-background/97 backdrop-blur-xl border-border/50 p-0 overflow-hidden">
        <div className="p-8 pb-6 border-b border-border/30">
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-bold tracking-tight mb-2">Unlock Vora AI</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Choose the plan that fits your workflow. Powered by Razorpay — secure, instant.
            </DialogDescription>
          </DialogHeader>

          {!hasRazorpay && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Payment gateway not configured — upgrades apply instantly for testing.
            </div>
          )}
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = tier === plan.id;
            const isAbove = PLANS.findIndex((p) => p.id === tier) > PLANS.findIndex((p) => p.id === plan.id);
            const isProcessing = processingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border bg-card p-6 flex flex-col relative transition-all duration-300 ${plan.color} ${
                  isCurrent ? "ring-1 ring-primary/30" : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full tracking-wide uppercase shadow-[0_0_12px_rgba(0,255,255,0.4)]">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-4">
                  <h3 className={`text-lg font-bold flex items-center gap-2 mb-1 ${
                    plan.id === "pro" ? "text-primary" : plan.id === "billionaire" ? "text-yellow-400" : ""
                  }`}>
                    {plan.icon} {plan.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>

                <div className="text-4xl font-bold tracking-tight mb-6">
                  {plan.price}
                  {plan.amountInPaise > 0 && (
                    <span className="text-sm text-muted-foreground font-normal ml-1">/mo</span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
                        plan.id === "billionaire" ? "text-yellow-400" : "text-primary"
                      }`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" /> Current Plan
                  </div>
                ) : (
                  <Button
                    className={`w-full font-semibold ${
                      plan.id === "pro"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]"
                        : plan.id === "billionaire"
                        ? "border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300"
                        : ""
                    }`}
                    variant={plan.id === "starter" ? "outline" : undefined}
                    disabled={isProcessing || !!processingPlan}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                    ) : isAbove ? (
                      "Downgrade"
                    ) : plan.amountInPaise > 0 ? (
                      `Pay ${plan.price}`
                    ) : (
                      "Get Started Free"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-8 pb-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          Secured by Razorpay · 256-bit SSL · Instant activation
        </div>
      </DialogContent>
    </Dialog>
  );
}
