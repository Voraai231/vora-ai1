import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  streamWithFallback, getKeyMonitorInfo, getSystemHealth,
  checkRateLimit, consumeRateSlot, KeySlotInfo,
} from "@/lib/gemini";
import { useSpeech } from "@/hooks/useSpeech";
import { useAuth } from "@/contexts/AuthContext";
import { useTier, isRootOwner } from "@/hooks/useTier";
import { getProject, saveProject, updateProject } from "@/lib/projects";
import { useZipExport } from "@/hooks/useZipExport";
import { VoraIcon } from "@/components/VoraIcon";
import { PricingModal } from "@/components/PricingModal";
import { BinancePayModal } from "@/components/BinancePayModal";
import { VercelDeployModal } from "@/components/VercelDeployModal";
import { SaveProjectModal } from "@/components/SaveProjectModal";
import { PromoteModal } from "@/components/PromoteModal";
import { SEOMaster } from "@/components/SEOMaster";
import { ShareModal } from "@/components/ShareModal";
import {
  Mic, Loader2, Sparkles, Code, Copy,
  Smartphone, Tablet, Monitor, TerminalSquare, AlertTriangle,
  Wand2, Search, Crown, LogIn, Lock, MoreVertical,
  Save, Folder, LogOut, Link2, ShieldCheck, CheckCircle2,
  Clapperboard, Zap, PackageOpen, BookOpen,
  FileCode2, Globe2, FileSearch, ArrowLeft, X,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const FREE_BUILD_LIMIT = 3;
const BUILDS_KEY = "vora.free_builds";

const SYSTEM_PROMPT = `You are Vora AI, an elite frontend engineer that outputs production-quality, SEO-optimised websites.

OUTPUT CONTRACT — NON-NEGOTIABLE:
- Respond with a single complete HTML document and NOTHING ELSE.
- The very first character MUST be "<" (start of <!DOCTYPE html>).
- The very last character MUST be ">" (end of </html>).
- DO NOT wrap in markdown fences. DO NOT include prose, commentary, or explanations.

HEAD REQUIREMENTS — include ALL of these:
1. <meta charset="UTF-8">
2. <meta name="viewport" content="width=device-width, initial-scale=1.0">
3. <title>[Descriptive Title] | Vora AI</title>
4. <meta name="description" content="[150-160 char SEO description]">
5. <meta name="keywords" content="[6-10 relevant keywords]">
6. <link rel="canonical" href="https://voraai.app">
7. Open Graph tags, Twitter Card tags
8. <script src="https://cdn.tailwindcss.com"></script>
9. Google Fonts preconnect + font link
10. Schema.org JSON-LD WebPage

DESIGN REQUIREMENTS:
- Default: rich dark (slate-950/zinc-950), premium feel, Tailwind only
- Fully responsive, mobile-first (sm/md/lg breakpoints)
- Images: inline SVGs or https://placehold.co/<w>x<h>/<bg>/<fg>?text=... only
- JavaScript: inline <script> at end of <body>
- Must render inside iframe with sandbox="allow-scripts"

Remember: raw HTML only. Your entire response is the srcdoc of an iframe.`;

/* ── Code Rain (Platinum + Ice Blue) ────────────────────────────── */
function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const chars = "01アイウエオVORAIABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fontSize = 13;
    let cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);
    const draw = () => {
      ctx.fillStyle = "rgba(5,5,5,0.07)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const progress = drops[i] / (canvas.height / fontSize);
        if (progress < 0.3) ctx.fillStyle = "#E5E4E2";
        else if (progress < 0.6) ctx.fillStyle = "#00E5FF";
        else ctx.fillStyle = "rgba(0,229,255,0.25)";
        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      cols = Math.floor(canvas.width / fontSize);
      while (drops.length < cols) drops.push(Math.random() * -30);
    };
    const interval = setInterval(draw, 45);
    window.addEventListener("resize", resize);
    return () => { clearInterval(interval); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ── Utilities ───────────────────────────────────────────────────── */
function extractSeoMeta(html: string) {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const kwMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']keywords["']/i);
  return {
    title: titleMatch?.[1]?.replace(" | Vora AI", "").trim() ?? "",
    description: descMatch?.[1]?.trim() ?? "",
    keywords: kwMatch?.[1]?.trim() ?? "",
  };
}
function generateSitemap(date: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://voraai.app</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
}
function generateRobotsTxt() {
  return `User-agent: *\nAllow: /\nSitemap: https://voraai.app/sitemap.xml\n\n# Powered by Vora AI`;
}
function sanitizeHtml(raw: string): string {
  let html = raw.trim();
  html = html.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  const firstAngle = html.indexOf("<");
  if (firstAngle > 0) html = html.slice(firstAngle);
  const lastAngle = html.lastIndexOf(">");
  if (lastAngle !== -1 && lastAngle < html.length - 1) html = html.slice(0, lastAngle + 1);
  if (!html) return html;
  const lower = html.toLowerCase();
  if (!lower.includes("<html")) {
    html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Vora Preview</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-950 text-white">${html}</body></html>`;
  } else if (!lower.includes("cdn.tailwindcss.com") && lower.includes("</head>")) {
    html = html.replace(/<\/head>/i, '<script src="https://cdn.tailwindcss.com"></script></head>');
  }
  return html;
}
function getFreeBuildCount() { return parseInt(localStorage.getItem(BUILDS_KEY) || "0", 10); }
function incrementFreeBuildCount() { const n = getFreeBuildCount() + 1; localStorage.setItem(BUILDS_KEY, String(n)); return n; }

/* ── BUILDER ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "streaming" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [deviceWidth, setDeviceWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [freeBuildCount, setFreeBuildCount] = useState(getFreeBuildCount());
  const [activeKeySlot, setActiveKeySlot] = useState(0);
  const [sitemap, setSitemap] = useState("");
  const [robotsTxt, setRobotsTxt] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  const [currentProjectTitle, setCurrentProjectTitle] = useState("");
  const [currentSharedSlug, setCurrentSharedSlug] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showPricing, setShowPricing] = useState(false);
  const [showBinance, setShowBinance] = useState(false);
  const [showVercel, setShowVercel] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [promptFocused, setPromptFocused] = useState(false);
  const [mobileView, setMobileView] = useState<"preview" | "code">("preview");

  const { isListening, transcript, supported, toggleListening, setTranscript } = useSpeech();
  const { toast } = useToast();
  const { user, signIn, signOut } = useAuth();
  const { tier } = useTier();
  const { exportZip, isExporting: isZipping } = useZipExport();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeEndRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const isRootOwnerUser = isRootOwner(user?.email);
  const isLimited = !isRootOwnerUser && tier === "starter" && freeBuildCount >= FREE_BUILD_LIMIT;
  const buildsLeft = isRootOwnerUser ? Infinity : Math.max(0, FREE_BUILD_LIMIT - freeBuildCount);
  const isGenerating = status === "thinking" || status === "streaming";

  const health = getSystemHealth();
  const keyMonitor = getKeyMonitorInfo();

  const iceColor =
    health.status === "GREEN" ? "#00E5FF" :
    health.status === "YELLOW" ? "#FFB800" : "#FF4444";

  /* Pick up pending prompt from HomePage */
  useEffect(() => {
    const pending = sessionStorage.getItem("vora.pendingPrompt");
    if (pending) {
      sessionStorage.removeItem("vora.pendingPrompt");
      setPrompt(pending);
      setTimeout(() => handleGenerate(pending), 80);
    }
  }, []);

  /* Load project from URL */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && user) {
      getProject(user, id).then(p => {
        if (p) {
          setCurrentProjectId(p.id);
          setCurrentProjectTitle(p.title);
          setCurrentSharedSlug(p.sharedSlug ?? null);
          setPrompt(p.prompt);
          setHtmlContent(p.html);
          setLastPrompt(p.prompt);
          setSitemap(p.sitemap ?? "");
          setRobotsTxt(p.robotsTxt ?? "");
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (transcript) setPrompt(prev => prev.replace(transcript, "") + transcript);
  }, [transcript]);

  useEffect(() => {
    if (showCode && status === "streaming") codeEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [htmlContent, showCode, status]);

  const autoSave = async (html: string, promptText: string, sm: string, rb: string) => {
    if (!user || !html) return;
    setAutoSaveStatus("saving");
    try {
      const seo = extractSeoMeta(html);
      const data = {
        html, prompt: promptText,
        title: currentProjectTitle || promptText.slice(0, 60).trim() || "Untitled",
        sitemap: sm, robotsTxt: rb,
        seoKeywords: seo.keywords, seoDescription: seo.description,
      };
      if (currentProjectId) {
        await updateProject(user, currentProjectId, data);
      } else {
        const title = data.title.replace(/\n+/g, " ");
        const id = await saveProject(user, { ...data, title });
        setCurrentProjectId(id);
        setCurrentProjectTitle(title);
        const url = new URL(window.location.href);
        url.searchParams.set("id", id);
        window.history.replaceState({}, "", url.toString());
      }
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus(s => s === "saved" ? "idle" : s), 2400);
    } catch (err) {
      console.error("Auto-save failed", err);
      setAutoSaveStatus("idle");
    }
  };

  const handleGenerate = async (currentPrompt: string = prompt, sysPrompt: string = SYSTEM_PROMPT) => {
    if (!currentPrompt.trim()) return;
    if (tier === "starter" && sysPrompt === SYSTEM_PROMPT && freeBuildCount >= FREE_BUILD_LIMIT && !isRootOwnerUser) {
      setShowBinance(true); return;
    }
    const rl = checkRateLimit();
    if (!rl.allowed) {
      setStatus("error");
      setErrorMessage(`Rate limit reached (2/min). Resets in ${rl.resetInSec}s.`);
      return;
    }
    consumeRateSlot();
    setStatus("thinking");
    setErrorMessage("");
    if (sysPrompt === SYSTEM_PROMPT) {
      setLastPrompt(currentPrompt);
      if (tier === "starter" && !isRootOwnerUser) setFreeBuildCount(incrementFreeBuildCount());
    }
    /* auto-focus preview */
    if (isMobile) setMobileView("preview");
    void trackEvent("generation_started", { uid: user?.uid });
    try {
      let fullText = "";
      let firstChunk = true;
      for await (const chunk of streamWithFallback(currentPrompt, sysPrompt, (slot) => setActiveKeySlot(slot))) {
        fullText += chunk;
        if (firstChunk) { setStatus("streaming"); firstChunk = false; }
        setHtmlContent(sanitizeHtml(fullText));
      }
      const finalHtml = sanitizeHtml(fullText);
      const today = new Date().toISOString().split("T")[0];
      const sm = generateSitemap(today);
      const rb = generateRobotsTxt();
      setStatus("idle");
      setTranscript("");
      setSitemap(sm); setRobotsTxt(rb);
      if (finalHtml) setHtmlContent(finalHtml);
      void trackEvent("generation_complete", { uid: user?.uid });
      if (sysPrompt === SYSTEM_PROMPT && finalHtml) void autoSave(finalHtml, currentPrompt, sm, rb);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An error occurred.");
    }
  };

  const handleMagicWand = () => {
    if (tier === "starter" && !isRootOwnerUser) { setShowBinance(true); return; }
    void trackEvent("magic_wand_used", { uid: user?.uid });
    handleGenerate("Audit this HTML for UI bugs and return a FIXED full HTML. Output only raw HTML.\n\nHTML:\n" + htmlContent, "Return ONLY raw HTML. Fix all issues.");
    toast({ title: "Magic Wand activated", description: "Fixing layout and accessibility…" });
  };

  const handleSEOFix = (issues: string[]) => {
    if (tier === "starter" && !isRootOwnerUser) { setShowBinance(true); return; }
    handleGenerate(`Fix these SEO issues:\n${issues.join("\n")}\n\nHTML:\n${htmlContent}`, "Return ONLY raw HTML.");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(htmlContent);
    toast({ title: "Copied!", description: "HTML copied to clipboard." });
  };

  const handleDownload = () => {
    if (tier === "starter" && !isRootOwnerUser) { setShowBinance(true); return; }
    exportZip(htmlContent, lastPrompt, currentProjectTitle || "vora-project");
  };
  const requirePremium = (fn: () => void) => { if (tier === "starter" && !isRootOwnerUser) setShowBinance(true); else fn(); };
  const requireAuthAndPremium = (fn: () => void) => {
    if (!user) toast({ title: "Sign in required" });
    else if (tier === "starter" && !isRootOwnerUser) setShowBinance(true);
    else fn();
  };

  /* ── User Menu ─────────────────────────────────────────────────── */
  const UserMenu = () => (
    user ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-7 w-7 rounded-full p-0 hover:bg-white/5">
            <Avatar className="h-7 w-7 border border-[#E5E4E2]/15">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="text-[#E5E4E2] bg-[#E5E4E2]/8 text-[10px] font-black">{user.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-[#0a0a0a] border-[#E5E4E2]/10">
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs font-medium truncate text-[#E5E4E2]">{user.displayName}</p>
            <p className="text-[10px] text-white/30 truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#E5E4E2]/8" />
          <DropdownMenuItem onClick={() => setLocation("/projects")} className="cursor-pointer text-xs text-white/55 hover:text-white focus:text-white focus:bg-white/4">
            <Folder className="w-3.5 h-3.5 mr-2" /> My Projects
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLocation("/learn")} className="cursor-pointer text-xs text-white/55 hover:text-white focus:text-white focus:bg-white/4">
            <BookOpen className="w-3.5 h-3.5 mr-2" /> Learning Hub
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => tier === "starter" ? setShowBinance(true) : setShowPricing(true)} className="cursor-pointer text-xs text-[#00E5FF]/70 focus:text-[#00E5FF] focus:bg-[#00E5FF]/5">
            <Crown className="w-3.5 h-3.5 mr-2" /> Plan: {tier.toUpperCase()}{tier === "starter" && " · Upgrade"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLocation("/studio")} className="cursor-pointer text-xs text-white/55 hover:text-white focus:text-white focus:bg-white/4">
            <Clapperboard className="w-3.5 h-3.5 mr-2" /> Content Studio
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#E5E4E2]/8" />
          <DropdownMenuItem onClick={() => void signOut()} className="cursor-pointer text-xs text-red-400 focus:text-red-400 focus:bg-red-500/5">
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button variant="outline" size="sm" onClick={() => setLocation("/auth")}
        className="rounded-full border-[#E5E4E2]/15 text-[#E5E4E2]/60 hover:bg-[#E5E4E2]/5 hover:border-[#00E5FF]/30 bg-transparent text-[10px] font-bold px-3 h-7 transition-all">
        <LogIn className="w-3 h-3 mr-1" /> Sign In
      </Button>
    )
  );

  /* ── Toolbar Icons ─────────────────────────────────────────────── */
  const ToolbarActions = () => (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        {[
          { icon: <Save className="w-3.5 h-3.5" />, label: "Save", onClick: () => user ? setShowSave(true) : toast({ title: "Sign in required" }), disabled: !htmlContent },
          { icon: <div className="relative"><Wand2 className="w-3.5 h-3.5" />{tier === "starter" && <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5 text-[#E5E4E2]" />}</div>, label: `Magic Wand${tier === "starter" ? " (Pro)" : ""}`, onClick: handleMagicWand, disabled: !htmlContent },
          { icon: <div className="relative"><Search className="w-3.5 h-3.5" />{tier === "starter" && <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5 text-[#E5E4E2]" />}</div>, label: `SEO Master${tier === "starter" ? " (Pro)" : ""}`, onClick: () => requirePremium(() => setShowSeo(!showSeo)), disabled: !htmlContent, active: showSeo },
          { icon: <div className="relative"><Link2 className="w-3.5 h-3.5" />{currentSharedSlug && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />}</div>, label: currentSharedSlug ? "Shared" : "Share", onClick: () => { if (!user) toast({ title: "Sign in required" }); else if (!currentProjectId) toast({ title: "Save first" }); else setShowShare(true); }, disabled: !htmlContent },
          { icon: <div className="relative"><Code className="w-3.5 h-3.5" /></div>, label: "Toggle Code", onClick: () => setShowCode(v => !v), disabled: !htmlContent, active: showCode },
          { icon: <Copy className="w-3.5 h-3.5" />, label: "Copy HTML", onClick: copyCode, disabled: !htmlContent },
          { icon: isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <div className="relative"><PackageOpen className="w-3.5 h-3.5" />{tier === "starter" && !isRootOwnerUser && <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5 text-[#E5E4E2]" />}</div>, label: tier === "starter" && !isRootOwnerUser ? "Download ZIP (Pro)" : "Download ZIP", onClick: handleDownload, disabled: !htmlContent || isZipping },
          { icon: <div className="relative"><svg className="w-3.5 h-3.5" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg>{tier === "starter" && <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5 text-[#E5E4E2]" />}</div>, label: "Deploy to Vercel", onClick: () => requireAuthAndPremium(() => setShowVercel(true)), disabled: !htmlContent },
        ].map(({ icon, label, onClick, disabled, active }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon"
                className={`h-7 w-7 transition-colors ${active ? "text-[#00E5FF] bg-[#00E5FF]/8" : "text-white/30 hover:text-[#E5E4E2] hover:bg-white/4"}`}
                onClick={onClick} disabled={disabled}>{icon}</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] bg-[#0d0d0d] border-[#E5E4E2]/10">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );

  /* ── Code Panel ────────────────────────────────────────────────── */
  const CodePanel = () => (
    <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full bg-[#050505] border-r border-[#E5E4E2]/6 overflow-hidden">
      <div className="h-9 bg-[#080808] border-b border-[#E5E4E2]/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/25">
          <FileCode2 className="w-3 h-3 text-[#00E5FF]/40" />
          <span>generated.html</span>
          {status === "streaming" && <span className="text-[#00E5FF] animate-pulse ml-2">● live</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {sitemap && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00E5FF]/8 text-[#00E5FF]/70 border border-[#00E5FF]/15 uppercase tracking-wider cursor-default">
                    <Globe2 className="w-2 h-2" />sitemap
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs font-mono text-[10px] whitespace-pre-wrap bg-[#0d0d0d] border-[#E5E4E2]/10">{sitemap}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 text-white/20 hover:text-white" onClick={copyCode} disabled={!htmlContent}>
            <Copy className="w-2.5 h-2.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-white/20 hover:text-red-400" onClick={() => setShowCode(false)}>
            <X className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 text-[11px] font-mono leading-relaxed text-[#8a8a8a]">
        {htmlContent ? (
          <pre className="m-0 whitespace-pre-wrap break-all"><code>{htmlContent}</code></pre>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/12">
            <TerminalSquare className="w-8 h-8" />
            <p className="text-[10px]">Code streams here in real-time…</p>
          </div>
        )}
        <div ref={codeEndRef} />
      </div>
    </motion.div>
  );

  /* ── Preview Panel ─────────────────────────────────────────────── */
  const PreviewPanel = () => (
    <div className="flex flex-col h-full bg-[#050505] overflow-hidden relative">
      <div className="h-9 border-b border-[#E5E4E2]/5 flex items-center justify-between px-3 bg-[#080808] shrink-0 z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex gap-1 mr-1 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          </div>
          <div className="glass-surface rounded px-2 py-0.5 text-[10px] font-mono text-white/20 border border-[#E5E4E2]/6 truncate max-w-[110px] sm:max-w-none">
            vora://preview
          </div>
          {status === "streaming" && <span className="text-[10px] text-[#00E5FF] animate-pulse shrink-0">● Live</span>}
        </div>
        {!isMobile && (
          <div className="flex glass-surface rounded-lg p-0.5 border border-[#E5E4E2]/6">
            {(["desktop", "tablet", "mobile"] as const).map(w => (
              <Button key={w} variant="ghost" size="icon"
                className={`h-6 w-7 rounded-md ${deviceWidth === w ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "text-white/20 hover:text-[#E5E4E2]"}`}
                onClick={() => setDeviceWidth(w)}>
                {w === "desktop" && <Monitor className="w-3 h-3" />}
                {w === "tablet" && <Tablet className="w-3 h-3" />}
                {w === "mobile" && <Smartphone className="w-3 h-3" />}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-start overflow-auto p-2 md:p-3">
          <motion.div layout
            className={`relative rounded-xl overflow-hidden transition-all duration-500 ring-1 w-full h-full ${
              status === "streaming" ? "ring-[#00E5FF]/25 shadow-[0_0_30px_rgba(0,229,255,0.06)]" : "ring-[#E5E4E2]/5"
            } ${!htmlContent ? "bg-transparent ring-0" : "bg-white"}`}
            style={{
              maxWidth: !isMobile && deviceWidth === "mobile" ? "390px" : !isMobile && deviceWidth === "tablet" ? "768px" : "100%",
              minHeight: "100%",
            }}
          >
            <iframe
              ref={iframeRef}
              key={htmlContent ? `preview-${htmlContent.length}` : "preview-empty"}
              srcDoc={htmlContent || "<!doctype html><html><body style='margin:0;background:transparent'></body></html>"}
              className={`w-full bg-white ${!htmlContent ? "opacity-0 pointer-events-none" : "materialize"}`}
              sandbox="allow-scripts"
              title="Preview"
              style={{ height: isMobile ? "calc(100vh - 220px)" : "100%", minHeight: 400 }}
            />

            {!htmlContent && status === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center px-6">
                  <div className="w-14 h-14 rounded-2xl glass-card border border-[#00E5FF]/15 flex items-center justify-center mb-4 breathing-glow">
                    <VoraIcon className="w-7 h-7 text-[#E5E4E2]/60" />
                  </div>
                  <h2 className="text-lg font-black tracking-tighter mb-2 text-[#E5E4E2]/50">Your site renders here.</h2>
                  <p className="text-white/20 text-sm max-w-xs">Describe your website below and hit Ship it.</p>
                </motion.div>
              </div>
            )}

            {/* Thinking overlay — code rain contained within panel */}
            {(status === "thinking" || (status === "streaming" && !htmlContent)) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] rounded-xl pointer-events-none overflow-hidden">
                <CodeRain />
                <div className="absolute flex flex-col items-center gap-2 z-10">
                  <div className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-[#00E5FF]/30 bg-[#050505]/95 backdrop-blur-xl text-sm font-black text-[#E5E4E2] tracking-widest uppercase"
                    style={{ boxShadow: "0 0 30px rgba(0,229,255,0.15)" }}>
                    <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" />
                    {status === "thinking" ? "Igniting Engine…" : "Streaming…"}
                  </div>
                  <p className="text-[#00E5FF]/35 text-[10px] font-mono tracking-[0.3em] uppercase">
                    Gemini 2.5 Flash · Key {activeKeySlot + 1}/6
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showSeo && !isMobile && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="absolute right-0 top-9 bottom-0 overflow-hidden border-l border-[#E5E4E2]/6 bg-[#050505] z-20">
            <SEOMaster html={htmlContent} onFix={handleSEOFix} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ── RENDER ──────────────────────────────────────────────────────── */
  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white flex flex-col overflow-hidden">

      {/* ── COMPACT HEADER ────────────────────────────────────────── */}
      <header className="h-12 border-b border-[#E5E4E2]/6 flex items-center gap-2 px-3 bg-[#050505]/98 backdrop-blur-xl shrink-0 z-30">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/25 hover:text-[#E5E4E2] hover:bg-white/4 shrink-0"
          onClick={() => setLocation("/home")}>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>

        <div className="h-4 w-px bg-[#E5E4E2]/8 shrink-0" />

        <div className="flex items-center gap-2 shrink-0">
          <div className="h-6 w-6 rounded-lg glass-card border border-[#00E5FF]/15 flex items-center justify-center breathing-glow">
            <VoraIcon className="w-3.5 h-3.5 text-[#E5E4E2]/70" />
          </div>
          <span className="font-black text-xs tracking-widest neon-text hidden sm:block">VORA AI</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full glass-surface border border-[#E5E4E2]/6 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: iceColor, boxShadow: `0 0 5px ${iceColor}` }} />
            <span className="text-[9px] text-white/25 font-bold uppercase tracking-wider hidden md:block">{health.status}</span>
          </div>
          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
            style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.1)" }}>
            <Zap className="w-2.5 h-2.5 text-[#00E5FF]/40" />
            <span className="text-[9px] text-[#00E5FF]/35 font-bold tracking-wider uppercase">6-Key Engine</span>
          </div>
        </div>

        <div className="flex-1" />

        {tier === "starter" && !isRootOwnerUser && buildsLeft <= 3 && (
          <div className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border shrink-0 ${
            buildsLeft === 0 ? "border-red-500/25 bg-red-500/8 text-red-400" : "border-[#E5E4E2]/10 bg-[#E5E4E2]/3 text-white/35"
          }`}>
            <Zap className="w-2.5 h-2.5" />
            {buildsLeft > 0 ? `${buildsLeft} left` : "Upgrade"}
          </div>
        )}

        {autoSaveStatus === "saving" && (
          <div className="flex items-center gap-1 text-[9px] text-white/25 shrink-0">
            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving
          </div>
        )}
        {autoSaveStatus === "saved" && (
          <div className="flex items-center gap-1 text-[9px] text-[#00E5FF]/50 shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5" /> Saved
          </div>
        )}

        <div className="hidden md:flex shrink-0">
          <ToolbarActions />
        </div>

        <div className="flex md:hidden shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30"><MoreVertical className="w-3.5 h-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0a0a0a] border-[#E5E4E2]/10">
              <DropdownMenuItem onClick={() => user ? setShowSave(true) : toast({ title: "Sign in required" })} disabled={!htmlContent} className="text-xs text-white/60 focus:text-white focus:bg-white/4">
                <Save className="w-3.5 h-3.5 mr-2" /> Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMagicWand} disabled={!htmlContent} className="text-xs text-white/60 focus:text-white focus:bg-white/4">
                <Wand2 className="w-3.5 h-3.5 mr-2" /> Magic Wand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyCode} disabled={!htmlContent} className="text-xs text-white/60 focus:text-white focus:bg-white/4">
                <Copy className="w-3.5 h-3.5 mr-2" /> Copy HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} disabled={!htmlContent || isZipping} className="text-xs text-white/60 focus:text-white focus:bg-white/4">
                <PackageOpen className="w-3.5 h-3.5 mr-2" /> Download ZIP
              </DropdownMenuItem>
              {isMobile && (
                <DropdownMenuItem onClick={() => setMobileView(v => v === "preview" ? "code" : "preview")} className="text-xs text-white/60 focus:text-white focus:bg-white/4">
                  <Code className="w-3.5 h-3.5 mr-2" /> {mobileView === "preview" ? "View Code" : "View Preview"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <UserMenu />
      </header>

      {/* ── ERROR BANNER ───────────────────────────────────────────── */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-red-950/30 border-b border-red-500/15 flex items-center gap-3 text-xs text-red-400 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 min-w-0 truncate">{errorMessage}</span>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-400 hover:bg-red-500/8 shrink-0 px-2"
              onClick={() => handleGenerate(lastPrompt)}>Retry</Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400/50 hover:text-red-400 shrink-0"
              onClick={() => setStatus("idle")}>✕</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FACTORY FLOOR ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {isMobile ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {mobileView === "preview" ? <PreviewPanel /> : (
              <div className="flex-1 overflow-hidden">
                <AnimatePresence>{showCode && <CodePanel />}</AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <>
            <AnimatePresence>
              {showCode && (
                <div className="w-[42%] shrink-0 flex flex-col overflow-hidden">
                  <CodePanel />
                </div>
              )}
            </AnimatePresence>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <PreviewPanel />
            </div>
          </>
        )}
      </div>

      {/* ── FLOATING CENTERED PROMPT BAR ──────────────────────────── */}
      <div className="relative z-40 shrink-0 flex justify-center px-4 pb-3 pt-2 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent">
        <div className="w-full max-w-2xl">
          <div
            className="relative rounded-2xl transition-all duration-300"
            style={{
              background: "rgba(12,12,12,0.97)",
              border: promptFocused || isGenerating
                ? "1px solid rgba(0,229,255,0.25)"
                : "1px solid rgba(229,228,226,0.08)",
              boxShadow: promptFocused
                ? "0 0 0 1px rgba(0,229,255,0.06), 0 -8px 40px rgba(0,0,0,0.8), 0 0 30px rgba(0,229,255,0.04)"
                : "0 -4px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(229,228,226,0.04)",
            }}
          >
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
              }}
              onFocus={() => setPromptFocused(true)}
              onBlur={() => setPromptFocused(false)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleGenerate(); } }}
              placeholder={htmlContent ? "Refine your site… (Ctrl+Enter)" : "Describe your dream website… (Ctrl+Enter)"}
              rows={2}
              className="w-full bg-transparent resize-none text-white text-sm placeholder:text-white/18 focus:outline-none px-4 pt-4 pb-2 leading-relaxed"
              style={{ minHeight: "70px", maxHeight: "140px" }}
              disabled={isGenerating}
            />

            <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
              <div className="flex items-center gap-1.5">
                <button onClick={toggleListening} disabled={!supported || isGenerating}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isListening ? "bg-red-500/12 text-red-400 border border-red-500/25" : "text-white/18 hover:text-white/35 hover:bg-white/4"
                  } disabled:opacity-30`}>
                  {isListening ? (
                    <div className="relative"><span className="absolute inset-0 rounded-full bg-red-500/25 animate-ping" />
                      <Mic className="w-3.5 h-3.5 relative" /></div>
                  ) : <Mic className="w-3.5 h-3.5" />}
                </button>

                {/* Key slots inline */}
                <div className="flex items-center gap-0.5 ml-1">
                  {keyMonitor.slots.map((slot: KeySlotInfo) => (
                    <div key={slot.slot} className={`w-2.5 h-1 rounded-full transition-all ${
                      slot.health === "unconfigured" ? "bg-white/6"
                      : slot.health === "limited" ? "bg-yellow-500/40"
                      : slot.health === "error" ? "bg-red-500/40"
                      : slot.active && isGenerating ? "key-active"
                      : slot.active ? "bg-[#00E5FF]/50"
                      : "bg-[#00E5FF]/15"
                    }`}
                    style={slot.active && isGenerating ? { backgroundColor: "#00E5FF", boxShadow: "0 0 5px rgba(0,229,255,0.7)" } : undefined}
                    />
                  ))}
                </div>

                {status === "idle" && htmlContent && (
                  <span className="text-[9px] text-white/15 hidden sm:block ml-1">Ctrl+Enter to refine</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {sitemap && <span className="text-[9px] text-[#00E5FF]/30 flex items-center gap-0.5 hidden sm:flex"><Globe2 className="w-2 h-2" />SEO</span>}
                {autoSaveStatus === "saving" && <span className="text-[9px] text-white/20 flex items-center gap-0.5"><Loader2 className="w-2 h-2 animate-spin" />Saving</span>}

                <button
                  onClick={() => handleGenerate()}
                  disabled={!prompt.trim() || isGenerating || (isLimited && !isRootOwnerUser)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                    !prompt.trim() || isGenerating || (isLimited && !isRootOwnerUser)
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:scale-105 active:scale-95"
                  }`}
                  style={(!prompt.trim() || isGenerating || (isLimited && !isRootOwnerUser)) ? {
                    background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)"
                  } : {
                    background: "linear-gradient(135deg, #f0efed 0%, #E5E4E2 50%, #c8c7c5 100%)",
                    color: "#050505",
                    boxShadow: "0 0 15px rgba(229,228,226,0.12), inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}>
                  {isGenerating
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Building…</>
                    : (isLimited && !isRootOwnerUser)
                    ? <><Lock className="w-3.5 h-3.5" />Upgrade</>
                    : <><Sparkles className="w-3.5 h-3.5" />Ship it</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────── */}
      {showPricing && <PricingModal open={showPricing} onOpenChange={(o) => setShowPricing(o)} />}
      {showBinance && <BinancePayModal open={showBinance} onClose={() => setShowBinance(false)} />}
      {showVercel && <VercelDeployModal open={showVercel} onClose={() => setShowVercel(false)} html={htmlContent} title={currentProjectTitle} />}
      {showSave && user && (
        <SaveProjectModal open={showSave} onClose={() => setShowSave(false)}
          user={user} html={htmlContent} prompt={prompt}
          existingId={currentProjectId} existingTitle={currentProjectTitle}
          onSaved={(id, title) => { setCurrentProjectId(id); setCurrentProjectTitle(title); }} />
      )}
      {showPromote && (
        <PromoteModal open={showPromote} onClose={() => setShowPromote(false)} title={currentProjectTitle} html={htmlContent} />
      )}
      {showShare && user && currentProjectId && (
        <ShareModal open={showShare} onClose={() => setShowShare(false)}
          user={user} projectId={currentProjectId} title={currentProjectTitle}
          prompt={prompt} html={htmlContent}
          existingSlug={currentSharedSlug}
          onShared={(slug) => setCurrentSharedSlug(slug)} />
      )}
    </div>
  );
}
