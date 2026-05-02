import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { VoraIcon } from "@/components/VoraIcon";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ChevronDown, Shield, Zap, Globe2, Code2, Lock, ArrowRight } from "lucide-react";

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,0,${p.alpha})`;
        ctx.fill();
      });
      // Draw faint connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,215,0,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

const ABOUT_FEATURES = [
  {
    icon: <Zap className="w-5 h-5 text-[#FFD700]" />,
    title: "Instant AI Generation",
    desc: "Describe any website in plain English. Vora AI's 6-key Gemini 2.5 Flash engine generates a fully-coded, production-ready HTML site in under 8 seconds — complete with SEO metadata, Open Graph tags, and Schema.org markup.",
  },
  {
    icon: <Globe2 className="w-5 h-5 text-[#FFD700]" />,
    title: "Auto-SEO Built In",
    desc: "Every build auto-generates meta descriptions, canonical links, Twitter Cards, Open Graph tags, sitemap.xml, and robots.txt. Your sites rank from day one with zero extra effort.",
  },
  {
    icon: <Code2 className="w-5 h-5 text-[#FFD700]" />,
    title: "Live Code + Preview",
    desc: "Watch your website materialize in real-time. The split-panel factory interface streams raw HTML on the left as your live preview renders on the right — frame by frame, character by character.",
  },
  {
    icon: <Shield className="w-5 h-5 text-[#FFD700]" />,
    title: "6-Key Load Balancer",
    desc: "Six independent Gemini API keys rotate automatically. If any key hits a rate limit, the engine instantly switches to the next — zero downtime, zero interruptions, 100% uptime guaranteed.",
  },
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showTerms, setShowTerms] = useState(false);

  const handleGetStarted = () => {
    if (user) setLocation("/home");
    else setLocation("/auth");
  };

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white overflow-x-hidden selection:bg-[#FFD700]/30">
      <ParticleField />

      {/* Radial glow behind logo */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* ── HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center z-10">

        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6 mb-10"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/40 flex items-center justify-center breathing-glow">
            <VoraIcon className="w-11 h-11 text-[#FFD700]" />
          </div>

          <div>
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none neon-text mb-2">
              VORA AI
            </h1>
            <p className="text-[#FFD700]/50 text-sm uppercase tracking-[0.4em] font-semibold">
              Website Intelligence Engine
            </p>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="max-w-2xl mb-12"
        >
          <p className="text-2xl sm:text-3xl font-light text-white/80 leading-relaxed">
            Speak it. Type it.{" "}
            <span className="text-[#FFD700] font-bold">Ship it.</span>
          </p>
          <p className="text-white/40 mt-4 text-base max-w-lg mx-auto leading-relaxed">
            The world's most powerful AI website builder. Turn a single sentence into a fully-coded, SEO-optimised website in seconds.
          </p>
        </motion.div>

        {/* GET STARTED button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          <button
            onClick={handleGetStarted}
            className="laser-hover group relative inline-flex items-center gap-3 px-12 py-5 rounded-full bg-[#FFD700] text-[#080808] font-black text-xl tracking-wide shadow-[0_0_40px_rgba(255,215,0,0.5),0_0_80px_rgba(255,215,0,0.25)] hover:shadow-[0_0_60px_rgba(255,215,0,0.7),0_0_120px_rgba(255,215,0,0.35)] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            GET STARTED
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-white/25 text-xs mt-4 tracking-wider">
            Free · No credit card required · 3 builds on starter
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="flex gap-8 sm:gap-14 mt-16"
        >
          {[
            { value: "< 8s", label: "Avg Build Time" },
            { value: "6 Keys", label: "AI Load Balancer" },
            { value: "100%", label: "SEO Ready" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-black text-[#FFD700]">{value}</div>
              <div className="text-white/30 text-xs uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 flex flex-col items-center gap-1 text-white/20 text-xs"
        >
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </section>

      {/* ── ABOUT SECTION ──────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/5 text-[#FFD700] text-xs font-bold uppercase tracking-widest mb-6">
            About Vora AI
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-5">
            A new class of{" "}
            <span className="text-[#FFD700]">intelligence</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            Vora AI is not a template tool. It is a real-time AI engineering system powered by Google Gemini 2.5 Flash — the most capable generative AI model available today. Every site generated is unique, production-ready, and built to rank.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {ABOUT_FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-[#FFD700]/10 bg-[#FFD700]/3 p-6 hover:border-[#FFD700]/25 hover:bg-[#FFD700]/5 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Who is it for */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-12 rounded-2xl border border-white/8 bg-white/3 p-8 text-center"
        >
          <h3 className="font-black text-2xl mb-3 text-white">Who is Vora AI built for?</h3>
          <p className="text-white/50 text-base leading-relaxed max-w-3xl mx-auto">
            Entrepreneurs who need landing pages fast. YouTubers who want portfolio sites. Freelancers who need to prototype for clients. Developers who want a head start. If you can describe what you want, Vora AI can build it — in seconds, not days.
          </p>
        </motion.div>
      </section>

      {/* ── TERMS & CONDITIONS ─────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/3 text-white/40 text-xs font-bold uppercase tracking-widest mb-4">
              <Lock className="w-3 h-3" /> Legal
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white">Terms & Conditions</h2>
            <p className="text-white/30 text-sm mt-2">Last updated: May 2025</p>
          </motion.div>

          <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-white/3 transition-colors"
            >
              <span className="font-semibold text-white/70">Read full Terms & Conditions</span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${showTerms ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showTerms && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-white/40 text-sm leading-loose space-y-5 border-t border-white/5 pt-6">
                    {[
                      { title: "1. Acceptance of Terms", body: "By accessing or using Vora AI, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you may not access the service. These terms apply to all visitors, users, and others who access or use the platform." },
                      { title: "2. Use of the Service", body: "Vora AI is a website generation platform powered by artificial intelligence. You may use the service to generate HTML websites for personal or commercial purposes. You agree not to use the service for any unlawful purposes, to generate harmful, malicious, or deceptive content, to scrape or exploit the API infrastructure, or to attempt to reverse-engineer the AI generation pipeline." },
                      { title: "3. AI-Generated Content", body: "Websites generated by Vora AI are produced by an AI model (Google Gemini 2.5 Flash). The output is provided 'as-is'. Vora AI does not guarantee the accuracy, completeness, or fitness for purpose of any generated content. You are solely responsible for reviewing, modifying, and deploying any generated website." },
                      { title: "4. Intellectual Property", body: "HTML output generated by the platform during your session is owned by you. Vora AI retains rights to the platform, underlying software, the AI prompt engineering system, branding, and all proprietary technology. You may not reproduce or resell the Vora AI platform itself." },
                      { title: "5. API Usage & Rate Limits", body: "The platform uses a 6-key Gemini API rotation system with rate limiting to protect infrastructure. Free tier users are limited to 3 builds. Pro and Billionaire tiers receive expanded access. Attempting to circumvent rate limits or exploit the API system may result in account termination." },
                      { title: "6. Privacy & Data", body: "We collect your email address, display name, and generated projects (if saved). Data is stored in Firebase Firestore. Gemini API calls are processed by Google. We do not sell your data to third parties. You may delete your account and all associated data by contacting support." },
                      { title: "7. Payments & Subscriptions", body: "Paid plans (Pro and Billionaire) are processed via Razorpay. All transactions are in INR. Subscriptions are non-refundable unless required by applicable law. Vora AI reserves the right to change pricing with 30 days' notice." },
                      { title: "8. Limitation of Liability", body: "Vora AI is provided 'as is' without warranty of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the platform. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim." },
                      { title: "9. Modifications", body: "Vora AI reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes your acceptance of the new terms. We will notify users of material changes via email or in-app notification." },
                      { title: "10. Governing Law", body: "These terms are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts located in India." },
                    ].map(({ title, body }) => (
                      <div key={title}>
                        <h4 className="font-bold text-white/60 mb-1.5">{title}</h4>
                        <p>{body}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 text-center border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white mb-4">
            Ready to build your{" "}
            <span className="text-[#FFD700]">next website?</span>
          </h2>
          <p className="text-white/35 mb-8 text-base">No design skills. No coding. Just a single sentence.</p>
          <button
            onClick={handleGetStarted}
            className="laser-hover inline-flex items-center gap-3 px-10 py-4 rounded-full bg-[#FFD700] text-[#080808] font-black text-lg tracking-wide shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:shadow-[0_0_50px_rgba(255,215,0,0.6)] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            GET STARTED FREE
          </button>
        </motion.div>

        {/* Footer */}
        <div className="mt-16 text-white/15 text-xs">
          <div className="flex items-center justify-center gap-2 mb-2">
            <VoraIcon className="w-4 h-4 text-[#FFD700]/40" />
            <span className="font-bold tracking-widest">VORA AI</span>
          </div>
          <p>© {new Date().getFullYear()} Vora AI. All rights reserved. Powered by Gemini 2.5 Flash.</p>
          <p className="mt-1">
            <button onClick={() => setShowTerms(true)} className="underline hover:text-white/30 transition-colors">Terms & Conditions</button>
            {" · "}
            <span>Privacy Policy</span>
          </p>
        </div>
      </section>
    </div>
  );
}
