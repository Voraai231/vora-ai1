import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { submitPaymentRequest } from "@/lib/payments";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy, CheckCircle2, Loader2, Sparkles, Shield, Crown,
  ExternalLink, Zap, Check, AlertCircle,
} from "lucide-react";

const BINANCE_PAY_ID = "YOUR_BINANCE_PAY_ID_HERE";
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=00E5FF&bgcolor=050505&data=${encodeURIComponent(BINANCE_PAY_ID)}&format=svg&margin=10`;

const PLANS = [
  {
    id: "pro-monthly",
    label: "Vora Pro",
    badge: "Most Popular",
    price: "$19",
    period: "/month",
    usdtAmount: "19 USDT",
    color: "#00E5FF",
    features: [
      "Unlimited AI builds",
      "ZIP source code export",
      "Vercel 1-click deploy",
      "Magic Wand auto-fixer",
      "SEO Master sidebar",
      "Unlimited cloud projects",
      "Content Studio access",
    ],
  },
  {
    id: "pro-lifetime",
    label: "Vora Pro Lifetime",
    badge: "Best Value",
    price: "$49",
    period: " one-time",
    usdtAmount: "49 USDT",
    color: "#E5E4E2",
    features: [
      "Everything in Pro Monthly",
      "Pay once, keep forever",
      "All future updates included",
      "Priority Gemini key access",
      "Vercel deployment",
      "White-glove support",
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BinancePayModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [txid, setTxid] = useState("");
  const [step, setStep] = useState<"select" | "pay" | "submitted">("select");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(BINANCE_PAY_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!txid.trim()) {
      toast({ title: "TXID required", description: "Please paste your Binance transaction ID.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to submit a payment.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await submitPaymentRequest(user, txid, selectedPlan.id, selectedPlan.usdtAmount);
      setStep("submitted");
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("select");
    setTxid("");
    setSelectedPlan(PLANS[0]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-0"
        style={{ background: "rgba(5,5,5,0.98)", border: "1px solid rgba(229,228,226,0.1)" }}>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Plan Select ───────────────────────────────── */}
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}>
              <div className="px-7 pt-7 pb-5 border-b border-[#E5E4E2]/6">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center breathing-glow"
                      style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.2)" }}>
                      <Crown className="w-5 h-5 text-[#00E5FF]" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-black text-[#E5E4E2] leading-tight">Upgrade to Vora Pro</DialogTitle>
                      <p className="text-white/35 text-xs mt-0.5">Unlock unlimited builds & source code downloads</p>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-3">
                {PLANS.map((plan) => (
                  <button key={plan.id} onClick={() => setSelectedPlan(plan)}
                    className="w-full text-left rounded-2xl p-5 transition-all duration-200 border relative"
                    style={{
                      background: selectedPlan.id === plan.id ? "rgba(0,229,255,0.04)" : "rgba(229,228,226,0.02)",
                      borderColor: selectedPlan.id === plan.id ? "rgba(0,229,255,0.3)" : "rgba(229,228,226,0.08)",
                      boxShadow: selectedPlan.id === plan.id ? "0 0 20px rgba(0,229,255,0.05)" : "none",
                    }}>
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                        style={{ background: plan.color === "#00E5FF" ? "rgba(0,229,255,0.15)" : "rgba(229,228,226,0.1)", color: plan.color, border: `1px solid ${plan.color}30` }}>
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-black text-[#E5E4E2] text-base leading-tight">{plan.label}</h3>
                        <p className="text-white/30 text-xs mt-0.5">{plan.usdtAmount} via Binance Pay</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black" style={{ color: plan.color }}>{plan.price}</span>
                        <span className="text-white/30 text-xs">{plan.period}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-center gap-1.5 text-[11px] text-white/40">
                          <Check className="w-2.5 h-2.5 text-[#00E5FF] shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                    {selectedPlan.id === plan.id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.4)" }}>
                          <div className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="px-6 pb-6 flex items-center gap-3">
                <Button variant="ghost" onClick={handleClose}
                  className="flex-1 border border-[#E5E4E2]/8 text-white/40 hover:text-white hover:bg-white/4 rounded-xl">
                  Cancel
                </Button>
                <button onClick={() => setStep("pay")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #f0efed 0%, #E5E4E2 50%, #c8c7c5 100%)",
                    color: "#050505",
                    boxShadow: "0 0 20px rgba(229,228,226,0.12), inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}>
                  <Sparkles className="w-4 h-4" />
                  Continue to Payment
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Pay with Binance ──────────────────────────── */}
          {step === "pay" && (
            <motion.div key="pay" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}>
              <div className="px-7 pt-7 pb-5 border-b border-[#E5E4E2]/6">
                <button onClick={() => setStep("select")} className="text-white/30 hover:text-white text-xs mb-3 flex items-center gap-1 transition-colors">
                  ← Back to plans
                </button>
                <h2 className="text-xl font-black text-[#E5E4E2]">Pay with Binance</h2>
                <p className="text-white/35 text-sm mt-1">
                  Send exactly <strong className="text-[#00E5FF]">{selectedPlan.usdtAmount}</strong> to complete your upgrade
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* QR + Pay ID */}
                <div className="flex flex-col sm:flex-row gap-5 items-center p-5 rounded-2xl"
                  style={{ background: "rgba(0,229,255,0.03)", border: "1px solid rgba(0,229,255,0.12)" }}>
                  <div className="shrink-0">
                    <div className="w-[100px] h-[100px] rounded-xl overflow-hidden flex items-center justify-center"
                      style={{ background: "#050505", border: "1px solid rgba(0,229,255,0.2)" }}>
                      <img src={QR_URL} alt="Binance Pay QR" width={100} height={100}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }} />
                      <div className="hidden flex-col items-center text-[#00E5FF]/30 text-center p-2">
                        <Zap className="w-6 h-6 mb-1" />
                        <span className="text-[8px]">QR Code</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/35 text-[11px] uppercase tracking-widest font-bold mb-1.5">Binance Pay ID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[#E5E4E2] font-mono text-sm font-bold truncate">{BINANCE_PAY_ID}</code>
                      <button onClick={handleCopyId}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                        style={{
                          background: copied ? "rgba(0,229,255,0.12)" : "rgba(229,228,226,0.06)",
                          border: "1px solid rgba(229,228,226,0.1)",
                          color: copied ? "#00E5FF" : "rgba(229,228,226,0.5)",
                        }}>
                        {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-white/20 text-[10px] mt-2">Send USDT (BEP-20 or TRC-20) · Double-check address before sending</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {[
                    { n: "1", text: `Open Binance → Pay → Send to Pay ID: ${BINANCE_PAY_ID}` },
                    { n: "2", text: `Send exactly ${selectedPlan.usdtAmount} — include "Vora ${selectedPlan.label}" in the note` },
                    { n: "3", text: "Copy your Transaction ID (TXID) from Binance and paste below" },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-start gap-3 text-sm text-white/40">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                        style={{ background: "rgba(0,229,255,0.08)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.2)" }}>{n}</span>
                      <span className="leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>

                {/* TXID Input */}
                <div className="space-y-2">
                  <label className="text-xs text-[#E5E4E2]/50 font-bold uppercase tracking-wider">Transaction ID (TXID)</label>
                  <div className="relative">
                    <Input
                      value={txid}
                      onChange={(e) => setTxid(e.target.value)}
                      placeholder="Paste your Binance TXID here…"
                      className="bg-[#0a0a0a] border-[#E5E4E2]/10 text-[#E5E4E2] placeholder:text-white/15 font-mono text-sm rounded-xl focus-visible:ring-[#00E5FF]/30 focus-visible:border-[#00E5FF]/30 pr-4 py-3"
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(229,228,226,0.02)", border: "1px solid rgba(229,228,226,0.06)" }}>
                    <AlertCircle className="w-3.5 h-3.5 text-[#00E5FF]/50 shrink-0 mt-0.5" />
                    <p className="text-white/25 text-[11px] leading-relaxed">
                      After submitting, our team verifies payments within 2-24 hours. Your Pro access will be activated automatically once confirmed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex items-center gap-3">
                <Button variant="ghost" onClick={handleClose}
                  className="flex-1 border border-[#E5E4E2]/8 text-white/40 hover:text-white hover:bg-white/4 rounded-xl">
                  Cancel
                </Button>
                <button onClick={handleSubmit} disabled={!txid.trim() || submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #f0efed 0%, #E5E4E2 50%, #c8c7c5 100%)",
                    color: "#050505",
                    boxShadow: txid.trim() ? "0 0 20px rgba(229,228,226,0.12), inset 0 1px 0 rgba(255,255,255,0.4)" : "none",
                  }}>
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Shield className="w-4 h-4" /> Submit TXID</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Success ───────────────────────────────────── */}
          {step === "submitted" && (
            <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="p-10 text-center flex flex-col items-center gap-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-[#00E5FF]/10 animate-ping" />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center breathing-glow"
                  style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.3)" }}>
                  <CheckCircle2 className="w-9 h-9 text-[#00E5FF]" />
                </div>
              </motion.div>

              <div>
                <h3 className="text-2xl font-black text-[#E5E4E2] mb-3">Transaction Received!</h3>
                <p className="text-white/50 text-base leading-relaxed max-w-sm">
                  We are verifying your crypto payment. Access will be granted shortly.
                </p>
                <p className="text-white/25 text-xs mt-3 leading-relaxed">
                  Verification usually takes <strong className="text-white/40">2–24 hours</strong>. You'll receive confirmation via email at <span className="text-[#00E5FF]/60">{user?.email}</span>
                </p>
              </div>

              <div className="w-full px-4 py-3.5 rounded-2xl text-left"
                style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)" }}>
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Your TXID</div>
                <code className="text-[#E5E4E2]/70 font-mono text-xs break-all">{txid}</code>
              </div>

              <button onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #f0efed 0%, #E5E4E2 50%, #c8c7c5 100%)",
                  color: "#050505",
                }}>
                <CheckCircle2 className="w-4 h-4" /> Got it, thanks!
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
