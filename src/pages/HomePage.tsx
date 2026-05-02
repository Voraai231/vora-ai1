import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { VoraIcon } from "@/components/VoraIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { getSystemHealth, getKeyMonitorInfo } from "@/lib/gemini";
import { useSpeech } from "@/hooks/useSpeech";
import {
  Sparkles, Mic, Loader2, ArrowRight, Folder, BookOpen,
  Crown, LogOut, Clapperboard, ShieldCheck, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isRootOwner } from "@/hooks/useTier";

const PROMPT_SPARKS = [
  "A luxury watch brand landing page with dark ambiance and gold accents…",
  "A sleek SaaS dashboard for project management with modern UI…",
  "A personal portfolio for a UI/UX designer with case studies…",
  "A restaurant website with online reservation and menu…",
  "A minimalist blog for a tech writer with clean typography…",
  "A crypto trading platform landing page with live chart vibes…",
];

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

  // Rotate placeholder text
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const healthColor = health.status === "GREEN"
    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
    : health.status === "YELLOW"
    ? "bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.8)]"
    : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.05)_0%,transparent_70%)]" />
      </div>

      {/* ── MINIMAL HEADER ──────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        {/* Logo + badge */}
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center breathing-glow">
              <VoraIcon className="w-4.5 h-4.5 text-[#FFD700]" />
            </div>
            <span className="font-black text-sm tracking-widest neon-text hidden sm:block">VORA AI</span>
          </button>
          {/* Health dot */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/8 bg-white/3">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${healthColor}`} />
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider hidden sm:block">
              {keyMonitor.configured}/6 keys
            </span>
          </div>
        </div>

        {/* User controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9 border border-[#FFD700]/20">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="text-[#FFD700] bg-[#FFD700]/10 text-xs font-black">
                      {user.displayName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0d0d0d] border-white/10">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium truncate text-white">{user.displayName}</p>
                  <p className="text-xs text-white/40 truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem onClick={() => setLocation("/projects")} className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5">
                  <Folder className="w-4 h-4 mr-2" /> My Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/learn")} className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5">
                  <BookOpen className="w-4 h-4 mr-2" /> Learning Hub
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/studio")} className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5">
                  <Clapperboard className="w-4 h-4 mr-2" /> Content Studio
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-[#FFD700] focus:text-[#FFD700] focus:bg-[#FFD700]/5">
                  <Crown className="w-4 h-4 mr-2" /> {tier.toUpperCase()}
                </DropdownMenuItem>
                {isRootOwnerUser && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5">
                    <ShieldCheck className="w-4 h-4 mr-2" /> Admin Console
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem onClick={() => void signOut()} className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/5">
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/auth")}
              className="rounded-full border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10 hover:border-[#FFD700]/60 bg-transparent text-xs font-bold px-4"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In
            </Button>
          )}
        </div>
      </header>

      {/* ── CENTER PROMPT ZONE ─────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 -mt-8">

        {/* Welcome text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white mb-3">
            What can I build{" "}
            <span className="text-[#FFD700]">for you?</span>
          </h1>
          <p className="text-white/35 text-sm sm:text-base">
            Describe your dream website. I'll generate it in seconds.
          </p>
        </motion.div>

        {/* Gemini-style prompt box */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-2xl"
        >
          <div className={`relative rounded-2xl border transition-all duration-300 ${
            focused
              ? "border-[#FFD700]/50 shadow-[0_0_0_1px_rgba(255,215,0,0.15),0_8px_40px_rgba(255,215,0,0.12)]"
              : "border-white/12 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          } bg-[#111111]`}>

            {/* Textarea */}
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
              onKeyDown={handleKeyDown}
              placeholder={focused ? "Describe your dream website…" : PROMPT_SPARKS[placeholderIdx]}
              rows={3}
              className="w-full bg-transparent resize-none text-white text-base sm:text-lg placeholder:text-white/20 focus:outline-none px-5 pt-5 pb-3 leading-relaxed"
              style={{ minHeight: "110px", maxHeight: "200px" }}
            />

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-4 pb-4 pt-1">
              <div className="flex items-center gap-2">
                {/* Voice */}
                <button
                  onClick={toggleListening}
                  disabled={!supported}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "text-white/25 hover:text-white/50 hover:bg-white/5"
                  }`}
                  title={isListening ? "Stop recording" : "Voice input"}
                >
                  {isListening ? (
                    <div className="relative">
                      <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
                      <Mic className="w-4 h-4 relative" />
                    </div>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
                <span className="text-white/15 text-xs hidden sm:block">Ctrl+Enter to send</span>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
                  prompt.trim()
                    ? "bg-[#FFD700] text-[#080808] shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_35px_rgba(255,215,0,0.6)] hover:scale-105 active:scale-95"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Ship it
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hint chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 justify-center mt-5"
          >
            {[
              "Landing Page",
              "Portfolio",
              "Blog",
              "Restaurant",
              "Agency",
              "Product Page",
            ].map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setPrompt(`A modern ${tag.toLowerCase()} website with premium design, dark theme, and gold accents`);
                  textareaRef.current?.focus();
                }}
                className="px-3 py-1.5 rounded-full text-xs text-white/35 border border-white/8 bg-white/3 hover:border-[#FFD700]/30 hover:text-[#FFD700]/70 hover:bg-[#FFD700]/5 transition-all"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────── */}
      <footer className="relative z-10 flex items-center justify-center gap-6 py-5 text-white/20 text-xs">
        <span>Gemini 2.5 Flash</span>
        <span>·</span>
        <span>6-Key Load Balancer</span>
        <span>·</span>
        <span>Auto-SEO</span>
      </footer>
    </div>
  );
}
