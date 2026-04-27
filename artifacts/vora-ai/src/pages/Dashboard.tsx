import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenAI } from "@google/genai";
import { useSpeech } from "@/hooks/useSpeech";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { getProject } from "@/lib/projects";
import { useZipExport } from "@/hooks/useZipExport";
import { VoraIcon } from "@/components/VoraIcon";
import { TemplatesPicker } from "@/components/TemplatesPicker";
import { PricingModal } from "@/components/PricingModal";
import { VercelDeployModal } from "@/components/VercelDeployModal";
import { SaveProjectModal } from "@/components/SaveProjectModal";
import { PromoteModal } from "@/components/PromoteModal";
import { SEOMaster } from "@/components/SEOMaster";
import {
  Mic, Loader2, Sparkles, Code, Copy, Download, RefreshCw, 
  Smartphone, Tablet, Monitor, TerminalSquare, AlertTriangle,
  Wand2, Search, Megaphone, Crown, LogIn, Lock, MoreVertical,
  Save, Folder, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const SYSTEM_PROMPT = `You are Vora AI, an expert frontend engineer. You generate beautiful, fully self-contained HTML documents using Tailwind CSS via the CDN.
Rules:
1. Output ONLY the raw HTML string. No markdown code blocks (no \`\`\`html), no commentary, no explanations.
2. The HTML must include: <script src="https://cdn.tailwindcss.com"></script> in the head.
3. Make the design premium, modern, and beautiful. Use thoughtful spacing, typography, and colors.
4. Default to a dark theme if not specified, but respect whatever the user asks.
5. Provide a complete, valid document structure (<html>, <head>, <body>).
6. Do NOT include any external resources that might fail to load (use simple placeholder images from unpkg or placehold.co if needed).
7. Ensure the result is fully responsive.`;

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "streaming" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [deviceWidth, setDeviceWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  
  // Project State
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  const [currentProjectTitle, setCurrentProjectTitle] = useState("");

  // Modals
  const [showPricing, setShowPricing] = useState(false);
  const [showVercel, setShowVercel] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showPromote, setShowPromote] = useState(false);

  const { isListening, transcript, supported, toggleListening, setTranscript } = useSpeech();
  const { toast } = useToast();
  const { user, signIn, signOut } = useAuth();
  const { tier } = useTier();
  const { exportZip, isExporting: isZipping } = useZipExport();
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("compose");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeEndRef = useRef<HTMLDivElement>(null);

  // Load project from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && user) {
      getProject(user, id).then(p => {
        if (p) {
          setCurrentProjectId(p.id);
          setCurrentProjectTitle(p.title);
          setPrompt(p.prompt);
          setHtmlContent(p.html);
          setLastPrompt(p.prompt);
          if (iframeRef.current) iframeRef.current.srcdoc = p.html;
          if (isMobile) setActiveTab("preview");
        }
      });
    }
  }, [user, isMobile]);

  useEffect(() => {
    if (transcript) {
      setPrompt(prev => prev.replace(transcript, "") + transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (showCode && status === "streaming") {
      codeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [htmlContent, showCode, status]);

  const handleGenerate = async (currentPrompt: string = prompt, sysPrompt: string = SYSTEM_PROMPT) => {
    if (!currentPrompt.trim()) return;
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setStatus("error");
      setErrorMessage("VITE_GEMINI_API_KEY is missing.");
      return;
    }

    setStatus("thinking");
    setErrorMessage("");
    setHtmlContent("");
    if (sysPrompt === SYSTEM_PROMPT) setLastPrompt(currentPrompt); // Don't override last prompt on auto-fixes

    try {
      const ai = new GoogleGenAI({ apiKey });
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        systemInstruction: sysPrompt,
        contents: [{ role: "user", parts: [{ text: currentPrompt }] }],
      });

      setStatus("streaming");
      let fullText = "";
      
      for await (const chunk of responseStream) {
        fullText += chunk.text;
        let cleanHtml = fullText.replace(/^```html\n?/, "").replace(/```$/, "");
        setHtmlContent(cleanHtml);
        if (iframeRef.current) iframeRef.current.srcdoc = cleanHtml;
      }
      
      setStatus("idle");
      setTranscript("");
      if (isMobile) setActiveTab("preview");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An error occurred.");
    }
  };

  const handleMagicWand = () => {
    if (tier === "starter") {
      setShowPricing(true);
      return;
    }
    const fixPrompt = "You are a senior frontend engineer. Audit this HTML for UI bugs (broken layouts, accessibility issues, contrast problems, mobile breakage, missing alt text, unclosed tags, broken Tailwind classes, missing meta tags) and return a FIXED full HTML document. Output only raw HTML, no commentary, no markdown fences.\n\nHTML to fix:\n" + htmlContent;
    handleGenerate(fixPrompt, "Return ONLY raw HTML. Fix all issues.");
    toast({ title: "Magic Wand activated", description: "Fixing layout and accessibility issues..." });
  };

  const handleSEOFix = (issues: string[]) => {
    if (tier === "starter") {
      setShowPricing(true);
      return;
    }
    const fixPrompt = `Fix the following SEO issues in this HTML document:\n${issues.join("\n")}\n\nHTML:\n${htmlContent}`;
    handleGenerate(fixPrompt, "Return ONLY raw HTML. Fix the requested SEO issues.");
    toast({ title: "Fixing SEO", description: "Applying AI optimizations..." });
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(htmlContent);
    toast({ title: "Copied!", description: "HTML copied to clipboard." });
  };

  const handleDownload = () => {
    if (tier !== "starter") {
      exportZip(htmlContent, lastPrompt, currentProjectTitle);
    } else {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentProjectTitle || "vora"}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const requirePremium = (fn: () => void) => {
    if (tier === "starter") setShowPricing(true);
    else fn();
  };

  const requireAuthAndPremium = (fn: () => void) => {
    if (!user) toast({ title: "Sign in required", description: "Please sign in to use this feature." });
    else if (tier === "starter") setShowPricing(true);
    else fn();
  };

  // UI Components
  const AuthNav = () => (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 rounded-full relative">
              <Avatar className="h-9 w-9 border border-border/50">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/projects")} className="cursor-pointer">
              <Folder className="w-4 h-4 mr-2" /> My Projects
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowPricing(true)} className="cursor-pointer text-primary">
              <Crown className="w-4 h-4 mr-2" /> Plan: {tier.toUpperCase()}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="outline" size="sm" onClick={signIn} className="neon-border rounded-full h-9">
          <LogIn className="w-4 h-4 mr-2" /> Sign In
        </Button>
      )}
    </div>
  );

  const LeftPane = () => (
    <div className="w-full md:w-[400px] lg:w-[480px] h-full border-r border-border/50 flex flex-col relative z-10 bg-background/80 backdrop-blur-xl shrink-0">
      <div className="p-6 pb-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center neon-border">
          <VoraIcon className="w-5 h-5 text-primary" />
        </div>
        <span className="font-bold text-xl tracking-tight">Vora AI</span>
        {currentProjectTitle && (
          <span className="ml-2 px-2 py-0.5 bg-secondary text-xs rounded-md truncate max-w-[150px]">
            {currentProjectTitle}
          </span>
        )}
      </div>

      <div className="px-6 py-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight">
          Speak it.<br />
          <span className="text-primary neon-text">Type it.</span><br />
          Ship it.
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Describe the interface you want. Watch it build in real-time.
        </p>
      </div>

      <div className="px-6 flex-1 flex flex-col min-h-[300px] pb-6">
        <TemplatesPicker onSelect={(p) => setPrompt(p)} />
        
        <div className="relative group flex-1 flex flex-col">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/0 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
          <div className="relative flex-1 flex flex-col bg-card border border-border/50 rounded-xl overflow-hidden focus-within:border-primary/50 focus-within:neon-border transition-all duration-300">
            <Textarea
              placeholder="What are we building today? (Cmd + Enter to ship)"
              className="flex-1 resize-none border-0 focus-visible:ring-0 text-base p-4 bg-transparent min-h-[120px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleGenerate(); } }}
            />
            
            <div className="p-3 bg-card/50 border-t border-border/30 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className={`rounded-full transition-all ${isListening ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-primary"}`}
                        onClick={toggleListening} disabled={!supported}
                      >
                        {isListening ? (
                          <div className="relative flex items-center justify-center">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-40 animate-ping"></span>
                            <Mic className="w-5 h-5 relative z-10" />
                          </div>
                        ) : <Mic className="w-5 h-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{supported ? "Voice dictation" : "Not supported in this browser"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Button 
                onClick={() => handleGenerate()} 
                disabled={!prompt.trim() || status === "thinking" || status === "streaming"}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full px-6 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all"
              >
                {(status === "thinking" || status === "streaming") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Ship it
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {status === "error" && (
            <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -10, height: 0 }} className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-1">Generation Failed</p>
                <p className="opacity-90">{errorMessage}</p>
                <Button variant="outline" size="sm" className="mt-3 h-8 border-destructive/30 hover:bg-destructive/20 text-destructive" onClick={() => handleGenerate(lastPrompt)}>Try Again</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === "idle" ? "bg-muted-foreground/30" : status === "error" ? "bg-destructive" : "bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]"}`} />
          {status === "idle" && "Ready to build"}
          {status === "thinking" && "Thinking..."}
          {status === "streaming" && "Vora is shipping..."}
        </div>
      </div>
    </div>
  );

  const ToolbarButtons = () => (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => user ? setShowSave(true) : toast({ title: "Sign in required" })} disabled={!htmlContent}>
              <Save className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save Project</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleMagicWand} disabled={!htmlContent}>
              <div className="relative">
                <Wand2 className="w-4 h-4" />
                {tier === "starter" && <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-primary" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Magic Wand (Premium)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${showSeo ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`} onClick={() => requirePremium(() => setShowSeo(!showSeo))} disabled={!htmlContent}>
              <div className="relative">
                <Search className="w-4 h-4" />
                {tier === "starter" && <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-primary" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>SEO Master (Premium)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => requirePremium(() => setShowPromote(true))} disabled={!htmlContent || !currentProjectTitle}>
              <div className="relative">
                <Megaphone className="w-4 h-4" />
                {tier === "starter" && <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-primary" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{!currentProjectTitle ? "Save project first to Promote" : "Promote Kit (Premium)"}</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border/50 mx-1 hidden sm:block" />

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex" onClick={() => setShowCode(!showCode)} title="Toggle Code">
          <Code className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex" onClick={copyCode} disabled={!htmlContent} title="Copy">
          <Copy className="w-4 h-4" />
        </Button>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleDownload} disabled={!htmlContent || isZipping}>
              <div className="relative">
                {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {tier === "starter" && <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground px-1 rounded-sm leading-none">ZIP</span>}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download (ZIP for Premium)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => requireAuthAndPremium(() => setShowVercel(true))} disabled={!htmlContent}>
              <div className="relative">
                <svg className="w-4 h-4" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>
                {tier === "starter" && <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-primary" />}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Deploy to Vercel (Billionaire)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );

  const PreviewPane = () => (
    <div className="flex-1 flex flex-col relative bg-[#0a0a0a] overflow-hidden">
      {!isMobile && <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-50" />}
      
      <div className="h-14 border-b border-border/30 flex items-center justify-between px-4 bg-background/40 backdrop-blur-sm z-20">
        <div className="flex items-center gap-1.5">
          {!isMobile && (
            <div className="flex gap-1.5 mr-4">
              <div className="w-3 h-3 rounded-full bg-destructive/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
          )}
          <div className="bg-secondary/50 rounded-md px-3 py-1 text-xs font-mono text-muted-foreground flex items-center gap-2 border border-border/30 max-w-[120px] sm:max-w-none truncate">
            <span>vora://preview</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isMobile && (
            <div className="flex bg-secondary/30 rounded-lg p-0.5 border border-border/30 mr-2">
              {(["desktop", "tablet", "mobile"] as const).map(w => (
                <Button key={w} variant="ghost" size="icon" className={`h-7 w-8 rounded-md ${deviceWidth === w ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`} onClick={() => setDeviceWidth(w)}>
                  {w === "desktop" && <Monitor className="w-4 h-4" />}
                  {w === "tablet" && <Tablet className="w-4 h-4" />}
                  {w === "mobile" && <Smartphone className="w-4 h-4" />}
                </Button>
              ))}
            </div>
          )}
          
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 flex flex-wrap gap-1 p-2">
                <ToolbarButtons />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ToolbarButtons />
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-row">
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 flex justify-center items-start overflow-auto p-4 md:p-8">
            <motion.div 
              layout
              className={`relative bg-white rounded-xl overflow-hidden transition-all duration-500 shadow-2xl ring-1 ring-border/50 ${status === "streaming" ? "ring-primary/50 shadow-[0_0_30px_rgba(0,255,255,0.15)]" : ""} ${!htmlContent ? "bg-transparent ring-0 shadow-none" : ""}`}
              style={{ width: "100%", maxWidth: isMobile ? "100%" : (deviceWidth === "mobile" ? "390px" : deviceWidth === "tablet" ? "768px" : "100%"), height: "100%" }}
            >
              {!htmlContent ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/50 border border-border/20 rounded-xl">
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 neon-border">
                      <VoraIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Describe anything.</h2>
                    <p className="text-muted-foreground">We'll build it.</p>
                  </motion.div>
                </div>
              ) : (
                <iframe ref={iframeRef} className="w-full h-full bg-white" sandbox="allow-scripts" title="Preview" />
              )}
            </motion.div>
          </div>

          <AnimatePresence>
            {showCode && !isMobile && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "40%", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/50 bg-[#0d0d0d] overflow-hidden flex flex-col shrink-0">
                <div className="h-8 bg-secondary/30 border-b border-border/30 flex items-center px-4 text-xs font-mono text-muted-foreground shrink-0">
                  <TerminalSquare className="w-3.5 h-3.5 mr-2" /> generated.html
                </div>
                <div className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-gray-300">
                  <pre className="m-0 whitespace-pre-wrap break-all"><code>{htmlContent || "/* Awaiting generation... */"}</code></pre>
                  <div ref={codeEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SEO Sidebar */}
        <AnimatePresence>
          {showSeo && !isMobile && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden">
              <SEOMaster html={htmlContent} onFix={handleSEOFix} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full bg-background text-foreground selection:bg-primary/30 flex flex-col md:flex-row overflow-hidden">
      <AuthNav />
      
      {isMobile ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col w-full">
          <div className="flex-1 overflow-hidden">
            <TabsContent value="compose" className="h-full m-0 data-[state=active]:flex flex-col"><LeftPane /></TabsContent>
            <TabsContent value="preview" className="h-full m-0 data-[state=active]:flex flex-col"><PreviewPane /></TabsContent>
          </div>
          <div className="h-14 bg-background border-t border-border/50 px-4">
            <TabsList className="grid w-full h-full grid-cols-2 bg-transparent">
              <TabsTrigger value="compose" className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Compose</TabsTrigger>
              <TabsTrigger value="preview" className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                Preview
                {status !== "idle" && <div className="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      ) : (
        <>
          <LeftPane />
          <PreviewPane />
        </>
      )}

      {/* Modals */}
      <PricingModal open={showPricing} onOpenChange={setShowPricing} />
      <VercelDeployModal open={showVercel} onOpenChange={setShowVercel} html={htmlContent} title={currentProjectTitle} />
      <SaveProjectModal 
        open={showSave} 
        onOpenChange={setShowSave} 
        html={htmlContent} 
        prompt={lastPrompt || prompt} 
        currentProjectId={currentProjectId}
        currentTitle={currentProjectTitle}
        onSaved={(id, title) => { setCurrentProjectId(id); setCurrentProjectTitle(title); }}
      />
      <PromoteModal open={showPromote} onOpenChange={setShowPromote} html={htmlContent} prompt={lastPrompt || prompt} title={currentProjectTitle} />
    </div>
  );
}
