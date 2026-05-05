import { useLocation } from "wouter";
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { VoraIcon } from "@/components/VoraIcon";

export default function RefundPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white overflow-y-auto">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-[#E5E4E2]/5">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="h-4 w-px bg-[#E5E4E2]/8" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg glass-card border border-[#00E5FF]/15 flex items-center justify-center">
            <VoraIcon className="w-3.5 h-3.5 text-[#E5E4E2]" />
          </div>
          <span className="font-black text-xs tracking-widest text-[#E5E4E2]/60">VORA AI</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter text-[#E5E4E2] mb-3">Refund Policy</h1>
          <p className="text-white/30 text-sm">Last updated: May 2025</p>
        </div>

        {/* Summary boxes */}
        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          <div className="rounded-2xl p-5" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)" }}>
            <CheckCircle2 className="w-6 h-6 text-[#00E5FF] mb-3" />
            <h3 className="font-bold text-[#E5E4E2]/70 mb-2">We will refund if:</h3>
            <ul className="space-y-1.5 text-white/40 text-sm">
              <li>• Service is completely unavailable for 72+ consecutive hours</li>
              <li>• Duplicate payment verified by transaction records</li>
              <li>• Payment sent but account never activated after 7 days</li>
              <li>• Required by applicable consumer protection law</li>
            </ul>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "rgba(229,228,226,0.03)", border: "1px solid rgba(229,228,226,0.08)" }}>
            <XCircle className="w-6 h-6 text-white/30 mb-3" />
            <h3 className="font-bold text-[#E5E4E2]/70 mb-2">We cannot refund if:</h3>
            <ul className="space-y-1.5 text-white/40 text-sm">
              <li>• You simply changed your mind</li>
              <li>• AI output did not meet expectations</li>
              <li>• Account was terminated for ToS violations</li>
              <li>• Crypto transaction already verified on-chain</li>
            </ul>
          </div>
        </div>

        <div className="space-y-10">
          {[
            { title: "General Policy", body: "Due to the digital and immediate-access nature of AI-powered services, all payments to Vora AI are generally non-refundable once the service has been accessed. By completing payment and activating a Pro plan, you acknowledge that digital services are exempt from standard cooling-off periods under most jurisdictions." },
            { title: "Crypto Payments (Binance Pay / USDT)", body: "Cryptocurrency transactions are irreversible by nature of the blockchain. Once your TXID is confirmed and your account is activated, refunds are not technically possible via the same channel. In exceptional circumstances where activation fails (see above), we may issue a compensating credit or alternative resolution. Refunds are not available for pending payments that have not yet been verified." },
            { title: "Razorpay / Card Payments (INR)", body: "If you paid via Razorpay and believe you qualify for a refund (see eligible cases above), contact us at refunds@voraai.app with your Payment ID and order details within 7 days of payment. Eligible refunds will be processed to your original payment method within 5-10 business days, subject to Razorpay's processing timelines." },
            { title: "How to Request a Refund", body: "Email refunds@voraai.app with subject line 'Refund Request — [Your Email]'. Include: your registered email, transaction/payment ID, date of payment, amount paid, and a brief explanation of why you believe you qualify. We will respond within 5 business days with our decision. Do not initiate chargebacks without contacting us first — chargebacks result in immediate account termination." },
            { title: "Chargebacks", body: "Initiating an unjustified chargeback will result in immediate and permanent account termination, and may be reported to relevant financial fraud databases. We reserve the right to dispute chargebacks with transaction evidence and dispute resolution services." },
            { title: "Pro Lifetime Plans", body: "The Pro Lifetime plan is a one-time purchase providing perpetual access. This plan is explicitly non-refundable once access has been granted, as the full value is delivered immediately upon activation." },
            { title: "Changes to This Policy", body: "We reserve the right to modify this Refund Policy at any time. Changes will be posted to this page. Payments made before a policy change remain subject to the policy in effect at the time of payment." },
            { title: "Contact", body: "For all refund-related matters: refunds@voraai.app. For general support: support@voraai.app. We take all refund requests seriously and aim to resolve all cases fairly and promptly." },
          ].map(({ title, body }) => (
            <div key={title} className="border-t border-[#E5E4E2]/5 pt-8">
              <h2 className="font-bold text-[#E5E4E2]/70 mb-3 text-base">{title}</h2>
              <p className="text-white/35 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(255,184,0,0.05)", border: "1px solid rgba(255,184,0,0.15)" }}>
          <AlertTriangle className="w-4 h-4 text-yellow-500/60 shrink-0 mt-0.5" />
          <p className="text-white/30 text-xs leading-relaxed">
            Before making a purchase, we strongly recommend trying the free tier (3 builds) to confirm Vora AI meets your needs. Contact us at support@voraai.app before purchasing if you have any questions.
          </p>
        </div>

        <div className="mt-16 flex items-center justify-center gap-6 text-white/20 text-xs">
          <button onClick={() => setLocation("/terms")} className="hover:text-white/40 transition-colors">Terms of Service</button>
          <button onClick={() => setLocation("/privacy")} className="hover:text-white/40 transition-colors">Privacy Policy</button>
          <button onClick={() => setLocation("/pricing")} className="hover:text-white/40 transition-colors">Pricing</button>
        </div>
      </main>
    </div>
  );
}
