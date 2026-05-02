import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { VoraIcon } from "@/components/VoraIcon";
import { useAuth } from "@/contexts/AuthContext";
import { usePWA } from "@/hooks/usePWA";
import {
  ChevronDown, Shield, Zap, Globe2, Code2, ArrowRight, Sparkles,
  Share2, Plus, X, CheckCircle2, Download,
} from "lucide-react";

/* ── Particle Field — Ice Blue + Silver ─────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; ice: boolean }[] = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.2 + 0.2, alpha: Math.random() * 0.4 + 0.08,
        ice: Math.random() > 0.6,
      });
    }
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.ice ? `rgba(0,229,255,${p.alpha})` : `rgba(229,228,226,${p.alpha * 0.6})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,229,255,${0.05 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.4;
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

/* ── iOS Install Instructions Modal ─────────────────────────────── */
function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm rounded-3xl overflow-hidden"
          style={{ background: "rgba(10,10,10,0.98)", border: "1px solid rgba(229,228,226,0.1)" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center breathing-glow"
                style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.2)" }}>
                <VoraIcon className="w-6 h-6 text-[#E5E4E2]" />
              </div>
              <div>
                <h3 className="font-black text-[#E5E4E2] text-base leading-tight">Add to Home Screen</h3>
                <p className="text-white/35 text-xs">Install Vora AI on your iPhone</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Steps */}
          <div className="px-6 pb-6 space-y-4">
            {[
              {
                icon: <Share2 className="w-5 h-5 text-[#00E5FF]" />,
                step: "1",
                title: "Tap the Share button",
                desc: "Find the Share icon (↑) in Safari's bottom toolbar",
              },
              {
                icon: <Plus className="w-5 h-5 text-[#00E5FF]" />,
                step: "2",
                title: 'Tap "Add to Home Screen"',
                desc: 'Scroll down in the Share sheet and tap the "Add to Home Screen" option',
              },
              {
                icon: <CheckCircle2 className="w-5 h-5 text-[#00E5FF]" />,
                step: "3",
                title: 'Tap "Add"',
                desc: "Confirm the name and tap Add. Vora AI will appear on your home screen.",
              },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)" }}>
                  {icon}
                </div>
                <div>
                  <p className="text-[#E5E4E2] text-sm font-semibold leading-tight mb-0.5">{title}</p>
                  <p className="text-white/35 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}

            <div className="mt-2 p-3 rounded-xl" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.1)" }}>
              <p className="text-[#00E5FF]/60 text-xs text-center leading-relaxed">
                💡 Only available in <strong className="text-[#00E5FF]/80">Safari</strong>. If you're using Chrome or another browser, open this page in Safari first.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Android Install Banner ──────────────────────────────────────── */
function AndroidInstallBanner({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 left-4 right-4 z-[100] mx-auto max-w-sm rounded-2xl flex items-center gap-4 px-5 py-4"
      style={{
        background: "rgba(8,8,8,0.97)",
        border: "1px solid rgba(0,229,255,0.2)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.8), 0 0 30px rgba(0,229,255,0.08)",
      }}
    >
      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center breathing-glow"
        style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.2)" }}>
        <VoraIcon className="w-5 h-5 text-[#E5E4E2]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#E5E4E2] text-sm font-bold leading-tight">Install Vora AI</p>
        <p className="text-white/35 text-xs">Add to home screen for the best experience</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onDismiss} className="text-white/25 hover:text-white/50 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <button onClick={onInstall}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #f0efed 0%, #E5E4E2 50%, #c8c7c5 100%)",
            color: "#050505",
          }}>
          <Download className="w-3 h-3" />
          Install
        </button>
      </div>
    </motion.div>
  );
}

/* ── Features ─────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: <Zap className="w-5 h-5 text-[#00E5FF]" />, title: "Instant AI Generation", desc: "Describe any website in plain English. Vora's 6-key Gemini 2.5 Flash engine generates a fully-coded, production-ready HTML site in seconds — SEO metadata, Open Graph tags, and Schema.org markup included." },
  { icon: <Globe2 className="w-5 h-5 text-[#00E5FF]" />, title: "Auto-SEO Built In", desc: "Every build auto-generates meta descriptions, canonical links, Twitter Cards, sitemap.xml, and robots.txt. Your sites rank from day one with zero extra effort." },
  { icon: <Code2 className="w-5 h-5 text-[#00E5FF]" />, title: "Live Code + Preview", desc: "Watch your website materialize in real-time. The split-panel factory streams raw HTML as your live preview renders frame by frame, character by character." },
  { icon: <Shield className="w-5 h-5 text-[#00E5FF]" />, title: "6-Key Load Balancer", desc: "Six independent Gemini API keys rotate automatically. If any key hits a rate limit, the engine instantly switches — zero downtime, zero interruptions, 100% uptime." },
];

/* ── LANDING PAGE ────────────────────────────────────────────────── */
export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);

  const { installState, isIOS, isStandalone, canInstall, triggerInstall } = usePWA();

  // Show Android install banner when prompt is available
  useEffect(() => {
    if (installState === "available" && !isStandalone) {
      const timer = setTimeout(() => setShowAndroidBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [installState, isStandalone]);

  const handleGetStarted = () => {
    if (user) setLocation("/home");
    else setLocation("/auth");
  };

  const handleIOSButton = () => setShowIOSModal(true);

  const handleAndroidButton = async () => {
    if (installState === "available") {
      await triggerInstall();
    } else if (installState === "installed" || isStandalone) {
      setLocation("/home");
    } else {
      // Not yet available — show a toast-like message
      setShowAndroidBanner(true);
    }
  };

  const handleAndroidInstall = async () => {
    setShowAndroidBanner(false);
    await triggerInstall();
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white overflow-x-hidden overflow-y-auto selection:bg-[#00E5FF]/20 selection:text-[#00E5FF]">
      <div className="scan-line" />
      <ParticleField />

      {/* iOS install modal */}
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}

      {/* Android install banner */}
      <AnimatePresence>
        {showAndroidBanner && (
          <AndroidInstallBanner
            onInstall={handleAndroidInstall}
            onDismiss={() => setShowAndroidBanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Ambient radial glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center z-10">

        <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-7 mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-[#00E5FF]/10 blur-2xl scale-150" />
            <div className="relative w-24 h-24 rounded-3xl glass-card border border-[#00E5FF]/20 flex items-center justify-center breathing-glow">
              <VoraIcon className="w-13 h-13 text-[#E5E4E2]" />
            </div>
          </div>
          <div>
            <h1 className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter leading-none mb-3">
              <span className="neon-text">VORA AI</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-[#00E5FF]/30" />
              <p className="text-[#00E5FF]/60 text-xs uppercase tracking-[0.5em] font-semibold">Platinum Intelligence Engine</p>
              <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-[#00E5FF]/30" />
            </div>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }} className="max-w-2xl mb-12">
          <p className="text-2xl sm:text-3xl font-light text-white/75 leading-relaxed">
            Speak it. Type it.{" "}
            <span className="font-bold text-[#E5E4E2]">Ship it.</span>
          </p>
          <p className="text-white/35 mt-4 text-base max-w-lg mx-auto leading-relaxed">
            The world's most powerful AI website builder. Turn a single sentence into a fully-coded, SEO-optimised website in seconds.
          </p>
        </motion.div>

        {/* CTA + Store Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }} className="flex flex-col items-center gap-4">

          {/* Primary CTA */}
          <button
            onClick={handleGetStarted}
            data-testid="button-get-started"
            className="laser-hover group relative inline-flex items-center gap-3 px-12 py-5 rounded-full font-black text-xl tracking-wide transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f0efed 0%, #E5E4E2 40%, #d0cfcd 100%)",
              color: "#050505",
              boxShadow: "0 0 40px rgba(229,228,226,0.2), 0 0 80px rgba(229,228,226,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            GET STARTED
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* App Store Buttons */}
          <div className="flex gap-3 mt-1">
            {/* iOS */}
            <button
              onClick={handleIOSButton}
              data-testid="button-ios-install"
              className="laser-hover flex items-center gap-2.5 px-5 py-2.5 rounded-xl glass-card border border-[#E5E4E2]/10 hover:border-[#00E5FF]/25 transition-all duration-300 group"
            >
              <svg className="w-5 h-5 text-[#E5E4E2]/80 group-hover:text-[#E5E4E2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-white/35 leading-none">Download on the</div>
                <div className="text-xs font-bold text-[#E5E4E2]/80 group-hover:text-[#E5E4E2] leading-tight">App Store</div>
              </div>
              {isStandalone && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5FF] ml-1" />
              )}
            </button>

            {/* Android / Chrome install */}
            <button
              onClick={handleAndroidButton}
              data-testid="button-android-install"
              className="laser-hover flex items-center gap-2.5 px-5 py-2.5 rounded-xl glass-card border border-[#E5E4E2]/10 hover:border-[#00E5FF]/25 transition-all duration-300 group"
            >
              <svg className="w-5 h-5 text-[#E5E4E2]/80 group-hover:text-[#E5E4E2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.22.99.13l12.12-6.99-2.55-2.55-10.56 9.41zm-1.81-20.1c-.08.2-.13.43-.13.69v19.3c0 .26.05.49.14.69l.07.07 10.81-10.81v-.26L1.44 3.59l-.07.07zm18.44 8.81l-2.74-1.58-2.87 2.87 2.87 2.87 2.75-1.58c.79-.45.79-1.18-.01-1.58zm-17.26 8.8l10.56-9.41-2.55-2.55-12.12 6.99c-.35.2-.56.56-.54.95.02.29.13.56.32.76l4.33-4.33v7.59z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-white/35 leading-none">
                  {installState === "installed" || isStandalone ? "App installed" : "Get it on"}
                </div>
                <div className="text-xs font-bold text-[#E5E4E2]/80 group-hover:text-[#E5E4E2] leading-tight">
                  {installState === "available" ? "Install Now" : "Google Play"}
                </div>
              </div>
              {(installState === "installed" || isStandalone) && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5FF] ml-1" />
              )}
              {installState === "available" && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] ml-1 animate-pulse" />
              )}
            </button>
          </div>

          <p className="text-white/20 text-xs tracking-wider mt-1">Free to start · No credit card required</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex gap-10 sm:gap-16 mt-16">
          {[
            { value: "< 8s", label: "Avg Build Time" },
            { value: "6", label: "AI Key Slots" },
            { value: "100%", label: "SEO Ready" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-black text-[#E5E4E2]">{value}</div>
              <div className="text-[#00E5FF]/40 text-[10px] uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-8 flex flex-col items-center gap-1 text-white/15 text-xs">
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-[#00E5FF]/15 text-[#00E5FF]/70 text-xs font-bold uppercase tracking-widest mb-6">
            About Vora AI
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-5">
            A new class of{" "}
            <span className="ice-text">intelligence</span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
            Vora AI is not a template tool. It is a real-time AI engineering system powered by Google Gemini 2.5 Flash — generating unique, production-ready sites that rank.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 plat-border hover:border-[#00E5FF]/20 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl glass-surface border border-[#00E5FF]/15 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#E5E4E2]">{f.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Install CTA card */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mt-6 glass-card rounded-2xl p-6 border border-[#00E5FF]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#E5E4E2] mb-1">Use Vora AI like a native app</h3>
            <p className="text-white/35 text-sm">Install it on your home screen for instant access — no app store required.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleIOSButton}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold glass-surface border border-[#E5E4E2]/10 hover:border-[#00E5FF]/20 text-[#E5E4E2]/70 hover:text-[#E5E4E2] transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              iOS
            </button>
            <button onClick={handleAndroidButton}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold glass-surface border border-[#E5E4E2]/10 hover:border-[#00E5FF]/20 text-[#E5E4E2]/70 hover:text-[#E5E4E2] transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.22.99.13l12.12-6.99-2.55-2.55-10.56 9.41zm-1.81-20.1c-.08.2-.13.43-.13.69v19.3c0 .26.05.49.14.69l.07.07 10.81-10.81v-.26L1.44 3.59l-.07.07zm18.44 8.81l-2.74-1.58-2.87 2.87 2.87 2.87 2.75-1.58c.79-.45.79-1.18-.01-1.58zm-17.26 8.8l10.56-9.41-2.55-2.55-12.12 6.99c-.35.2-.56.56-.54.95.02.29.13.56.32.76l4.33-4.33v7.59z"/></svg>
              Android
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── TERMS & CONDITIONS ──────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 border-t border-[#E5E4E2]/5">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl font-black tracking-tighter text-[#E5E4E2]">Terms & Conditions</h2>
            <p className="text-white/25 text-sm mt-2">Last updated: May 2025</p>
          </motion.div>

          <div className="glass-card rounded-2xl border border-[#E5E4E2]/8 overflow-hidden">
            <button onClick={() => setShowTerms(!showTerms)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-white/2 transition-colors">
              <span className="font-semibold text-[#E5E4E2]/60 text-sm">Read full Terms & Conditions</span>
              <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-300 ${showTerms ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showTerms && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-6 text-white/35 text-sm leading-loose space-y-5 border-t border-[#E5E4E2]/5 pt-6">
                    {[
                      { title: "1. Acceptance of Terms", body: "By accessing or using Vora AI, you agree to be bound by these Terms & Conditions. If you do not agree, you may not access the service." },
                      { title: "2. Use of the Service", body: "You may use Vora AI to generate HTML websites for personal or commercial use. You agree not to use it for unlawful purposes, to generate harmful content, or to exploit the API infrastructure." },
                      { title: "3. AI-Generated Content", body: "Websites are generated by Google Gemini 2.5 Flash and provided 'as-is'. Vora AI does not guarantee accuracy or fitness for purpose. You are solely responsible for reviewing and deploying generated content." },
                      { title: "4. Intellectual Property", body: "HTML output generated during your session is owned by you. Vora AI retains rights to the platform, software, prompt engineering system, and all proprietary technology." },
                      { title: "5. API Usage & Rate Limits", body: "The platform uses a 6-key Gemini API rotation with rate limiting. Free tier users are limited to 3 builds. Attempting to circumvent rate limits may result in account termination." },
                      { title: "6. Privacy & Data", body: "We collect your email, display name, and saved projects (Firebase Firestore). We do not sell your data. You may delete your account by contacting support." },
                      { title: "7. Payments", body: "Paid plans are processed via Razorpay. Subscriptions are non-refundable unless required by applicable law. Pricing may change with 30 days' notice." },
                      { title: "8. Limitation of Liability", body: "Vora AI is provided 'as is'. We are not liable for any indirect or consequential damages. Total liability shall not exceed amounts paid in the preceding 12 months." },
                      { title: "9. Governing Law", body: "These terms are governed by the laws of India. Disputes shall be subject to the courts of India." },
                    ].map(({ title, body }) => (
                      <div key={title}>
                        <h4 className="font-bold text-[#E5E4E2]/50 mb-1.5">{title}</h4>
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
      <section className="relative z-10 py-20 px-6 text-center border-t border-[#E5E4E2]/5">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#E5E4E2] mb-4">
            Ready to build your{" "}
            <span className="ice-text">next website?</span>
          </h2>
          <p className="text-white/30 mb-8 text-base">No design skills. No coding. Just a single sentence.</p>
          <button onClick={handleGetStarted}
            className="laser-hover inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-lg tracking-wide transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f0efed 0%, #E5E4E2 50%, #d0cfcd 100%)",
              color: "#050505",
              boxShadow: "0 0 30px rgba(229,228,226,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}>
            <Sparkles className="w-5 h-5" /> GET STARTED FREE
          </button>
        </motion.div>

        <div className="mt-16 text-white/12 text-xs">
          <div className="flex items-center justify-center gap-2 mb-2">
            <VoraIcon className="w-4 h-4 text-[#E5E4E2]/20" />
            <span className="font-bold tracking-widest text-[#E5E4E2]/20">VORA AI</span>
          </div>
          <p>© {new Date().getFullYear()} Vora AI. All rights reserved. Powered by Gemini 2.5 Flash.</p>
          <p className="mt-1">
            <button onClick={() => setShowTerms(true)} className="underline hover:text-white/25 transition-colors">Terms & Conditions</button>
            {" · "}Privacy Policy
          </p>
        </div>
      </section>
    </div>
  );
}
