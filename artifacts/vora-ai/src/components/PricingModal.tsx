import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTier } from "@/hooks/useTier";
import { Check, Crown, Zap, Sparkles } from "lucide-react";

export function PricingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tier, upgrade } = useTier();

  const handleUpgrade = (newTier: "starter" | "pro" | "billionaire") => {
    upgrade(newTier);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-3xl font-bold tracking-tight mb-2">Unlock Vora AI</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Choose the plan that fits your workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="rounded-xl border border-border/50 bg-card p-6 flex flex-col relative">
            <h3 className="text-lg font-semibold mb-2">Starter</h3>
            <div className="text-3xl font-bold mb-6">Free</div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited generations</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Cloud save (5 projects)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Voice & text input</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Live preview</li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full"
              disabled={tier === "starter"}
              onClick={() => handleUpgrade("starter")}
            >
              {tier === "starter" ? "Current Plan" : "Downgrade"}
            </Button>
          </div>

          {/* Pro */}
          <div className="rounded-xl border border-primary/50 bg-card p-6 flex flex-col relative neon-border">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
              Most Popular
            </div>
            <h3 className="text-lg font-semibold mb-2 text-primary neon-text flex items-center gap-2"><Sparkles className="w-4 h-4" /> Pro</h3>
            <div className="text-3xl font-bold mb-6">$9<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Everything in Starter</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited cloud projects</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Magic Wand auto-fixer</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> SEO Master</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Social Promote Kit</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Download ZIP</li>
            </ul>
            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={tier === "pro" || tier === "billionaire"}
              onClick={() => handleUpgrade("pro")}
            >
              {tier === "pro" ? "Current Plan" : "Upgrade to Pro"}
            </Button>
          </div>

          {/* Billionaire */}
          <div className="rounded-xl border border-border/50 bg-card p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <h3 className="text-lg font-semibold mb-2 text-yellow-500 flex items-center gap-2"><Crown className="w-4 h-4" /> Billionaire</h3>
            <div className="text-3xl font-bold mb-6">$49<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Everything in Pro</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Direct Export to Vercel</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Custom domains</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Priority Gemini access</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> White-glove support</li>
            </ul>
            <Button 
              variant="outline"
              className="w-full border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
              disabled={tier === "billionaire"}
              onClick={() => handleUpgrade("billionaire")}
            >
              {tier === "billionaire" ? "Current Plan" : "Go Billionaire"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
