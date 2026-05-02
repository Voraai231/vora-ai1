import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  streamWithFallback,
  getKeyMonitorInfo,
  getSystemHealth,
  checkRateLimit,
  consumeRateSlot,
  KeySlotInfo,
} from "@/lib/gemini";
import { useSpeech } from "@/hooks/useSpeech";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { getProject, saveProject, updateProject } from "@/lib/projects";
import { useZipExport } from "@/hooks/useZipExport";
import { VoraIcon } from "@/components/VoraIcon";
import { TemplatesPicker } from "@/components/TemplatesPicker";
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
  Clapperboard, ChevronRight, Zap, PackageOpen, BookOpen,
  FileCode2, Globe2, FileSearch, Activity, LayoutTemplate,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isRootOwner } from "@/hooks/useTier";

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
7. <!-- Open Graph -->
   <meta property="og:type" content="website">
   <meta property="og:title" content="[same as title]">
   <meta property="og:description" content="[same as description]">
   <meta property="og:image" content="https://placehold.co/1200x630/080808/FFD700?text=Vora+AI">
   <meta property="og:url" content="https://voraai.app">
8. <!-- Twitter Card -->
   <meta name="twitter:card" content="summary_large_image">
   <meta name="twitter:title" content="[same as title]">
   <meta name="twitter:description" content="[same as description]">
   <meta name="twitter:image" content="https://placehold.co/1200x630/080808/FFD700?text=Vora+AI">
9. <script src="https://cdn.tailwindcss.com"></script>
10. Google Fonts preconnect + font link for Inter or tasteful font
11. <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"[title]","description":"[description]","url":"https://voraai.app","publisher":{"@type":"Organization","name":"Vora AI","url":"https://voraai.app"}}</script>

DESIGN REQUIREMENTS:
- Default: rich dark (slate-950/zinc-950), premium feel, Tailwind only
- Fully responsive, mobile-first (sm/md/lg breakpoints)
- Images: inline SVGs or https://placehold.co/<w>x<h>/<bg>/<fg>?text=... only
- JavaScript: inline <script> at end of <body>, self-contained
- Must render inside iframe with sandbox="allow-scripts"

Remember: raw HTML only. Your entire response is the srcdoc of an iframe.`;

// ─── Code Rain Canvas ────────────────────────────────────────────────────────
function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const chars = "01アイウエオカキクケコサシスセソタチツテトVORAIABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
        else ctx.fillStyle = "rgba(255,215,0,0.35)";
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

// ─── System Health Badge ─────────────────────────────────────────────────────
function SystemHealthBadge({ status, configured, healthy }: { status: "GREEN" | "YELLOW" | "RED"; configured: number; healthy: number }) {
  const color = status === "GREEN" ? "bg-emerald-500" : status === "YELLOW" ? "bg-yellow-500" : "bg-red-500";
  const glow = status === "GREEN" ? "shadow-[0_0_8px_rgba(16,185,129,0.8)]" : status === "YELLOW" ? "shadow-[0_0_8px_rgba(234,179,8,0.8)]" : "shadow-[0_0_8px_rgba(239,68,68,0.8)]";
  const label = status === "GREEN" ? "All Systems Go" : status === "YELLOW" ? "Some Keys Limited" : "Keys Exhausted";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50 bg-secondary/30 cursor-default">
            <div className={`w-2 h-2 rounded-full ${color} ${glow} animate-pulse`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">{status}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p className="font-bold">{label}</p>
          <p className="text-muted-foreground">{healthy}/{configured} keys healthy</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── SEO extractor ───────────────────────────────────────────────────────────
function extractSeoMeta(html: string): { title: string; description: string; keywords: string } {
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

function generateSitemap(date: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://voraai.app</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
}

function generateRobotsTxt(): string {
  return `User-agent: *\nAllow: /\nSitemap: https://voraai.app/sitemap.xml\n\n# Powered by Vora AI — https://voraai.app`;
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

function getFreeBuildCount(): number {
  return parseInt(localStorage.getItem(BUILDS_KEY) || "0", 10);
}
function incrementFreeBuildCount(): number {
  const next = getFreeBuildCount() + 1;
  localStorage.setItem(BUILDS_KEY, String(next));
  return next;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
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

  const { isListening, transcript, supported, toggleListening, setTranscript } = useSpeech();
  const { toast } = useToast();
  const { user, signIn, signOut } = useAuth();
  const { tier } = useTier();
  const { exportZip, isExporting: isZipping } = useZipExport();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("compose");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRootOwnerUser = isRootOwner(user?.email);
  const isLimited = !isRootOwnerUser && tier === "starter" && freeBuildCount >= FREE_BUILD_LIMIT;
  const buildsLeft = isRootOwnerUser ? Infinity : Math.max(0, FREE_BUILD_LIMIT - freeBuildCount);

  const health = getSystemHealth();
  const keyMonitor = getKeyMonitorInfo();

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
        html,
        prompt: promptText,
        title: currentProjectTitle || promptText.slice(0, 60).trim() || "Untitled",
        sitemap: sm,
        robotsTxt: rb,
        seoKeywords: seo.keywords,
        seoDescription: seo.description,
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

    if (tier === "starter" && sysPrompt === SYSTEM_PROMPT) {
      if (freeBuildCount >= FREE_BUILD_LIMIT && !isRootOwnerUser) {
        setShowPricing(true);
        return;
      }
    }

    const rl = checkRateLimit();
    if (!rl.allowed) {
      setStatus("error");
      setErrorMessage(`Rate limit reached (2/min). Resets in ${rl.resetInSec}s — this protects your API quota.`);
      return;
    }
    consumeRateSlot();

    setStatus("thinking");
    setErrorMessage("");
    if (sysPrompt === SYSTEM_PROMPT) {
      setLastPrompt(currentPrompt);
      if (tier === "starter" && !isRootOwnerUser) {
        setFreeBuildCount(incrementFreeBuildCount());
      }
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
    const fixPrompt = "Audit this HTML for UI bugs (broken layouts, accessibility issues, contrast problems, mobile breakage) and return a FIXED full HTML document. Output only raw HTML.\n\nHTML:\n" + htmlContent;
    handleGenerate(fixPrompt, "Return ONLY raw HTML. Fix all issues.");
    toast({ title: "Magic Wand activated", description: "Fixing layout and accessibility…" });
  };

  const handleSEOFix = (issues: string[]) => {
    if (tier === "starter") { setShowPricing(true); return; }
    const fixPrompt = `Fix the following SEO issues:\n${issues.join("\n")}\n\nHTML:\n${htmlContent}`;
    handleGenerate(fixPrompt, "Return ONLY raw HTML. Fix the requested SEO issues.");
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

  // ─── User Menu ──────────────────────────────────────────────────────────────
  const UserMenu = () => (
    user ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback className="text-primary bg-primary/10">{user.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium truncate">{user.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setLocation("/projects")} className="cursor-pointer">
            <Folder className="w-4 h-4 mr-2" /> My Projects
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLocation("/learn")} className="cursor-pointer">
            <BookOpen className="w-4 h-4 mr-2" /> Learning Hub
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPricing(true)} className="cursor-pointer text-primary">
            <Crown className="w-4 h-4 mr-2" /> Plan: {tier.toUpperCase()}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLocation("/studio")} className="cursor-pointer">
            <Clapperboard className="w-4 h-4 mr-2" /> Content Studio
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer">
            <ShieldCheck className="w-4 h-4 mr-2" /> Owner Console
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void signOut()} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button variant="outline" size="sm" onClick={() => setLocation("/auth")} className="neon-border rounded-full h-9 px-4 font-semibold">
        <LogIn className="w-4 h-4 mr-1.5" /> Sign In
      </Button>
    )
  );

  // ─── Toolbar ─────────────────────────────────────────────────────────────────
  const ToolbarActions = ({ compact = false }: { compact?: boolean }) => (
    <TooltipProvider>
      <div className={`flex items-center ${compact ? "gap-0" : "gap-0.5"}`}>
        {[
          { icon: <Save className="w-4 h-4" />, label: "Save", onClick: () => user ? setShowSave(true) : toast({ title: "Sign in required" }), disabled: !htmlContent },
          { icon: <div className="relative"><Wand2 className="w-4 h-4" />{tier === "starter" && <Lock className="w-2 h-2 absolute -top-1 -right-1 text-primary" />}</div>, label: `Magic Wand${tier === "starter" ? " (Pro)" : ""}`, onClick: handleMagicWand, disabled: !htmlContent },
          { icon: <div className="relative"><Search className="w-4 h-4" />{tier === "starter" && <Lock className="w-2 h-2 absolute -top-1 -right-1 text-primary" />}</div>, label: `SEO Master${tier === "starter" ? " (Pro)" : ""}`, onClick: () => requirePremium(() => setShowSeo(!showSeo)), disabled: !htmlContent, active: showSeo },
          { icon: <div className="relative"><Megaphone className="w-4 h-4" />{tier === "starter" && <Lock className="w-2 h-2 absolute -top-1 -right-1 text-primary" />}</div>, label: "Promote", onClick: () => requirePremium(() => setShowPromote(true)), disabled: !htmlContent || !currentProjectTitle },
          { icon: <div className="relative"><Link2 className="w-4 h-4" />{currentSharedSlug && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-primary" />}</div>, label: currentSharedSlug ? "Shared" : "Share", onClick: () => { if (!user) toast({ title: "Sign in required" }); else if (!currentProjectId) toast({ title: "Save first" }); else setShowShare(true); }, disabled: !htmlContent },
        ].map(({ icon, label, onClick, disabled, active }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={`h-9 w-9 ${active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`} onClick={onClick} disabled={disabled}>
                {icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px h-5 bg-border/50 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={`h-9 w-9 ${showCode ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setShowCode(!showCode)} disabled={!htmlContent}>
              <Code className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle Code</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={copyCode} disabled={!htmlContent}>
              <Copy className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Copy HTML</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={htmlContent ? "default" : "ghost"}
              size="sm"
              className={`h-9 px-3 gap-1.5 text-xs font-semibold ${htmlContent ? "bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30" : "text-muted-foreground"}`}
              onClick={handleDownload} disabled={!htmlContent || isZipping}
            >
              {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageOpen className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">ZIP</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Download ZIP</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => requireAuthAndPremium(() => setShowVercel(true))} disabled={!htmlContent}>
              <div className="relative">
                <svg className="w-4 h-4" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg>
                {tier === "starter" && <Lock className="w-2 h-2 absolute -top-1 -right-1 text-primary" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Deploy to Vercel</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  // ─── Code Panel ──────────────────────────────────────────────────────────────
  const CodePanel = () => (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
      <div className="h-10 bg-[#0d0d0d] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <FileCode2 className="w-3.5 h-3.5 text-primary/70" />
          <span>generated.html</span>
          {status === "streaming" && <span className="text-primary animate-pulse ml-2">● live</span>}
        </div>
        <div className="flex items-center gap-1">
          {sitemap && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider cursor-default">
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
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={copyCode} disabled={!htmlContent}>
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-gray-300">
        {htmlContent ? (
          <pre className="m-0 whitespace-pre-wrap break-all"><code>{htmlContent}</code></pre>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/30">
            <TerminalSquare className="w-10 h-10" />
            <p className="text-xs">Code appears here as it streams…</p>
          </div>
        )}
        <div ref={codeEndRef} />
      </div>
    </div>
  );

  // ─── Preview Panel ────────────────────────────────────────────────────────────
  const PreviewPanel = () => (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-hidden relative">
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-3 bg-[#0d0d0d] shrink-0 z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!isMobile && (
            <div className="flex gap-1.5 mr-1 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
          )}
          <div className="bg-secondary/40 rounded px-2 py-0.5 text-[11px] font-mono text-muted-foreground border border-border/20 truncate max-w-[140px] sm:max-w-none">
            vora://preview
          </div>
          {status === "streaming" && <span className="text-[10px] text-primary animate-pulse shrink-0">● Live</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isMobile && (
            <div className="flex bg-secondary/20 rounded-lg p-0.5 border border-border/20">
              {(["desktop", "tablet", "mobile"] as const).map(w => (
                <Button key={w} variant="ghost" size="icon" className={`h-6 w-7 rounded-md ${deviceWidth === w ? "bg-background shadow text-primary" : "text-muted-foreground"}`} onClick={() => setDeviceWidth(w)}>
                  {w === "desktop" && <Monitor className="w-3 h-3" />}
                  {w === "tablet" && <Tablet className="w-3 h-3" />}
                  {w === "mobile" && <Smartphone className="w-3 h-3" />}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-start overflow-auto p-2 md:p-4">
          <motion.div
            layout
            className={`relative rounded-lg overflow-hidden transition-all duration-500 ring-1 w-full h-full ${
              status === "streaming" ? "ring-primary/50 shadow-[0_0_25px_rgba(255,215,0,0.12)]" : "ring-border/30"
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

            {/* Empty state */}
            {!htmlContent && status === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 breathing-glow border border-primary/30">
                    <VoraIcon className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter mb-2">Describe anything.</h2>
                  <p className="text-muted-foreground text-sm max-w-xs">Type your idea in the prompt bar above and hit Ship it.</p>
                </motion.div>
              </div>
            )}

            {/* Code Rain thinking overlay */}
            {(status === "thinking" || (status === "streaming" && !htmlContent)) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080808] rounded-lg pointer-events-none overflow-hidden">
                <CodeRain />
                <div className="absolute flex flex-col items-center gap-3 z-10">
                  <div className="flex items-center gap-3 px-7 py-3.5 rounded-full border border-primary/50 bg-black/80 backdrop-blur-sm text-sm font-black text-primary shadow-[0_0_40px_rgba(255,215,0,0.5)] tracking-widest uppercase">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {status === "thinking" ? "Igniting Engine…" : "Streaming…"}
                  </div>
                  <p className="text-primary/40 text-[10px] font-mono tracking-[0.3em] uppercase">
                    Gemini 2.5 Flash · Key {activeKeySlot + 1}/6
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* SEO sidebar */}
      <AnimatePresence>
        {showSeo && !isMobile && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="absolute right-0 top-10 bottom-0 overflow-hidden border-l border-border/30 bg-background z-20">
            <SEOMaster html={htmlContent} onFix={handleSEOFix} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] w-full bg-background text-foreground selection:bg-primary/30 flex flex-col overflow-hidden">

      {/* ── FACTORY HEADER ─────────────────────────────────────────────────── */}
      <header className="h-14 md:h-16 border-b border-border/30 flex items-center gap-2 px-3 md:px-4 bg-background/90 backdrop-blur-xl shrink-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center breathing-glow">
            <VoraIcon className="w-5 h-5 text-primary" />
          </div>
          <span className="font-black text-base tracking-tight neon-text hidden sm:block">VORA AI</span>
        </div>

        {/* System Health */}
        <SystemHealthBadge status={health.status} configured={health.configured} healthy={health.healthy} />

        {/* Free build counter (compact) */}
        {tier === "starter" && buildsLeft <= 3 && (
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border shrink-0 ${
            buildsLeft === 0 ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/20 bg-primary/5 text-muted-foreground"
          }`}>
            <Zap className="w-3 h-3" />
            {buildsLeft > 0 ? `${buildsLeft} left` : "Upgrade"}
          </div>
        )}

        {/* ── MASTER PROMPT BAR ─────────────────────────────────────────────── */}
        <div className="flex-1 relative flex items-center min-w-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/5 rounded-full blur opacity-50 group-focus-within:opacity-100 transition pointer-events-none" />
          <div className="relative w-full flex items-center bg-card border border-border/50 rounded-full focus-within:border-primary/60 transition-all duration-300 shadow-sm overflow-hidden">
            <Textarea
              ref={textareaRef}
              placeholder="Describe your dream website… (Ctrl+Enter to ship)"
              className="flex-1 resize-none border-0 focus-visible:ring-0 text-sm px-4 py-2.5 bg-transparent min-h-0 max-h-32 leading-snug"
              rows={1}
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
              }}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleGenerate(); } }}
              style={{ height: "40px" }}
            />

            {/* Voice */}
            <Button
              variant="ghost" size="icon"
              className={`rounded-full h-8 w-8 mr-1 shrink-0 transition-all ${isListening ? "text-destructive" : "text-muted-foreground hover:text-primary"}`}
              onClick={toggleListening} disabled={!supported}
            >
              {isListening ? (
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-40 animate-ping" />
                  <Mic className="w-4 h-4 relative z-10" />
                </div>
              ) : <Mic className="w-4 h-4" />}
            </Button>

            {/* Ship it */}
            <Button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || status === "thinking" || status === "streaming" || (isLimited && !isRootOwnerUser)}
              className="laser-hover bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-full px-5 h-9 mr-1 shrink-0 shadow-[0_0_20px_rgba(255,215,0,0.35)] hover:shadow-[0_0_35px_rgba(255,215,0,0.6)] transition-all text-sm tracking-wide"
            >
              {(status === "thinking" || status === "streaming")
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Building…</>
                : (isLimited && !isRootOwnerUser)
                ? <><Lock className="w-4 h-4 mr-1.5" />Upgrade</>
                : <><Sparkles className="w-4 h-4 mr-1.5" />Ship it</>}
            </Button>
          </div>
        </div>

        {/* Templates button */}
        <Tooltip>
          <TooltipProvider>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary shrink-0 hidden md:flex"
                onClick={() => {/* templates shown inline */}}>
                <LayoutTemplate className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Templates</TooltipContent>
          </TooltipProvider>
        </Tooltip>

        {/* Toolbar actions */}
        <div className="hidden md:flex shrink-0">
          <ToolbarActions />
        </div>

        {/* Mobile overflow menu */}
        <div className="flex md:hidden shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => user ? setShowSave(true) : toast({ title: "Sign in required" })} disabled={!htmlContent}>
                <Save className="w-4 h-4 mr-2" /> Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMagicWand} disabled={!htmlContent}>
                <Wand2 className="w-4 h-4 mr-2" /> Magic Wand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyCode} disabled={!htmlContent}>
                <Copy className="w-4 h-4 mr-2" /> Copy HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} disabled={!htmlContent || isZipping}>
                <PackageOpen className="w-4 h-4 mr-2" /> Download ZIP
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => requireAuthAndPremium(() => setShowVercel(true))} disabled={!htmlContent}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg>
                Deploy to Vercel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ThemeToggle />
        <UserMenu />
      </header>

      {/* ── TEMPLATE PICKER STRIP ─────────────────────────────────────────── */}
      <div className="border-b border-border/20 px-4 py-1.5 bg-background/60 shrink-0 hidden md:block">
        <TemplatesPicker onSelect={p => { setPrompt(p); textareaRef.current?.focus(); }} />
      </div>

      {/* ── ERROR BANNER ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-3 text-sm text-destructive shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate">{errorMessage}</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs border-destructive/30 hover:bg-destructive/10 text-destructive shrink-0"
              onClick={() => handleGenerate(lastPrompt)}>Retry</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive shrink-0"
              onClick={() => setStatus("idle")}>✕</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FACTORY FLOOR ─────────────────────────────────────────────────── */}
      {isMobile ? (
        /* Mobile: tabs */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <TabsContent value="compose" className="h-full m-0 data-[state=active]:flex flex-col overflow-hidden bg-background p-4 gap-3">
              <TemplatesPicker onSelect={p => setPrompt(p)} />
              <div className="text-xs text-muted-foreground text-center py-4">Use the prompt bar above to generate your website</div>
            </TabsContent>
            <TabsContent value="code" className="h-full m-0 data-[state=active]:flex flex-col overflow-hidden">
              <CodePanel />
            </TabsContent>
            <TabsContent value="preview" className="h-full m-0 data-[state=active]:flex flex-col overflow-hidden">
              <PreviewPanel />
            </TabsContent>
          </div>
          <div className="h-12 bg-background/95 backdrop-blur-sm border-t border-border/40 flex items-center px-4 shrink-0">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-9">
              {[
                { value: "compose", label: "Compose", icon: <Sparkles className="w-3.5 h-3.5" /> },
                { value: "code", label: "Code", icon: <Code className="w-3.5 h-3.5" /> },
                { value: "preview", label: "Preview", icon: (status === "thinking" || status === "streaming") ? <div className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse" /> : <Monitor className="w-3.5 h-3.5" /> },
              ].map(({ value, label, icon }) => (
                <TabsTrigger key={value} value={value} className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-semibold text-xs flex items-center gap-1.5">
                  {icon} {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      ) : (
        /* Desktop: side-by-side factory floor */
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left: Code panel */}
          <AnimatePresence>
            {showCode && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "50%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-r border-border/30 flex flex-col shrink-0 min-w-0 overflow-hidden"
                style={{ width: "50%" }}
              >
                <CodePanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right: Preview panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <PreviewPanel />
          </div>
        </div>
      )}

      {/* ── STATUS BAR ────────────────────────────────────────────────────── */}
      <footer className="h-7 border-t border-border/20 flex items-center justify-between px-4 text-[11px] text-muted-foreground bg-background/80 shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            status === "idle" ? "bg-muted-foreground/30"
            : status === "error" ? "bg-destructive"
            : "bg-primary animate-pulse shadow-[0_0_5px_rgba(255,215,0,0.8)]"
          }`} />
          {status === "idle" && <span>Ready</span>}
          {status === "thinking" && <span className="text-primary">Thinking…</span>}
          {status === "streaming" && <span className="text-primary">● Streaming…</span>}
          {status === "error" && <span className="text-destructive">Error</span>}
        </div>

        {/* Key monitor — 6 slots */}
        <div className="flex items-center gap-1" title="Gemini key slots">
          {keyMonitor.slots.map((slot: KeySlotInfo) => (
            <div
              key={slot.slot}
              title={`Key ${slot.slot}: ${slot.health === "unconfigured" ? "not configured" : slot.health === "limited" ? "rate limited" : slot.active ? "active" : "standby"}`}
              className={`w-3 h-1.5 rounded-full transition-all ${
                slot.health === "unconfigured" ? "bg-border/30"
                : slot.health === "limited" ? "bg-yellow-500/60"
                : slot.health === "error" ? "bg-destructive/60"
                : slot.active && (status === "thinking" || status === "streaming")
                ? "bg-primary key-active shadow-[0_0_5px_rgba(255,215,0,0.8)]"
                : slot.active ? "bg-primary shadow-[0_0_3px_rgba(255,215,0,0.5)]"
                : "bg-primary/25"
              }`}
            />
          ))}
          <span className="ml-1 text-muted-foreground/50">
            {keyMonitor.configured}/6 keys
          </span>
        </div>

        <div className="flex items-center gap-2">
          {sitemap && <span className="text-primary/60 flex items-center gap-1"><Globe2 className="w-2.5 h-2.5" />sitemap</span>}
          {robotsTxt && <span className="text-emerald-500/60 flex items-center gap-1"><FileSearch className="w-2.5 h-2.5" />robots</span>}
          {autoSaveStatus === "saving" && <><Loader2 className="w-2.5 h-2.5 animate-spin" />Saving</>}
          {autoSaveStatus === "saved" && <><CheckCircle2 className="w-2.5 h-2.5 text-primary" />Saved</>}
          {autoSaveStatus === "idle" && user && currentProjectId && <><Cloud className="w-2.5 h-2.5" />Synced</>}
        </div>
      </footer>

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
      <PricingModal open={showPricing} onOpenChange={setShowPricing} />
      <VercelDeployModal open={showVercel} onOpenChange={setShowVercel} html={htmlContent} title={currentProjectTitle} />
      <SaveProjectModal
        open={showSave} onOpenChange={setShowSave}
        html={htmlContent} prompt={lastPrompt || prompt}
        currentProjectId={currentProjectId} currentTitle={currentProjectTitle}
        onSaved={(id, title) => { setCurrentProjectId(id); setCurrentProjectTitle(title); }}
      />
      <PromoteModal open={showPromote} onOpenChange={setShowPromote} html={htmlContent} prompt={lastPrompt || prompt} title={currentProjectTitle} />
      <ShareModal
        open={showShare} onOpenChange={setShowShare}
        projectId={currentProjectId} title={currentProjectTitle}
        prompt={lastPrompt || prompt} html={htmlContent}
        initialSlug={currentSharedSlug}
        onShared={slug => setCurrentSharedSlug(slug)}
      />
    </div>
  );
}
