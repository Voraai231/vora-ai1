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
import { VercelDeployModal } from "@/components/VercelDeployModal";
import { SaveProjectModal } from "@/components/SaveProjectModal";
import { PromoteModal } from "@/components/PromoteModal";
import { SEOMaster } from "@/components/SEOMaster";
import { ShareModal } from "@/components/ShareModal";
import {
  Mic, Loader2, Sparkles, Code, Copy, Download,
  Smartphone, Tablet, Monitor, TerminalSquare, AlertTriangle,
  Wand2, Search, Megaphone, Crown, LogIn, Lock, MoreVertical,
  Save, Folder, LogOut, Link2, ShieldCheck, Cloud, CheckCircle2,
  Clapperboard, Zap, PackageOpen, BookOpen,
  FileCode2, Globe2, FileSearch, Activity, ArrowLeft,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const FREE_BUILD_LIMIT = 3;
const BUILDS_KEY = "vora.free_builds";

const SYSTEM_PROMPT = `You are Vora AI, an elite frontend engineer that outputs production-quality, SEO-optimised websites.

OUTPUT CONTRACT — NON-NEGOTIABLE:
- Respond with a single complete HTML document and NOTHING ELSE.
- The very first character MUST be "<" (start of <!DOCTYPE html>).
- The very last character MUST be ">" (end of </html>).
- DO NOT wrap in markdown fences. DO NOT include prose, commentary, or explanations.

HEAD REQUIREMENTS — include ALL of these in exact order:
1. <meta charset="UTF-8">
2. <meta name="viewport" content="width=device-width, initial-scale=1.0">
3. <title>[Descriptive Title] | Vora AI</title>
4. <meta name="description" content="[150-160 char SEO description matching the page content]">
5. <meta name="keywords" content="[6-10 relevant comma-separated keywords]">
6. <link rel="canonical" href="https://voraai.app">
7. Open Graph tags (og:type, og:title, og:description, og:image, og:url)
8. Twitter Card tags
9. <script src="https://cdn.tailwindcss.com"></script>
10. Google Fonts preconnect + font link
11. Schema.org JSON-LD WebPage + Organization

DESIGN REQUIREMENTS:
- Default: rich dark (slate-950/zinc-950), premium feel, Tailwind only
- Fully responsive, mobile-first (sm/md/lg breakpoints)
- Images: inline SVGs or https://placehold.co/<w>x<h>/<bg>/<fg>?text=... only
- JavaScript: inline <script> at end of <body>, self-contained
- Must render inside iframe with sandbox="allow-scripts"

Remember: raw HTML only. Your entire response is the srcdoc of an iframe.`;

// ─── Code Rain Canvas ──────────────────────────────────────────────────────
function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const chars = "01アイウエオカキクケコVORAIABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fontSize = 13;
    let cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);
    const draw = () => {
      ctx.fillStyle = "rgba(8,8,8,0.07)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const progress = drops[i] / (canvas.height / fontSize);
        if (progress < 0.3) ctx.fillStyle = "#FFFFFF";
        else if (progress < 0.6) ctx.fillStyle = "#FFD700";
        else ctx.fillStyle = "rgba(255,215,0,0.3)";
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

// ─── SEO utils ─────────────────────────────────────────────────────────────
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
  } else if (!lower.includes("cdn.tailwindcss.com")) {
    if (lower.includes("</head>")) {
      html = html.replace(/<\/head>/i, '<script src="https://cdn.tailwindcss.com"></script></head>');
    }
  }
  return html;
}

function getFreeBuildCount() { return parseInt(localStorage.getItem(BUILDS_KEY) || "0", 10); }
function incrementFreeBuildCount() { const n = getFreeBuildCount() + 1; localStorage.setItem(BUILDS_KEY, String(n)); return n; }

// ─── BUILDER PAGE ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "streaming" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [deviceWidth, setDeviceWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(true);
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
  const [showVercel, setShowVercel] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");

  const { isListening, transcript, supported, toggleListening, setTranscript } = useSpeech();
  const { toast } = useToast();
  const { user, signIn, signOut } = useAuth();
  const { tier } = useTier();
  const { exportZip, isExporting: isZipping } = useZipExport();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRootOwnerUser = isRootOwner(user?.email);
  const isLimited = !isRootOwnerUser && tier === "starter" && freeBuildCount >= FREE_BUILD_LIMIT;
  const buildsLeft = isRootOwnerUser ? Infinity : Math.max(0, FREE_BUILD_LIMIT - freeBuildCount);

  const health = getSystemHealth();
  const keyMonitor = getKeyMonitorInfo();

  // Pick up pending prompt from HomePage
  useEffect(() => {
    const pending = sessionStorage.getItem("vora.pendingPrompt");
    if (pending) {
      sessionStorage.removeItem("vora.pendingPrompt");
      setPrompt(pending);
      setTimeout(() => handleGenerate(pending), 100);
    }
  }, []);

  // Load project from URL ?id=
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
          if (isMobile) setActiveTab("preview");
        }
      });
    }
  }, [user, isMobile]);

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
      setShowPricing(true);
      return;
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
    if (isMobile) setActiveTab("preview");
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
      setSitemap(sm);
      setRobotsTxt(rb);
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
    if (tier === "starter") { setShowPricing(true); return; }
    void trackEvent("magic_wand_used", { uid: user?.uid });
    handleGenerate("Audit this HTML for UI bugs (broken layouts, accessibility issues, contrast problems, mobile breakage) and return a FIXED full HTML. Output only raw HTML.\n\nHTML:\n" + htmlContent, "Return ONLY raw HTML. Fix all issues.");
    toast({ title: "Magic Wand activated", description: "Fixing layout and accessibility…" });
  };

  const handleSEOFix = (issues: string[]) => {
    if (tier === "starter") { setShowPricing(true); return; }
    handleGenerate(`Fix these SEO issues:\n${issues.join("\n")}\n\nHTML:\n${htmlContent}`, "Return ONLY raw HTML. Fix the requested SEO issues.");
    toast({ title: "Fixing SEO", description: "Applying AI optimizations…" });
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(htmlContent);
    toast({ title: "Copied!", description: "HTML copied to clipboard." });
  };

  const handleDownload = () => exportZip(htmlContent, lastPrompt, currentProjectTitle || "vora-project");
  const requirePremium = (fn: () => void) => { if (tier === "starter") setShowPricing(true); else fn(); };
  const requireAuthAndPremium = (fn: () => void) => {
    if (!user) toast({ title: "Sign in required" });
    else if (tier === "starter") setShowPricing(true);
    else fn();
  };

  const healthColor = health.status === "GREEN" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
    : health.status === "YELLOW" ? "bg-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.8)]"
    : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]";

  // ─── User Menu ─────────────────────────────────────────────────────────────
  const UserMenu = () => (
    user ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
            <Avatar className="h-8 w-8 border border-[#FFD700]/20">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="text-[#FFD700] bg-[#FFD700]/10 text-xs font-black">{user.displayName?.[0] || "U"}</AvatarFallback>
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
          <DropdownMenuItem onClick={() => setShowPricing(true)} className="cursor-pointer text-[#FFD700] focus:text-[#FFD700] focus:bg-[#FFD700]/5">
            <Crown className="w-4 h-4 mr-2" /> Plan: {tier.toUpperCase()}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLocation("/studio")} className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5">
            <Clapperboard className="w-4 h-4 mr-2" /> Content Studio
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5">
            <ShieldCheck className="w-4 h-4 mr-2" /> Owner Console
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/8" />
          <DropdownMenuItem onClick={() => void signOut()} className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/5">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button variant="outline" size="sm" onClick={() => setLocation("/auth")}
        className="rounded-full border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent text-xs font-bold px-3 h-8">
        <LogIn className="w-3.5 h-3.5 mr-1" /> Sign In
      </Button>
    )
  );

  // ─── Toolbar ───────────────────────────────────────────────────────────────
  const ToolbarActions = () => (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        {[
          { icon: <Save className="w-3.5 h-3.5" />, label: "Save", onClick: () => user ? setShowSave(true) : toast({ title: "Sign in required" }), disabled: !htmlContent },
          { icon: <div className="relative"><Wand2 className="w-3.5 h-3.5" />{tier === "starter" && <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5 text-[#FFD700]" />}</div>, label: `Magic Wand${tier === "starter" ? " (Pro)" : ""}`, onClick: handleMagicWand, disabled: !htmlContent },
          { icon: <div className="relative"><Search className="w-3.5 h-3.5" />{tier === "starter" && <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5 text-[#FFD700]" />}</div>, label: `SEO Master${tier === "starter" ? " (Pro)" : ""}`, onClick: () => requirePremium(() => setShowSeo(!showSeo)), disabled: !htmlContent, active: showSeo },
          { icon: <div className="relative"><Link2 className="w-3.5 h-3.5" />{currentSharedSlug && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FFD700]" />}</div>, label: currentSharedSlug ? "Shared" : "Share", onClick: () => { if (!user) toast({ title: "Sign in required" }); else if (!currentProjectId) toast({ title: "Save first" }); else setShowShare(true); }, disabled: !htmlContent },
        ].map(({ icon, label, onClick, disabled, active }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${active ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/40 hover:text-white"}`}
                onClick={onClick} disabled={disabled}>{icon}</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px h-4 bg-white/10 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${showCode ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/40 hover:text-white"}`}
              onClick={() => setShowCode(!showCode)} disabled={!htmlContent}>
              <Code className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Toggle Code</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white"
              onClick={copyCode} disabled={!htmlContent}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Copy HTML</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white"
              onClick={handleDownload} disabled={!htmlContent || isZipping}>
              {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageOpen className="w-3.5 h-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Download ZIP</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white"
              onClick={() => requireAuthAndPremium(() => setShowVercel(true))} disabled={!htmlContent}>
              <div className="relative">
                <svg className="w-3.5 h-3.5" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg>
                {tier === "starter" && <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5 text-[#FFD700]" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Deploy to Vercel</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  // ─── Code Panel ────────────────────────────────────────────────────────────
  const CodePanel = () => (
    <div className="flex flex-col h-full bg-[#080808] overflow-hidden">
      <div className="h-9 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono text-white/30">
          <FileCode2 className="w-3 h-3 text-[#FFD700]/50" />
          <span>generated.html</span>
          {status === "streaming" && <span className="text-[#FFD700] animate-pulse ml-2 text-[10px]">● live</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {sitemap && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20 uppercase tracking-wider cursor-default">
                    <Globe2 className="w-2.5 h-2.5" />sitemap
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs font-mono text-xs whitespace-pre-wrap">{sitemap}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {robotsTxt && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider cursor-default">
                    <FileSearch className="w-2.5 h-2.5" />robots
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs font-mono text-xs whitespace-pre-wrap">{robotsTxt}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/20 hover:text-white" onClick={copyCode} disabled={!htmlContent}>
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-[#a0a0a0]">
        {htmlContent ? (
          <pre className="m-0 whitespace-pre-wrap break-all"><code>{htmlContent}</code></pre>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/15">
            <TerminalSquare className="w-9 h-9" />
            <p className="text-xs">Code streams here in real-time…</p>
          </div>
        )}
        <div ref={codeEndRef} />
      </div>
    </div>
  );

  // ─── Preview Panel ─────────────────────────────────────────────────────────
  const PreviewPanel = () => (
    <div className="flex flex-col h-full bg-[#080808] overflow-hidden relative">
      <div className="h-9 border-b border-white/5 flex items-center justify-between px-3 bg-[#0a0a0a] shrink-0 z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!isMobile && (
            <div className="flex gap-1 mr-1 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            </div>
          )}
          <div className="bg-white/5 rounded px-2 py-0.5 text-[10px] font-mono text-white/25 border border-white/8 truncate max-w-[120px] sm:max-w-none">
            vora://preview
          </div>
          {status === "streaming" && <span className="text-[10px] text-[#FFD700] animate-pulse shrink-0">● Live</span>}
        </div>
        {!isMobile && (
          <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/8">
            {(["desktop", "tablet", "mobile"] as const).map(w => (
              <Button key={w} variant="ghost" size="icon"
                className={`h-6 w-7 rounded-md ${deviceWidth === w ? "bg-[#FFD700]/15 text-[#FFD700]" : "text-white/25 hover:text-white"}`}
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
            className={`relative rounded-lg overflow-hidden transition-all duration-500 ring-1 w-full h-full ${
              status === "streaming" ? "ring-[#FFD700]/40 shadow-[0_0_20px_rgba(255,215,0,0.1)]" : "ring-white/5"
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
              style={{ height: isMobile ? "calc(100vh - 200px)" : "100%", minHeight: 400 }}
            />

            {!htmlContent && status === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/25 flex items-center justify-center mb-4 breathing-glow">
                    <VoraIcon className="w-7 h-7 text-[#FFD700]" />
                  </div>
                  <h2 className="text-xl font-black tracking-tighter mb-2 text-white">Your site renders here.</h2>
                  <p className="text-white/30 text-sm max-w-xs">Hit Ship it and watch it build live.</p>
                </motion.div>
              </div>
            )}

            {/* Thinking overlay — code rain, non-blocking */}
            {(status === "thinking" || (status === "streaming" && !htmlContent)) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080808] rounded-lg pointer-events-none overflow-hidden">
                <CodeRain />
                <div className="absolute flex flex-col items-center gap-2 z-10">
                  <div className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-[#FFD700]/40 bg-black/90 backdrop-blur-md text-sm font-black text-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.4)] tracking-widest uppercase">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {status === "thinking" ? "Igniting Engine…" : "Streaming…"}
                  </div>
                  <p className="text-[#FFD700]/35 text-[10px] font-mono tracking-[0.3em] uppercase">
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
            className="absolute right-0 top-9 bottom-0 overflow-hidden border-l border-white/8 bg-[#080808] z-20">
            <SEOMaster html={htmlContent} onFix={handleSEOFix} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] w-full bg-[#080808] text-white flex flex-col overflow-hidden">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="h-13 border-b border-white/8 flex items-center gap-2 px-3 bg-[#080808]/95 backdrop-blur-xl shrink-0 z-30">

        {/* Back + Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white"
            onClick={() => setLocation("/home")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="h-7 w-px bg-white/8" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center breathing-glow">
              <VoraIcon className="w-4 h-4 text-[#FFD700]" />
            </div>
            <span className="font-black text-sm tracking-widest neon-text hidden sm:block">VORA AI</span>
          </div>
          {/* Health indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/8 bg-white/3">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${healthColor}`} />
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider hidden md:block">
              {health.status}
            </span>
          </div>
        </div>

        {/* ── PROMPT BAR ─────────────────────────────────────────────────── */}
        <div className="flex-1 relative flex items-center min-w-0 mx-2">
          <div className="relative w-full flex items-center bg-[#111] border border-white/10 rounded-full focus-within:border-[#FFD700]/40 focus-within:shadow-[0_0_0_1px_rgba(255,215,0,0.1)] transition-all duration-300 overflow-hidden">
            <Textarea
              ref={textareaRef}
              placeholder="Refine your site… (Ctrl+Enter)"
              className="flex-1 resize-none border-0 focus-visible:ring-0 text-sm px-4 py-2 bg-transparent min-h-0 max-h-24 leading-snug text-white placeholder:text-white/20"
              rows={1}
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
              }}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleGenerate(); } }}
              style={{ height: "36px" }}
            />
            <Button variant="ghost" size="icon"
              className={`rounded-full h-7 w-7 mr-1 shrink-0 ${isListening ? "text-red-400" : "text-white/25 hover:text-[#FFD700]"}`}
              onClick={toggleListening} disabled={!supported}>
              {isListening ? (
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-500/40 animate-ping" />
                  <Mic className="w-3.5 h-3.5 relative z-10" />
                </div>
              ) : <Mic className="w-3.5 h-3.5" />}
            </Button>
            <Button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || status === "thinking" || status === "streaming" || (isLimited && !isRootOwnerUser)}
              className="laser-hover bg-[#FFD700] text-[#080808] hover:bg-[#FFD700]/90 font-black rounded-full px-4 h-8 mr-1 shrink-0 shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)] transition-all text-xs tracking-wide"
            >
              {(status === "thinking" || status === "streaming")
                ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Building…</>
                : (isLimited && !isRootOwnerUser)
                ? <><Lock className="w-3.5 h-3.5 mr-1" />Upgrade</>
                : <><Sparkles className="w-3.5 h-3.5 mr-1" />Ship it</>}
            </Button>
          </div>
        </div>

        {/* Build counter */}
        {tier === "starter" && !isRootOwnerUser && buildsLeft <= 3 && (
          <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs border shrink-0 ${
            buildsLeft === 0 ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-[#FFD700]/20 bg-[#FFD700]/5 text-white/40"
          }`}>
            <Zap className="w-3 h-3" />
            {buildsLeft > 0 ? `${buildsLeft} left` : "Upgrade"}
          </div>
        )}

        {/* Toolbar */}
        <div className="hidden md:flex shrink-0">
          <ToolbarActions />
        </div>

        {/* Mobile overflow */}
        <div className="flex md:hidden shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[#0d0d0d] border-white/10">
              <DropdownMenuItem onClick={() => user ? setShowSave(true) : toast({ title: "Sign in required" })} disabled={!htmlContent} className="text-white/70 focus:text-white focus:bg-white/5">
                <Save className="w-4 h-4 mr-2" /> Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMagicWand} disabled={!htmlContent} className="text-white/70 focus:text-white focus:bg-white/5">
                <Wand2 className="w-4 h-4 mr-2" /> Magic Wand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyCode} disabled={!htmlContent} className="text-white/70 focus:text-white focus:bg-white/5">
                <Copy className="w-4 h-4 mr-2" /> Copy HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} disabled={!htmlContent || isZipping} className="text-white/70 focus:text-white focus:bg-white/5">
                <PackageOpen className="w-4 h-4 mr-2" /> Download ZIP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <UserMenu />
      </header>

      {/* ── ERROR BANNER ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-red-950/40 border-b border-red-500/20 flex items-center gap-3 text-sm text-red-400 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate">{errorMessage}</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:bg-red-500/10 shrink-0"
              onClick={() => handleGenerate(lastPrompt)}>Retry</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400 shrink-0"
              onClick={() => setStatus("idle")}>✕</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FACTORY FLOOR ───────────────────────────────────────────────── */}
      {isMobile ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <TabsContent value="compose" className="h-full m-0 data-[state=active]:flex flex-col overflow-hidden bg-[#080808] p-4 gap-3">
              <div className="text-white/25 text-sm text-center py-8">Use the prompt bar above to generate your website.</div>
            </TabsContent>
            <TabsContent value="code" className="h-full m-0 data-[state=active]:flex flex-col overflow-hidden">
              <CodePanel />
            </TabsContent>
            <TabsContent value="preview" className="h-full m-0 data-[state=active]:flex flex-col overflow-hidden">
              <PreviewPanel />
            </TabsContent>
          </div>
          <div className="h-12 bg-[#080808]/95 backdrop-blur-sm border-t border-white/8 flex items-center px-4 shrink-0">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-9">
              {[
                { value: "compose", label: "Compose", icon: <Sparkles className="w-3.5 h-3.5" /> },
                { value: "code", label: "Code", icon: <Code className="w-3.5 h-3.5" /> },
                { value: "preview", label: "Preview", icon: (status === "thinking" || status === "streaming") ? <div className="w-3.5 h-3.5 rounded-full bg-[#FFD700] animate-pulse" /> : <Monitor className="w-3.5 h-3.5" /> },
              ].map(({ value, label, icon }) => (
                <TabsTrigger key={value} value={value}
                  className="rounded-lg data-[state=active]:bg-[#FFD700]/10 data-[state=active]:text-[#FFD700] text-white/30 font-semibold text-xs flex items-center gap-1.5">
                  {icon} {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      ) : (
        <div className="flex-1 flex overflow-hidden min-h-0">
          <AnimatePresence>
            {showCode && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "50%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                className="border-r border-white/8 flex flex-col shrink-0 min-w-0 overflow-hidden" style={{ width: "50%" }}>
                <CodePanel />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <PreviewPanel />
          </div>
        </div>
      )}

      {/* ── STATUS BAR ──────────────────────────────────────────────────── */}
      <footer className="h-6 border-t border-white/5 flex items-center justify-between px-4 text-[10px] text-white/20 bg-[#080808] shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            status === "idle" ? "bg-white/20"
            : status === "error" ? "bg-red-500"
            : "bg-[#FFD700] animate-pulse shadow-[0_0_5px_rgba(255,215,0,0.8)]"
          }`} />
          {status === "idle" && <span>Ready</span>}
          {status === "thinking" && <span className="text-[#FFD700]">Thinking…</span>}
          {status === "streaming" && <span className="text-[#FFD700]">● Streaming…</span>}
          {status === "error" && <span className="text-red-400">Error</span>}
        </div>

        <div className="flex items-center gap-1">
          {keyMonitor.slots.map((slot: KeySlotInfo) => (
            <div key={slot.slot}
              className={`w-3 h-1.5 rounded-full transition-all ${
                slot.health === "unconfigured" ? "bg-white/8"
                : slot.health === "limited" ? "bg-yellow-500/50"
                : slot.health === "error" ? "bg-red-500/50"
                : slot.active && (status === "thinking" || status === "streaming")
                ? "bg-[#FFD700] key-active shadow-[0_0_5px_rgba(255,215,0,0.8)]"
                : slot.active ? "bg-[#FFD700]/70"
                : "bg-[#FFD700]/20"
              }`}
            />
          ))}
          <span className="ml-1 text-white/15">{keyMonitor.configured}/6 keys</span>
        </div>

        <div className="flex items-center gap-2">
          {sitemap && <span className="text-[#FFD700]/40 flex items-center gap-1"><Globe2 className="w-2 h-2" />sitemap</span>}
          {robotsTxt && <span className="text-emerald-500/40 flex items-center gap-1"><FileSearch className="w-2 h-2" />robots</span>}
          {autoSaveStatus === "saving" && <><Loader2 className="w-2 h-2 animate-spin" />Saving</>}
          {autoSaveStatus === "saved" && <><CheckCircle2 className="w-2 h-2 text-[#FFD700]" />Saved</>}
        </div>
      </footer>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {showPricing && <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />}
      {showVercel && <VercelDeployModal open={showVercel} onClose={() => setShowVercel(false)} html={htmlContent} title={currentProjectTitle} />}
      {showSave && user && (
        <SaveProjectModal open={showSave} onClose={() => setShowSave(false)}
          user={user} html={htmlContent} prompt={prompt}
          existingId={currentProjectId} existingTitle={currentProjectTitle}
          onSaved={(id, title) => { setCurrentProjectId(id); setCurrentProjectTitle(title); }} />
      )}
      {showPromote && (
        <PromoteModal open={showPromote} onClose={() => setShowPromote(false)}
          title={currentProjectTitle} html={htmlContent} />
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
