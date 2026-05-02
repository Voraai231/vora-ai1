import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { VoraIcon } from "@/components/VoraIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useTier, isRootOwner } from "@/hooks/useTier";
import { getSystemHealth, getKeyMonitorInfo } from "@/lib/gemini";
import { useSpeech } from "@/hooks/useSpeech";
import {
  Sparkles, Mic, ArrowRight, Folder, BookOpen,
  Crown, LogOut, Clapperboard, ShieldCheck, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PROMPT_SPARKS = [
  "A luxury watch brand landing page with dark ambiance and silver accents…",
  "A sleek SaaS dashboard for project management with modern UI…",
  "A personal portfolio for a UI/UX designer with case studies…",
  "A restaurant website with online reservation and menu…",
  "A minimalist blog for a tech writer with clean typography…",
  "A crypto trading platform with live chart vibes…",
];

const CHIPS = ["Landing Page", "Portfolio", "Blog", "Restaurant", "Agency", "Product Page"];

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { tier } = useTier();
  const { isListening, transcript, supported, toggleListening } = useSpeech();
  const health = getSystemHealth();
  const keyMonitor = getKeyMonitorInfo();
  const isRootOwnerUser = isRootOwner(user?.email);

  useEffect(() => {
    const id = setInterval(() => {
      if (!focused && !prompt) setPlaceholderIdx(i => (i + 1) % PROMPT_SPARKS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [focused, prompt]);

  useEffect(() => {
    if (transcript) setPrompt(prev => prev + transcript);
  }, [transcript]);

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    sessionStorage.setItem("vora.pendingPrompt", prompt.trim());
    setLocation("/build");
  };

  const iceColor =
    health.status === "GREEN" ? "#00E5FF" :
    health.status === "YELLOW" ? "#FFB800" : "#FF4444";

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.04)_0%,transparent_70%)]" />
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl glass-card border border-[#00E5FF]/20 flex items-center justify-center breathing-glow">
              <VoraIcon className="w-4 h-4 text-[#E5E4E2]" />
            </div>
            <span className="font-black text-sm tracking-widest neon-text hidden sm:block">VORA AI</span>
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-surface border border-[#E5E4E2]/8">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: iceColor, boxShadow: `0 0 6px ${iceColor}` }} />
            <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider hidden sm:block">
              {keyMonitor.configured}/6 keys
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-white/5">
                  <Avatar className="h-8 w-8 border border-[#E5E4E2]/15">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="text-[#E5E4E2] bg-[#E5E4E2]/8 text-xs font-black">
                      {user.displayName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0a0a0a] border-[#E5E4E2]/10">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium truncate text-[#E5E4E2]">{user.displayName}</p>
                  <p className="text-xs text-white/35 truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E5E4E2]/8" />
                <DropdownMenuItem onClick={() => setLocation("/projects")} className="cursor-pointer text-white/60 hover:text-white focus:text-white focus:bg-white/4">
                  <Folder className="w-4 h-4 mr-2" /> My Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/learn")} className="cursor-pointer text-white/60 hover:text-white focus:text-white focus:bg-white/4">
                  <BookOpen className="w-4 h-4 mr-2" /> Learning Hub
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/studio")} className="cursor-pointer text-white/60 hover:text-white focus:text-white focus:bg-white/4">
                  <Clapperboard className="w-4 h-4 mr-2" /> Content Studio
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-[#00E5FF]/80 focus:text-[#00E5FF] focus:bg-[#00E5FF]/5">
                  <Crown className="w-4 h-4 mr-2" /> {tier.toUpperCase()}
                </DropdownMenuItem>
                {isRootOwnerUser && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer text-white/60 hover:text-white focus:text-white focus:bg-white/4">
                    <ShieldCheck className="w-4 h-4 mr-2" /> Admin Console
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-[#E5E4E2]/8" />
                <DropdownMenuItem onClick={() => void signOut()} className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/5">
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setLocation("/auth")}
              className="rounded-full border-[#E5E4E2]/20 text-[#E5E4E2]/70 hover:bg-[#E5E4E2]/5 hover:border-[#00E5FF]/30 hover:text-[#E5E4E2] bg-transparent text-xs font-bold px-4 transition-all">
              <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In
            </Button>
          )}
        </div>
      </header>

      {/* ── CENTER PROMPT ──────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 -mt-10">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }} className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white mb-3">
            What can I build{" "}
            <span className="ice-text">for you?</span>
          </h1>
          <p className="text-white/30 text-sm sm:text-base">
            Describe your dream website. I'll generate it in seconds.
          </p>
        </motion.div>

        {/* Gemini-style box */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }} className="w-full max-w-2xl">
          <div
            className="relative rounded-2xl transition-all duration-300 prompt-float"
            style={{
              background: "rgba(20,20,20,0.9)",
              border: focused ? "1px solid rgba(0,229,255,0.3)" : "1px solid rgba(229,228,226,0.08)",
              boxShadow: focused
                ? "0 0 0 1px rgba(0,229,255,0.08), 0 8px 50px rgba(0,0,0,0.7), 0 0 40px rgba(0,229,255,0.06)"
                : undefined,
            }}
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(); } }}
              placeholder={focused ? "Describe your dream website…" : PROMPT_SPARKS[placeholderIdx]}
              rows={3}
              className="w-full bg-transparent resize-none text-white text-base sm:text-lg placeholder:text-white/18 focus:outline-none px-5 pt-5 pb-3 leading-relaxed"
              style={{ minHeight: "110px", maxHeight: "200px" }}
            />

            <div className="flex items-center justify-between px-4 pb-4 pt-1">
              <div className="flex items-center gap-2">
                <button onClick={toggleListening} disabled={!supported}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isListening ? "bg-red-500/15 text-red-400 border border-red-500/30" : "text-white/20 hover:text-white/40 hover:bg-white/4"
                  }`}>
                  {isListening ? (
                    <div className="relative">
                      <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                      <Mic className="w-4 h-4 relative" />
                    </div>
                  ) : <Mic className="w-4 h-4" />}
                </button>
                <span className="text-white/12 text-xs hidden sm:block">Ctrl+Enter to send</span>
              </div>

              <button onClick={handleSubmit} disabled={!prompt.trim()}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
                  prompt.trim()
                    ? "hover:scale-105 active:scale-95"
                    : "opacity-30 cursor-not-allowed"
                }`}
                style={prompt.trim() ? {
                  background: "linear-gradient(135deg, #f0efed 0%, #E5E4E2 50%, #c8c7c5 100%)",
                  color: "#050505",
                  boxShadow: "0 0 20px rgba(229,228,226,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
                } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                <Sparkles className="w-4 h-4" />
                Ship it
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chips */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 justify-center mt-5">
            {CHIPS.map(tag => (
              <button key={tag}
                onClick={() => {
                  setPrompt(`A modern ${tag.toLowerCase()} website with premium design and minimal aesthetic`);
                  textareaRef.current?.focus();
                }}
                className="px-3 py-1.5 rounded-full text-xs text-white/30 border border-[#E5E4E2]/8 bg-white/2 hover:border-[#00E5FF]/25 hover:text-[#00E5FF]/60 hover:bg-[#00E5FF]/4 transition-all duration-200">
                {tag}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </main>

      <footer className="relative z-10 flex items-center justify-center gap-5 py-5 text-white/15 text-xs">
        <span>Gemini 2.5 Flash</span>
        <span className="text-[#00E5FF]/20">·</span>
        <span>6-Key Load Balancer</span>
        <span className="text-[#00E5FF]/20">·</span>
        <span>Auto-SEO</span>
      </footer>
    </div>
  );
}
