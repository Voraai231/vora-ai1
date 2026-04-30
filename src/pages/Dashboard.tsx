import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenAI } from "@google/genai";
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
  Clapperboard, ChevronRight, Zap, PackageOpen
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

const SYSTEM_PROMPT = `You are Vora AI, an elite frontend engineer that outputs production-quality websites.

OUTPUT CONTRACT — NON-NEGOTIABLE:
- Respond with a single complete HTML document and NOTHING ELSE.
- The very first character of your response MUST be "<" (start of <!DOCTYPE html>).
- The very last character MUST be ">" (end of </html>).
- DO NOT wrap output in markdown fences (no \`\`\`, no \`\`\`html).
- DO NOT include any prose, commentary, greetings, explanations, apologies, or notes — before, after, or inside the HTML.
- DO NOT say "Here is" or "Sure" or anything similar.

DOCUMENT REQUIREMENTS:
1. Start with <!DOCTYPE html> then <html lang="en"> and a complete <head> and <body>.
2. The <head> MUST include, in this order:
   - <meta charset="UTF-8">
   - <meta name="viewport" content="width=device-width, initial-scale=1.0">
   - <title>...</title>
   - <script src="https://cdn.tailwindcss.com"></script>
   - <link rel="preconnect" href="https://fonts.googleapis.com"> and a Google Fonts <link> for Inter (or another tasteful font).
3. Use Tailwind utility classes only — do NOT write custom <style> blocks unless absolutely required for animations.
4. Default theme: rich dark background (slate-950 / zinc-950), high contrast typography, generous spacing, subtle gradients, and a premium feel. Respect the user if they ask for light or a specific palette.
5. The page MUST be fully responsive (mobile-first, breakpoints at sm/md/lg).
6. Use only inline SVGs or images from https://placehold.co/<w>x<h>/<bg>/<fg>?text=... — no other external image hosts.
7. If JavaScript is needed, include it inline in a <script> tag at the end of <body>. Keep it self-contained.
8. The result must render correctly inside an iframe with sandbox="allow-scripts" — no top-level navigation, no parent access.

Remember: raw HTML only. Your entire response is fed directly into an iframe srcdoc.`;

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

  const isRootOwnerUser = isRootOwner(user?.email);
  const isLimited = !isRootOwnerUser && tier === "starter" && freeBuildCount >= FREE_BUILD_LIMIT;
  const buildsLeft = isRootOwnerUser ? Infinity : Math.max(0, FREE_BUILD_LIMIT - freeBuildCount);

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
          if (isMobile) setActiveTab("preview");
        }
      });
    }
  }, [user, isMobile]);

  const autoSave = async (html: string, promptText: string) => {
    if (!user || !html) return;
    setAutoSaveStatus("saving");
    try {
      if (currentProjectId) {
        await updateProject(user, currentProjectId, { html, prompt: promptText, title: currentProjectTitle });
      } else {
        const title = (currentProjectTitle || promptText.slice(0, 60).trim() || "Untitled").replace(/\n+/g, " ");
        const id = await saveProject(user, { title, prompt: promptText, html });
        setCurrentProjectId(id);
        setCurrentProjectTitle(title);
        const url = new URL(window.location.href);
        url.searchParams.set("id", id);
        window.history.replaceState({}, "", url.toString());
      }
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus((s) => (s === "saved" ? "idle" : s)), 2400);
    } catch (err) {
      console.error("Auto-save failed", err);
      setAutoSaveStatus("idle");
    }
  };

  useEffect(() => {
    if (transcript) setPrompt(prev => prev.replace(transcript, "") + transcript);
  }, [transcript]);

  useEffect(() => {
    if (showCode && status === "streaming") codeEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [htmlContent, showCode, status]);

  const handleGenerate = async (currentPrompt: string = prompt, sysPrompt: string = SYSTEM_PROMPT) => {
    if (!currentPrompt.trim()) return;

    if (tier === "starter" && sysPrompt === SYSTEM_PROMPT) {
      if (freeBuildCount >= FREE_BUILD_LIMIT) {
        setShowPricing(true);
        return;
      }
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setStatus("error");
      setErrorMessage("VITE_GEMINI_API_KEY is missing.");
      return;
    }

    setStatus("thinking");
    setErrorMessage("");
    if (sysPrompt === SYSTEM_PROMPT) {
      setLastPrompt(currentPrompt);
      if (tier === "starter") {
        const newCount = incrementFreeBuildCount();
        setFreeBuildCount(newCount);
      }
    }
    if (isMobile) setActiveTab("preview");
    void trackEvent("generation_started", { uid: user?.uid });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: currentPrompt }] }],
        config: {
          systemInstruction: sysPrompt,
          temperature: 0.7,
          responseMimeType: "text/plain",
        },
      });

      let fullText = "";
      let firstChunk = true;
      for await (const chunk of responseStream) {
        fullText += chunk.text ?? "";
        const cleanHtml = sanitizeHtml(fullText);
        if (firstChunk) { setStatus("streaming"); firstChunk = false; }
        setHtmlContent(cleanHtml);
      }

      setStatus("idle");
      setTranscript("");
      void trackEvent("generation_complete", { uid: user?.uid });

      const finalHtml = sanitizeHtml(fullText);
      if (finalHtml) setHtmlContent(finalHtml);
      if (sysPrompt === SYSTEM_PROMPT && finalHtml) void autoSave(finalHtml, currentPrompt);
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

  const handleDownload = () => {
    exportZip(htmlContent, lastPrompt, currentProjectTitle || "vora-project");
  };

  const requirePremium = (fn: () => void) => { if (tier === "starter") setShowPricing(true); else fn(); };
  const requireAuthAndPremium = (fn: () => void) => {
    if (!user) toast({ title: "Sign in required", description: "Please sign in to use this feature." });
    else if (tier === "starter") setShowPricing(true);
    else fn();
  };

  const UserMenu = () => (
    user ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
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
          <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button variant="outline" size="sm" onClick={signIn} className="neon-border rounded-full h-9 px-4">
        <LogIn className="w-4 h-4 mr-1.5" /> Sign In
      </Button>
    )
  );

  const ComposePane = () => (
    <div className="w-full md:w-[400px] lg:w-[480px] h-full border-r border-border/50 flex flex-col relative z-10 bg-background/80 backdrop-blur-xl shrink-0">
      {/* Header row — logo + auth always in same line */}
      <div className="h-14 px-4 flex items-center justify-between shrink-0 border-b border-border/30 md:border-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center neon-border shrink-0">
            <VoraIcon className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight shrink-0">Vora AI</span>
          {currentProjectTitle && (
            <span className="hidden sm:inline px-2 py-0.5 bg-secondary text-xs rounded-md truncate max-w-[100px]">
              {currentProjectTitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Headline — hidden on mobile to save space */}
      <div className="hidden md:block px-6 pt-4 pb-3">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter leading-tight">
          Speak it.<br />
          <span className="text-primary neon-text">Type it.</span><br />
          Ship it.
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Describe the interface you want. Watch it build in real-time.
        </p>
      </div>

      {/* Free build counter banner */}
      {tier === "starter" && (
        <div className={`mx-4 mb-2 px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 ${
          buildsLeft === 0
            ? "bg-destructive/10 border border-destructive/20 text-destructive"
            : buildsLeft === 1
            ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
            : "bg-primary/5 border border-primary/10 text-muted-foreground"
        }`}>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            {buildsLeft > 0
              ? <span><strong>{buildsLeft}</strong> free build{buildsLeft !== 1 ? "s" : ""} left</span>
              : <span>Free limit reached</span>}
          </div>
          <button onClick={() => setShowPricing(true)} className="font-semibold underline underline-offset-2 hover:opacity-80">
            {buildsLeft === 0 ? "Upgrade now" : "Go unlimited →"}
          </button>
        </div>
      )}

      {/* Compose area */}
      <div className="px-4 flex-1 flex flex-col min-h-0 pb-4 gap-2">
        <TemplatesPicker onSelect={(p) => setPrompt(p)} />

        <div className="relative group flex-1 flex flex-col min-h-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/0 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500 pointer-events-none" />
          <div className="relative flex-1 flex flex-col bg-card border border-border/50 rounded-xl overflow-hidden focus-within:border-primary/50 transition-all duration-300">
            <Textarea
              placeholder={isMobile ? "Describe what to build… (e.g. a landing page for a fitness app)" : "What are we building today? (Cmd+Enter to ship)"}
              className="flex-1 resize-none border-0 focus-visible:ring-0 text-sm md:text-base p-3 md:p-4 bg-transparent min-h-[100px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleGenerate(); } }}
            />

            <div className="p-2.5 md:p-3 bg-card/50 border-t border-border/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className={`rounded-full h-8 w-8 transition-all ${isListening ? "text-destructive" : "text-muted-foreground hover:text-primary"}`}
                        onClick={toggleListening} disabled={!supported}
                      >
                        {isListening ? (
                          <div className="relative flex items-center justify-center">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-40 animate-ping" />
                            <Mic className="w-4 h-4 relative z-10" />
                          </div>
                        ) : <Mic className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{supported ? "Voice dictation" : "Not supported"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || status === "thinking" || status === "streaming" || isLimited}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full px-5 h-9 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all text-sm"
              >
                {(status === "thinking" || status === "streaming")
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Building…</>
                  : isLimited
                  ? <><Lock className="w-4 h-4 mr-1.5" /> Upgrade</>
                  : <><Sparkles className="w-4 h-4 mr-1.5" /> Ship it</>}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {status === "error" && (
            <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">Generation Failed</p>
                <p className="opacity-80 text-xs mt-0.5 break-words">{errorMessage}</p>
                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs border-destructive/30 hover:bg-destructive/10 text-destructive" onClick={() => handleGenerate(lastPrompt)}>
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status footer */}
      <div className="h-9 px-4 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${status === "idle" ? "bg-muted-foreground/30" : status === "error" ? "bg-destructive" : "bg-primary animate-pulse shadow-[0_0_6px_rgba(0,255,255,0.8)]"}`} />
          {status === "idle" && "Ready"}
          {status === "thinking" && "Thinking…"}
          {status === "streaming" && "Building…"}
          {status === "error" && "Error"}
        </div>
        {user && htmlContent && autoSaveStatus !== "idle" && (
          <div className="flex items-center gap-1">
            {autoSaveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Saving</>}
            {autoSaveStatus === "saved" && <><CheckCircle2 className="w-3 h-3 text-primary" /> Saved</>}
          </div>
        )}
        {user && htmlContent && autoSaveStatus === "idle" && currentProjectId && (
          <div className="flex items-center gap-1"><Cloud className="w-3 h-3" /> Synced</div>
        )}
      </div>
    </div>
  );

  const ToolbarContent = ({ compact = false }: { compact?: boolean }) => (
    <TooltipProvider>
      <div className={`flex items-center ${compact ? "flex-col gap-1 p-1" : "gap-0.5"}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => user ? setShowSave(true) : toast({ title: "Sign in required" })} disabled={!htmlContent}>
              <Save className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={compact ? "left" : "bottom"}>Save Project</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={handleMagicWand} disabled={!htmlContent}>
              <div className="relative">
                <Wand2 className="w-4 h-4" />
                {tier === "starter" && <Lock className="w-2 h-2 absolute -top-1 -right-1 text-primary" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side={compact ? "left" : "bottom"}>Magic Wand {tier === "starter" ? "(Pro)" : ""}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={`h-9 w-9 ${showSeo ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => requirePremium(() => setShowSeo(!showSeo))} disabled={!htmlContent}>
              <div className="relative">
                <Search className="w-4 h-4" />
                {tier === "starter" && <Lock className="w-2 h-2 absolute -top-1 -right-1 text-primary" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side={compact ? "left" : "bottom"}>SEO Master {tier === "starter" ? "(Pro)" : ""}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => requirePremium(() => setShowPromote(true))} disabled={!htmlContent || !currentProjectTitle}>
              <div className="relative">
                <Megaphone className="w-4 h-4" />
                {tier === "starter" && <Lock className="w-2 h-2 absolute -top-1 -right-1 text-primary" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side={compact ? "left" : "bottom"}>Promote {tier === "starter" ? "(Pro)" : ""}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className={`h-9 w-9 ${currentSharedSlug ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => {
                if (!user) { toast({ title: "Sign in required" }); return; }
                if (!currentProjectId) { toast({ title: "Save first", description: "Save the project before sharing." }); return; }
                setShowShare(true);
              }}
              disabled={!htmlContent}
            >
              <div className="relative">
                <Link2 className="w-4 h-4" />
                {currentSharedSlug && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side={compact ? "left" : "bottom"}>{currentSharedSlug ? "Shared" : "Share"}</TooltipContent>
        </Tooltip>

        {!compact && <div className="w-px h-5 bg-border/50 mx-1" />}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCode(!showCode)} disabled={!htmlContent}>
              <Code className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={compact ? "left" : "bottom"}>View Code</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={copyCode} disabled={!htmlContent}>
              <Copy className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={compact ? "left" : "bottom"}>Copy HTML</TooltipContent>
        </Tooltip>

        {/* Download ZIP — prominent, always visible, available to all */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={htmlContent ? "default" : "ghost"}
              size={compact ? "icon" : "sm"}
              className={`${compact ? "h-9 w-9" : "h-9 px-3 gap-1.5"} ${htmlContent ? "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30" : "text-muted-foreground"}`}
              onClick={handleDownload}
              disabled={!htmlContent || isZipping}
            >
              {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageOpen className="w-4 h-4" />}
              {!compact && <span className="text-xs font-medium">Download ZIP</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={compact ? "left" : "bottom"}>Download as ZIP</TooltipContent>
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
          <TooltipContent side={compact ? "left" : "bottom"}>Deploy to Vercel {tier !== "billionaire" ? "(Billionaire)" : ""}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  const PreviewPane = () => (
    <div className="flex-1 flex flex-col relative bg-[#0a0a0a] overflow-hidden min-w-0">
      {!isMobile && <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-50" />}

      {/* Preview topbar */}
      <div className="h-12 md:h-14 border-b border-border/30 flex items-center justify-between px-3 md:px-4 bg-background/40 backdrop-blur-sm z-20 gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {!isMobile && (
            <div className="flex gap-1.5 mr-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
          )}
          <div className="bg-secondary/50 rounded px-2 py-1 text-xs font-mono text-muted-foreground border border-border/30 truncate max-w-[140px] md:max-w-none">
            vora://preview
          </div>
          {status === "streaming" && (
            <span className="text-[10px] text-primary animate-pulse hidden sm:inline shrink-0">● Live</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Device switcher — desktop only */}
          {!isMobile && (
            <div className="flex bg-secondary/30 rounded-lg p-0.5 border border-border/30 mr-1">
              {(["desktop", "tablet", "mobile"] as const).map(w => (
                <Button key={w} variant="ghost" size="icon" className={`h-7 w-8 rounded-md ${deviceWidth === w ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`} onClick={() => setDeviceWidth(w)}>
                  {w === "desktop" && <Monitor className="w-3.5 h-3.5" />}
                  {w === "tablet" && <Tablet className="w-3.5 h-3.5" />}
                  {w === "mobile" && <Smartphone className="w-3.5 h-3.5" />}
                </Button>
              ))}
            </div>
          )}

          {/* On mobile: show download + more menu. On desktop: show full toolbar */}
          {isMobile ? (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Button
                  variant={htmlContent ? "default" : "ghost"}
                  size="icon"
                  className={`h-9 w-9 ${htmlContent ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30" : "text-muted-foreground"}`}
                  onClick={handleDownload}
                  disabled={!htmlContent || isZipping}
                >
                  {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageOpen className="w-4 h-4" />}
                </Button>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => user ? setShowSave(true) : toast({ title: "Sign in required" })} disabled={!htmlContent}>
                    <Save className="w-4 h-4 mr-2" /> Save Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMagicWand} disabled={!htmlContent}>
                    <Wand2 className="w-4 h-4 mr-2" /> Magic Wand {tier === "starter" ? "(Pro)" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyCode} disabled={!htmlContent}>
                    <Copy className="w-4 h-4 mr-2" /> Copy HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCode(!showCode)} disabled={!htmlContent}>
                    <Code className="w-4 h-4 mr-2" /> {showCode ? "Hide" : "View"} Code
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => requireAuthAndPremium(() => setShowVercel(true))} disabled={!htmlContent}>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg>
                    Deploy to Vercel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <ToolbarContent />
          )}
        </div>
      </div>

      {/* Preview + code panel */}
      <div className="flex-1 relative overflow-hidden flex flex-row min-h-0">
        <div className="flex-1 flex flex-col relative min-w-0">
          <div className="flex-1 flex justify-center items-start overflow-auto p-2 md:p-6">
            <motion.div
              layout
              className={`relative bg-white rounded-lg md:rounded-xl overflow-hidden transition-all duration-500 shadow-xl md:shadow-2xl ring-1 ring-border/50 ${status === "streaming" ? "ring-primary/50 shadow-[0_0_20px_rgba(0,255,255,0.1)]" : ""} ${!htmlContent ? "bg-transparent ring-0 shadow-none" : ""}`}
              style={{
                width: "100%",
                maxWidth: isMobile ? "100%" : deviceWidth === "mobile" ? "390px" : deviceWidth === "tablet" ? "768px" : "100%",
                minHeight: "100%",
              }}
            >
              <iframe
                ref={iframeRef}
                key="vora-preview-iframe"
                srcDoc={htmlContent || "<!doctype html><html><body style=\"margin:0;background:transparent\"></body></html>"}
                className={`w-full h-full min-h-[400px] bg-white ${!htmlContent ? "opacity-0 pointer-events-none" : ""}`}
                sandbox="allow-scripts"
                title="Preview"
                style={{ minHeight: isMobile ? "calc(100vh - 120px)" : "100%" }}
              />
              {!htmlContent && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/50 border border-border/20 rounded-xl pointer-events-none">
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center px-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 neon-border">
                      <VoraIcon className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-1">Describe anything.</h2>
                    <p className="text-muted-foreground text-sm">We'll build it.</p>
                    {isMobile && (
                      <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => setActiveTab("compose")}>
                        <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Go to Compose
                      </Button>
                    )}
                  </motion.div>
                </div>
              )}
              {status === "thinking" && !htmlContent && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-xl pointer-events-none">
                  <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/30 bg-background/80 text-sm text-primary shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                    <Loader2 className="w-4 h-4 animate-spin" /> Booting up Gemini…
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Code panel — hidden on mobile */}
          <AnimatePresence>
            {showCode && !isMobile && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "38%", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="border-t border-border/50 bg-[#0d0d0d] overflow-hidden flex flex-col shrink-0">
                <div className="h-8 bg-secondary/30 border-b border-border/30 flex items-center justify-between px-4 text-xs font-mono text-muted-foreground shrink-0">
                  <div className="flex items-center gap-2"><TerminalSquare className="w-3.5 h-3.5" /> generated.html</div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyCode} disabled={!htmlContent}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-gray-300">
                  <pre className="m-0 whitespace-pre-wrap break-all"><code>{htmlContent || "/* Awaiting generation… */"}</code></pre>
                  <div ref={codeEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SEO sidebar — desktop only */}
        <AnimatePresence>
          {showSeo && !isMobile && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden shrink-0">
              <SEOMaster html={htmlContent} onFix={handleSEOFix} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full bg-background text-foreground selection:bg-primary/30 flex flex-col md:flex-row overflow-hidden">
      {isMobile ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col w-full">
          <div className="flex-1 overflow-hidden min-h-0">
            <TabsContent value="compose" className="h-full m-0 data-[state=active]:flex flex-col overflow-hidden">
              <ComposePane />
            </TabsContent>
            <TabsContent value="preview" className="h-full m-0 data-[state=active]:flex flex-col overflow-hidden">
              <PreviewPane />
            </TabsContent>
          </div>
          {/* Mobile bottom tab bar */}
          <div className="h-14 bg-background/95 backdrop-blur-sm border-t border-border/50 flex items-center px-4 shrink-0">
            <TabsList className="grid w-full grid-cols-2 bg-transparent h-10">
              <TabsTrigger value="compose" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium text-sm">
                <Sparkles className="w-4 h-4 mr-1.5" /> Compose
              </TabsTrigger>
              <TabsTrigger value="preview" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium text-sm">
                Preview
                {(status === "thinking" || status === "streaming") && <div className="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      ) : (
        <>
          <ComposePane />
          <PreviewPane />
        </>
      )}

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
        onShared={(slug) => setCurrentSharedSlug(slug)}
      />
    </div>
  );
}
