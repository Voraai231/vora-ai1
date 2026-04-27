import { useState, useRef, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenAI } from "@google/genai";
import { useSpeech } from "@/hooks/useSpeech";
import { VoraIcon } from "@/components/VoraIcon";
import {
  Mic,
  MicOff,
  Loader2,
  Sparkles,
  Send,
  Copy,
  Download,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Code,
  Zap,
  TerminalSquare,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const queryClient = new QueryClient();

// Initial system prompt
const SYSTEM_PROMPT = `You are Vora AI, an expert frontend engineer. You generate beautiful, fully self-contained HTML documents using Tailwind CSS via the CDN.
Rules:
1. Output ONLY the raw HTML string. No markdown code blocks (no \`\`\`html), no commentary, no explanations.
2. The HTML must include: <script src="https://cdn.tailwindcss.com"></script> in the head.
3. Make the design premium, modern, and beautiful. Use thoughtful spacing, typography, and colors.
4. Default to a dark theme if not specified, but respect whatever the user asks.
5. Provide a complete, valid document structure (<html>, <head>, <body>).
6. Do NOT include any external resources that might fail to load (use simple placeholder images from unpkg or placehold.co if needed).
7. Ensure the result is fully responsive.`;

function VoraApp() {
  const [prompt, setPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "streaming" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [deviceWidth, setDeviceWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  
  const { isListening, transcript, supported, toggleListening, setTranscript } = useSpeech();
  const { toast } = useToast();
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeEndRef = useRef<HTMLDivElement>(null);

  // Update prompt when transcript changes
  useEffect(() => {
    if (transcript) {
      setPrompt((prev) => {
        // Avoid duplicate appends if editing while listening
        const base = prev.replace(transcript, "");
        return base + transcript;
      });
    }
  }, [transcript]);

  // Scroll to bottom of code view when streaming
  useEffect(() => {
    if (showCode && status === "streaming") {
      codeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [htmlContent, showCode, status]);

  const handleGenerate = async (currentPrompt: string = prompt) => {
    if (!currentPrompt.trim()) return;
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setStatus("error");
      setErrorMessage("VITE_GEMINI_API_KEY is missing. Please add it to your secrets.");
      return;
    }

    setStatus("thinking");
    setErrorMessage("");
    setHtmlContent("");
    setLastPrompt(currentPrompt);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT,
        contents: [{ role: "user", parts: [{ text: currentPrompt }] }],
      });

      setStatus("streaming");
      let fullText = "";
      
      for await (const chunk of responseStream) {
        const text = chunk.text;
        fullText += text;
        
        // Strip markdown fences if present
        let cleanHtml = fullText.replace(/^```html\n?/, "").replace(/```$/, "");
        setHtmlContent(cleanHtml);
        
        if (iframeRef.current) {
          iframeRef.current.srcdoc = cleanHtml;
        }
      }
      
      setStatus("idle");
      // Clear transcript so next dictation starts fresh
      setTranscript("");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An error occurred while generating.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      toast({
        title: "Copied!",
        description: "HTML copied to clipboard.",
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const downloadHtml = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vora-output.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getIframeWidth = () => {
    switch (deviceWidth) {
      case "mobile": return "390px";
      case "tablet": return "768px";
      case "desktop": return "100%";
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden bg-background text-foreground selection:bg-primary/30">
      
      {/* LEFT PANE: COMMAND CENTER */}
      <div className="w-full md:w-[400px] lg:w-[480px] h-full border-r border-border/50 flex flex-col relative z-10 bg-background/80 backdrop-blur-xl shrink-0">
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center neon-border">
            <VoraIcon className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Vora AI</span>
        </div>

        {/* Hero Copy */}
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

        {/* Input Area */}
        <div className="px-6 flex-1 flex flex-col justify-center min-h-[300px]">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/0 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative bg-card border border-border/50 rounded-xl overflow-hidden focus-within:border-primary/50 focus-within:neon-border transition-all duration-300">
              <Textarea
                placeholder="What are we building today? (Cmd + Enter to ship)"
                className="min-h-[160px] max-h-[40vh] resize-none border-0 focus-visible:ring-0 text-base p-4 bg-transparent"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              
              <div className="p-3 bg-card/50 border-t border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TooltipProvider delayDuration={200}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-full transition-all ${isListening ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-primary"}`}
                      onClick={toggleListening}
                      title={supported ? "Voice input" : "Voice not supported in this browser"}
                      disabled={!supported}
                    >
                      {isListening ? (
                        <div className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-40 animate-ping"></span>
                          <Mic className="w-5 h-5 relative z-10" />
                        </div>
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </Button>
                  </TooltipProvider>
                </div>
                
                <Button 
                  onClick={() => handleGenerate()} 
                  disabled={!prompt.trim() || status === "thinking" || status === "streaming"}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full px-6 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all"
                >
                  {(status === "thinking" || status === "streaming") ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Ship it
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              "A pricing page with 3 tiers",
              "A signup form with glass morphism",
              "A neon hero section"
            ].map((sugg) => (
              <button
                key={sugg}
                onClick={() => setPrompt(sugg)}
                className="text-xs px-3 py-1.5 rounded-full border border-border/50 bg-secondary/30 hover:bg-secondary/80 hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                {sugg}
              </button>
            ))}
          </div>

          {/* Error State */}
          <AnimatePresence>
            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Generation Failed</p>
                  <p className="opacity-90">{errorMessage}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 h-8 border-destructive/30 hover:bg-destructive/20 text-destructive"
                    onClick={() => handleGenerate(lastPrompt)}
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        <div className="p-4 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === "idle" ? "bg-muted-foreground/30" : 
              status === "error" ? "bg-destructive" : "bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]"
            }`} />
            {status === "idle" && "Ready to build"}
            {status === "thinking" && "Thinking..."}
            {status === "streaming" && "Vora is shipping..."}
            {status === "error" && "Error"}
          </div>
          <div className="flex items-center gap-1 opacity-50">
            <Zap className="w-3 h-3" />
            <span>Gemini 2.5 Flash</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: LIVE PREVIEW */}
      <div className="flex-1 flex flex-col relative bg-[#0a0a0a] overflow-hidden">
        
        {/* Animated Divider line */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-50" />

        {/* Toolbar */}
        <div className="h-14 border-b border-border/30 flex items-center justify-between px-4 bg-background/40 backdrop-blur-sm z-20">
          
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1.5 mr-4">
              <div className="w-3 h-3 rounded-full bg-destructive/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            
            <div className="bg-secondary/50 rounded-md px-3 py-1 text-xs font-mono text-muted-foreground flex items-center gap-2 border border-border/30">
              <span>vora://preview</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex bg-secondary/30 rounded-lg p-0.5 border border-border/30 mr-2">
              <Button variant="ghost" size="icon" className={`h-7 w-8 rounded-md ${deviceWidth === "desktop" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`} onClick={() => setDeviceWidth("desktop")}>
                <Monitor className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className={`h-7 w-8 rounded-md ${deviceWidth === "tablet" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`} onClick={() => setDeviceWidth("tablet")}>
                <Tablet className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className={`h-7 w-8 rounded-md ${deviceWidth === "mobile" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`} onClick={() => setDeviceWidth("mobile")}>
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setShowCode(!showCode)} title="Toggle Code">
              <Code className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={copyCode} disabled={!htmlContent} title="Copy HTML">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={downloadHtml} disabled={!htmlContent} title="Download HTML">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => lastPrompt && handleGenerate(lastPrompt)} disabled={!lastPrompt || status !== "idle"} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${status === "thinking" ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Content Area (Iframe + Code) */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          
          {/* Iframe Wrapper */}
          <div className="flex-1 flex justify-center items-start overflow-auto p-4 md:p-8">
            <motion.div 
              layout
              className={`relative bg-white rounded-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl ring-1 ring-border/50
                ${status === "streaming" ? "ring-primary/50 shadow-[0_0_30px_rgba(0,255,255,0.15)]" : ""}
                ${!htmlContent ? "bg-transparent ring-0 shadow-none" : ""}
              `}
              style={{ width: "100%", maxWidth: getIframeWidth(), height: "100%" }}
            >
              {!htmlContent ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/50 border border-border/20 rounded-xl">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 neon-border">
                      <VoraIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Describe anything.</h2>
                    <p className="text-muted-foreground">We'll build it.</p>
                  </motion.div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  className="w-full h-full bg-white"
                  sandbox="allow-scripts"
                  title="Preview"
                />
              )}
            </motion.div>
          </div>

          {/* Code Panel (Collapsible) */}
          <AnimatePresence>
            {showCode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "40%", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="border-t border-border/50 bg-[#0d0d0d] overflow-hidden flex flex-col shrink-0"
              >
                <div className="h-8 bg-secondary/30 border-b border-border/30 flex items-center px-4 text-xs font-mono text-muted-foreground shrink-0">
                  <TerminalSquare className="w-3.5 h-3.5 mr-2" />
                  generated.html
                </div>
                <div className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-gray-300">
                  <pre className="m-0 whitespace-pre-wrap break-all">
                    <code>{htmlContent || "/* Awaiting generation... */"}</code>
                  </pre>
                  <div ref={codeEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/" component={VoraApp} />
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
