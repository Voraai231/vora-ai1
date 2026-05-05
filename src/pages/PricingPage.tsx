import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { VoraIcon } from "@/components/VoraIcon";
import { BinancePayModal } from "@/components/BinancePayModal";
import { Check, Sparkles, Crown, ArrowLeft, Zap, Shield, Globe2, Code2 } from "lucide-react";

const PLANS = [
  {
    id: "free",
    label: "Starter",
    price: "$0",
    period: "forever",
    desc: "Get a feel for the power of AI web generation.",
    color: "rgba(229,228,226,0.05)",
    borderColor: "rgba(229,228,226,0.1)",
    accentColor: "#E5E4E2",
    badge: null,
    features: [
      "3 AI website generations",
      "Live preview & code view",
      "Voice & text input",
      "Auto-SEO on every build",
      "Sitemap + robots.txt",
    ],
    notIncluded: ["ZIP download", "Vercel deploy", "Magic Wand", "SEO Master", "Unlimited builds"],
  },
  {
    id: "pro-monthly",
    label: "Pro",
    price: "$19",
    period: "/ month",
    desc: "For creators who build and ship regularly.",
    color: "rgba(0,229,255,0.04)",
    borderColor: "rgba(0,229,255,0.25)",
    accentColor: "#00E5FF",
    badge: "Most Popular",
    glow: true,
    features: [
      "Unlimited AI builds",
      "Download ZIP source code",
      "1-click Vercel deployment",
      "Magic Wand auto-fixer",
      "SEO Master sidebar",
      "Unlimited cloud projects",
      "AI Content Studio",
      "Priority Gemini key access",
    ],
    notIncluded: [],
  },
  {
    id: "pro-lifetime",
    label: "Pro Lifetime",
    price: "$49",
    period: "one-time",
    desc: "Pay once. Own it forever. Best long-term value.",
    color: "rgba(229,228,226,0.03)",
    borderColor: "rgba(229,228,226,0.15)",
    accentColor: "#E5E4E2",
    badge: "Best Value",
    features: [
      "Everything in Pro Monthly",
      "Pay once — keep forever",
      "All future updates included",
      "Highest Gemini key priority",
      "White-glove onboarding",
      "Direct founder access",
    ],
    notIncluded: [],
  },
];

const FAQS = [
  { q: "How does payment work?", a: "We accept USDT via Binance Pay. Send the exact amount to our Binance Pay ID, then submit your Transaction ID. Our team verifies within 2–24 hours and activates your access." },
  { q: "What's the difference between monthly and lifetime?", a: "Monthly gives you Pro access for one month, renewable anytime. Lifetime is a single payment that grants permanent Pro access including all future updates." },
  { q: "Can I get a refund?", a: "Due to the digital nature of AI services and immediate access, payments are non-refundable. However, if you experience technical issues preventing you from using the service, contact us." },
  { q: "Do you accept other payment methods?", a: "Currently we accept USDT via Binance Pay. Razorpay (INR) support is also available for Indian users via the in-app upgrade flow." },
  { q: "How do I know my payment was received?", a: "After submitting your TXID, you'll see a confirmation screen. You'll also receive an email once access is activated, typically within 24 hours." },
  { q: "What happens to my builds if I downgrade?", a: "Your saved projects stay permanently. You'll just lose access to download ZIP, Vercel deploy, and other Pro-only tools until you re-upgrade." },
];

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const [showBinance, setShowBinance] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro-monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white overflow-y-auto">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[#E5E4E2]/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-4 w-px bg-[#E5E4E2]/8" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg glass-card border border-[#00E5FF]/15 flex items-center justify-center breathing-glow">
              <VoraIcon className="w-4 h-4 text-[#E5E4E2]" />
            </div>
            <span className="font-black text-sm tracking-widest neon-text">VORA AI</span>
          </div>
        </div>
        <button onClick={() => setLocation("/build")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: "rgba(229,228,226,0.06)", border: "1px solid rgba(229,228,226,0.1)", color: "#E5E4E2" }}>
          <Sparkles className="w-3.5 h-3.5" /> Open Builder
        </button>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-[#00E5FF]/15 text-[#00E5FF]/70 text-xs font-bold uppercase tracking-widest mb-6">
            Simple Pricing
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-5">
            <span className="neon-text">Build without limits.</span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Start free. Upgrade with crypto when you're ready. No subscriptions forced on you.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 mb-20">
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl p-6 flex flex-col"
              style={{
                background: plan.color,
                border: `1px solid ${plan.borderColor}`,
                boxShadow: plan.glow ? "0 0 40px rgba(0,229,255,0.06)" : "none",
              }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style={{ background: plan.glow ? "rgba(0,229,255,0.15)" : "rgba(229,228,226,0.1)", color: plan.accentColor, border: `1px solid ${plan.accentColor}30` }}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-base font-black mb-1" style={{ color: plan.accentColor }}>{plan.label}</h3>
                <p className="text-white/30 text-xs leading-relaxed">{plan.desc}</p>
              </div>

              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-black text-[#E5E4E2]">{plan.price}</span>
                <span className="text-white/30 text-sm mb-1">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/50">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: plan.accentColor }} />
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/18 line-through">
                    <span className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/15">✕</span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.id === "free" ? (
                <button onClick={() => setLocation("/build")}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(229,228,226,0.06)", border: "1px solid rgba(229,228,226,0.1)", color: "#E5E4E2" }}>
                  Start Free
                </button>
              ) : (
                <button onClick={() => { setSelectedPlan(plan.id); setShowBinance(true); }}
                  className="w-full py-3 rounded-xl text-sm font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: plan.glow
                      ? "linear-gradient(135deg, rgba(0,229,255,0.2) 0%, rgba(0,229,255,0.1) 100%)"
                      : "linear-gradient(135deg, #f0efed 0%, #E5E4E2 50%, #c8c7c5 100%)",
                    color: plan.glow ? "#00E5FF" : "#050505",
                    border: plan.glow ? "1px solid rgba(0,229,255,0.3)" : "none",
                    boxShadow: plan.glow ? "0 0 20px rgba(0,229,255,0.1)" : "none",
                  }}>
                  Pay with Binance · {plan.price}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-20 text-white/25 text-xs">
          {[
            { icon: <Shield className="w-3.5 h-3.5" />, text: "USDT accepted" },
            { icon: <Zap className="w-3.5 h-3.5" />, text: "24h activation" },
            { icon: <Globe2 className="w-3.5 h-3.5" />, text: "Worldwide access" },
            { icon: <Code2 className="w-3.5 h-3.5" />, text: "Full source code" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-[#00E5FF]/30">
              {icon} {text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-[#E5E4E2] mb-8 text-center">Frequently Asked</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(229,228,226,0.07)" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/1 transition-colors">
                  <span className="text-[#E5E4E2]/70 text-sm font-semibold pr-4">{faq.q}</span>
                  <span className={`text-white/25 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-white/35 text-sm leading-relaxed border-t border-[#E5E4E2]/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 mt-16 text-white/20 text-xs">
          <button onClick={() => setLocation("/terms")} className="hover:text-white/40 transition-colors">Terms</button>
          <button onClick={() => setLocation("/privacy")} className="hover:text-white/40 transition-colors">Privacy</button>
          <button onClick={() => setLocation("/refund")} className="hover:text-white/40 transition-colors">Refund Policy</button>
        </div>
      </main>

      <BinancePayModal open={showBinance} onClose={() => setShowBinance(false)} />
    </div>
  );
}
