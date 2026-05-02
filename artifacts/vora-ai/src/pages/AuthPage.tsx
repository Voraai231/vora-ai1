import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { VoraIcon } from "@/components/VoraIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function CodeRainBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const chars = "01アイウエオカキクケコサシスセソVORAIABCDEFGHIJKLMNOP";
    const fontSize = 14;
    let cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1).map(() => Math.random() * -50);
    const draw = () => {
      ctx.fillStyle = "rgba(8,8,8,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const progress = drops[i] / (canvas.height / fontSize);
        if (progress < 0.2) ctx.fillStyle = "rgba(255,255,255,0.9)";
        else if (progress < 0.5) ctx.fillStyle = "rgba(255,215,0,0.8)";
        else ctx.fillStyle = "rgba(255,215,0,0.2)";
        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      cols = Math.floor(canvas.width / fontSize);
      while (drops.length < cols) drops.push(0);
    };
    const interval = setInterval(draw, 50);
    window.addEventListener("resize", resize);
    return () => { clearInterval(interval); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn, signInWithEmail, registerWithEmail, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn();
    } catch (err: any) {
      toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (mode === "register" && !name.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        toast({ title: "Welcome back!", description: "You're now signed in." });
      } else {
        await registerWithEmail(email, password, name);
        toast({ title: "Account created!", description: "Welcome to Vora AI." });
      }
      setLocation("/");
    } catch (err: any) {
      const msg = err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
        ? "Invalid email or password."
        : err.code === "auth/email-already-in-use"
        ? "Email already registered. Please sign in instead."
        : err.code === "auth/user-not-found"
        ? "No account found. Please register."
        : err.message || "Authentication failed.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white flex overflow-hidden relative">
      {/* Code Rain Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <CodeRainBg />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#080808]/70 to-[#080808] pointer-events-none" />

      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-md"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center breathing-glow">
              <VoraIcon className="w-7 h-7 text-[#FFD700]" />
            </div>
            <span className="text-2xl font-black tracking-tight neon-text">VORA AI</span>
          </div>

          <h1 className="text-5xl font-black tracking-tighter leading-[1.05] mb-6">
            Build websites<br />
            <span className="text-[#FFD700]">at the speed</span><br />
            of thought.
          </h1>
          <p className="text-white/50 text-lg leading-relaxed mb-10">
            Describe your dream website in plain English. Vora AI generates a complete, SEO-optimised HTML site in seconds — ready to ship.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Sites Built", value: "10K+" },
              { label: "API Keys", value: "6 Active" },
              { label: "Avg Build", value: "< 8s" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-4 text-center">
                <div className="text-2xl font-black text-[#FFD700]">{value}</div>
                <div className="text-xs text-white/40 mt-1 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — auth form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 relative z-10 shrink-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center breathing-glow">
              <VoraIcon className="w-6 h-6 text-[#FFD700]" />
            </div>
            <span className="text-xl font-black tracking-tight neon-text">VORA AI</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl shadow-black/50">
            {/* Tab switcher */}
            <div className="flex bg-white/5 rounded-xl p-1 mb-7 border border-white/10">
              {(["login", "register"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    mode === m
                      ? "bg-[#FFD700] text-[#080808] shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-black mb-1">
                  {mode === "login" ? "Welcome back" : "Join Vora AI"}
                </h2>
                <p className="text-white/40 text-sm mb-6">
                  {mode === "login" ? "Sign in to your workspace" : "Create your free account"}
                </p>

                {/* Google Sign-In */}
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full h-12 bg-white text-[#080808] hover:bg-white/90 font-bold rounded-xl mb-4 flex items-center gap-3 justify-center border-0 shadow-lg"
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "register" && (
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs uppercase tracking-wider">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Your full name"
                          className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl focus:border-[#FFD700]/50 focus:ring-[#FFD700]/20"
                          autoComplete="name"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl focus:border-[#FFD700]/50 focus:ring-[#FFD700]/20"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl focus:border-[#FFD700]/50 focus:ring-[#FFD700]/20"
                        autoComplete={mode === "register" ? "new-password" : "current-password"}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="laser-hover w-full h-12 bg-[#FFD700] text-[#080808] hover:bg-[#FFD700]/90 font-black rounded-xl text-base tracking-wide shadow-[0_0_25px_rgba(255,215,0,0.4)] hover:shadow-[0_0_40px_rgba(255,215,0,0.6)] transition-all mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {mode === "login" ? "Sign In" : "Create Account"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-white/25 text-xs text-center mt-5">
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-[#FFD700] hover:underline font-semibold">
                    {mode === "login" ? "Create one free" : "Sign in"}
                  </button>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-white/20 text-xs">
            <Sparkles className="w-3 h-3" />
            <span>Powered by Gemini 2.5 Flash · 6-Key Load Balancer · Auto-SEO</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
