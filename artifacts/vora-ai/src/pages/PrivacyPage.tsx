import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { VoraIcon } from "@/components/VoraIcon";

const SECTIONS = [
  { title: "1. Overview", body: "Vora AI ('we', 'our', 'us') is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI website builder platform. Please read this carefully. By using Vora AI, you consent to the practices described here." },
  { title: "2. Information We Collect", body: "Account information: When you register, we collect your name, email address, and profile photo (via Google Sign-In or Email/Password). Usage data: We log interactions including prompts submitted, pages visited, and features used — for improving the Service. Project data: HTML output, prompts, SEO metadata, and project titles are stored in Firebase Firestore linked to your account. Payment data: For crypto payments via Binance Pay, we collect your submitted Transaction ID (TXID) for verification. We do not store cryptocurrency wallet addresses or private keys." },
  { title: "3. How We Use Your Information", body: "We use collected information to: (a) operate and maintain the Vora AI platform; (b) authenticate your identity and manage your account; (c) process and verify payments; (d) provide customer support and respond to inquiries; (e) analyse usage patterns to improve features; (f) send transactional emails (account confirmation, payment verification); (g) comply with legal obligations. We do not use your prompts or generated content to train AI models." },
  { title: "4. Data Storage & Security", body: "Your data is stored in Google Firebase (Firestore and Authentication), hosted on Google Cloud infrastructure with SOC 2 and ISO 27001 certification. We implement TLS encryption for all data in transit. Access to your Firestore data is restricted to your authenticated user ID. We do not sell, rent, or share your personal data with third parties for marketing purposes." },
  { title: "5. Third-Party Services", body: "We use the following third-party services: Google Firebase (authentication, database), Google Gemini API (AI generation — prompts are sent to Google's servers per their privacy policy), Razorpay (INR payment processing), Binance Pay (USDT payment verification). Each provider has its own privacy policy. We encourage you to review them. We are not responsible for third-party data practices." },
  { title: "6. Cookies & Local Storage", body: "Vora AI uses browser localStorage to store your tier/plan status, build count, and session preferences. We do not use advertising cookies or cross-site tracking. A minimal session cookie is used for authentication state. You may clear your browser data at any time, which will reset local preferences but not cloud-saved data." },
  { title: "7. Data Retention", body: "Account data is retained for as long as your account is active. Project data is retained indefinitely until you delete it. Payment records (TXID submissions) are retained for accounting and audit purposes for a minimum of 7 years per Indian financial regulations. If you delete your account, personal identifiers are removed, but anonymised usage logs may be retained." },
  { title: "8. Your Rights", body: "You have the right to: (a) access a copy of your personal data; (b) correct inaccurate data; (c) delete your account and associated data; (d) object to or restrict processing; (e) data portability (export your projects as ZIP). To exercise any right, contact privacy@voraai.app. We will respond within 30 days." },
  { title: "9. Children's Privacy", body: "Vora AI is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately and we will delete it." },
  { title: "10. Changes to This Policy", body: "We may update this Privacy Policy from time to time. We will notify you of material changes via email or an in-app notification. Your continued use of the Service after changes are posted constitutes acceptance of the revised policy." },
  { title: "11. Contact Us", body: "For privacy-related requests or questions, contact us at privacy@voraai.app. Our registered correspondence address is available upon request. We aim to respond to all privacy inquiries within 30 days." },
];

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-black tracking-tighter text-[#E5E4E2] mb-3">Privacy Policy</h1>
          <p className="text-white/30 text-sm">Last updated: May 2025 · GDPR & Indian IT Act compliant</p>
        </div>
        <div className="space-y-10">
          {SECTIONS.map(({ title, body }) => (
            <div key={title} className="border-t border-[#E5E4E2]/5 pt-8">
              <h2 className="font-bold text-[#E5E4E2]/70 mb-3 text-base">{title}</h2>
              <p className="text-white/35 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex items-center justify-center gap-6 text-white/20 text-xs">
          <button onClick={() => setLocation("/terms")} className="hover:text-white/40 transition-colors">Terms of Service</button>
          <button onClick={() => setLocation("/refund")} className="hover:text-white/40 transition-colors">Refund Policy</button>
        </div>
      </main>
    </div>
  );
}
