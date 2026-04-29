import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenAI } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoraIcon } from "@/components/VoraIcon";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Sparkles, Loader2, Copy, Youtube, Ghost,
  Megaphone, RefreshCw, Download, ChevronRight, Zap
} from "lucide-react";

type Tool = "youtube" | "horror" | "viral" | "ad";

interface ToolConfig {
  id: Tool;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  placeholder: string;
  buildPrompt: (input: string) => string;
}

const TOOLS: ToolConfig[] = [
  {
    id: "youtube",
    label: "YouTube Script",
    icon: <Youtube className="w-5 h-5" />,
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    description: "Viral-optimized video scripts with hooks, chapters & CTAs",
    placeholder: "Topic: 'How I made $10K with AI in 30 days'",
    buildPrompt: (topic) => `You are an elite YouTube scriptwriter who has written scripts for channels with 10M+ subscribers.

Write a complete, viral YouTube video script for: "${topic}"

Structure it exactly like this:
# TITLE OPTIONS (3 click-bait but honest title ideas)
[List 3 titles]

# HOOK (first 30 seconds — make viewer stay)
[Write the hook — open with a bold statement, story, or shocking fact]

# INTRO (30s–90s)
[Brief intro, creator intro, and what they'll learn]

# CHAPTER 1: [Name]
[Content]

# CHAPTER 2: [Name]
[Content]

# CHAPTER 3: [Name]
[Content]

# CHAPTER 4: [Name]
[Content]

# CTA & OUTRO
[Subscription CTA, comment hook, end screen mention]

# THUMBNAIL CONCEPT
[Describe the ideal thumbnail]

# TAGS
[10-15 SEO tags]

Make the script conversational, engaging, with natural pauses marked as [PAUSE], emphasis marked as [EMPHASIS], and B-roll suggestions marked as [B-ROLL: description].
Aim for a 10-12 minute video (~1800 words of spoken content).`,
  },
  {
    id: "horror",
    label: "Horror Story",
    icon: <Ghost className="w-5 h-5" />,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    description: "Reddit-style horror stories optimized for engagement",
    placeholder: "Concept: 'A door appeared in my basement that wasn't there yesterday'",
    buildPrompt: (concept) => `You are a master horror writer in the style of r/nosleep — your stories are terrifyingly realistic, psychologically disturbing, and go viral.

Write a complete, chilling horror story based on: "${concept}"

Requirements:
- Written in first-person, Reddit/r/nosleep style ("This really happened to me")
- 800-1200 words
- Build dread slowly — mundane details that become horrifying
- Include: a slow build, a terrifying revelation, and a deeply unsettling ending
- Include sensory details (sounds, smells, textures)
- The ending should leave the reader disturbed and wanting to share it
- Include a Reddit-style title that would get maximum upvotes
- Add a [TITLE] prefix for the post title
- Add a [TAGS] section at the end with relevant subreddit tags

Make it impossible to stop reading once started.`,
  },
  {
    id: "viral",
    label: "Viral Thread",
    icon: <Megaphone className="w-5 h-5" />,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    description: "Twitter/X threads designed to go viral and drive followers",
    placeholder: "Topic: 'The 10 brutal truths about building a startup nobody tells you'",
    buildPrompt: (topic) => `You are a viral Twitter/X content strategist. Your threads consistently hit 1M+ impressions.

Write a complete viral Twitter/X thread about: "${topic}"

Rules:
- First tweet MUST be a HOOK that stops the scroll — bold, controversial, or deeply relatable
- Each tweet: max 270 characters
- 12-18 tweets total
- Thread format: "1/" "2/" etc.
- Use short sentences. Punchy. Direct.
- Include: 2-3 tweets with data or stats, 1-2 personal anecdotes, a tweet inviting replies/engagement
- Last tweet: strong CTA (follow, retweet, or save)
- Add a "THREAD ANALYSIS" section at the end with: predicted reach, best time to post, and why this will perform

Make it impossible NOT to retweet.`,
  },
  {
    id: "ad",
    label: "Ad Copy",
    icon: <Zap className="w-5 h-5" />,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    description: "High-converting ad copy for Meta, Google & TikTok",
    placeholder: "Product: 'AI-powered website builder that ships in 30 seconds'",
    buildPrompt: (product) => `You are a world-class direct response copywriter (think David Ogilvy meets Gary Halbert).

Write a complete ad copy package for: "${product}"

Include ALL of the following:

## FACEBOOK/INSTAGRAM AD
**Primary Text (3 variations — short, medium, long):**
[Write 3 versions]

**Headlines (5 options):**
[List 5]

**Descriptions (3 options):**
[List 3]

## GOOGLE ADS
**Responsive Search Ad:**
- Headlines (10): [list]
- Descriptions (4): [list]

## TIKTOK/SHORT FORM VIDEO SCRIPT
**Hook (3 options for first 3 seconds):**
[List 3 hooks]
**Full 30-second script:**
[Script]

## EMAIL SUBJECT LINES (10 options)
[List 10]

## LANDING PAGE HEADLINE + SUBHEADLINE (3 variations)
[List 3 sets]

Make everything conversion-focused. Use psychological triggers: urgency, social proof, loss aversion, curiosity.`,
  },
];

export default function ContentStudio() {
  const [, setLocation] = useLocation();
  const [activeTool, setActiveTool] = useState<Tool>("youtube");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");
  const { toast } = useToast();

  const tool = TOOLS.find((t) => t.id === activeTool)!;

  const handleGenerate = async () => {
    if (!input.trim()) return;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast({ title: "API key missing", description: "VITE_GEMINI_API_KEY is not set.", variant: "destructive" });
      return;
    }
    setStatus("generating");
    setOutput("");
    try {
      const ai = new GoogleGenAI({ apiKey });
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: tool.buildPrompt(input) }] }],
        config: { temperature: 0.85, responseMimeType: "text/plain" },
      });
      let full = "";
      for await (const chunk of stream) {
        full += chunk.text ?? "";
        setOutput(full);
      }
      setStatus("done");
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      setStatus("idle");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vora-${activeTool}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="h-16 border-b border-border/30 px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="font-semibold text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center neon-border">
              <VoraIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            Content Studio
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          AI Viral Tools
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-border/30 p-4 flex flex-col gap-2 shrink-0 bg-background/60 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2 mb-2">Tools</p>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id); setInput(""); setOutput(""); setStatus("idle"); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm font-medium border ${
                activeTool === t.id
                  ? `${t.color} neon-border`
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-transparent"
              }`}
            >
              {t.icon}
              {t.label}
              {activeTool === t.id && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </aside>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="md:w-[360px] shrink-0 border-r border-border/30 flex flex-col p-6 gap-5 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold mb-1">{tool.label}</h2>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Your Input</label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tool.placeholder}
                className="min-h-[140px] resize-none bg-secondary/30 border-border/50 focus-visible:border-primary/50 focus-visible:neon-border transition-all"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              />
              <p className="text-[11px] text-muted-foreground">Cmd+Enter to generate</p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!input.trim() || status === "generating"}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]"
            >
              {status === "generating" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate</>
              )}
            </Button>

            {status === "done" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Save
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setOutput(""); setStatus("idle"); }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {status === "idle" && !output && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center gap-6 py-20"
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${tool.color} text-4xl`}>
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Ready to go viral</h3>
                    <p className="text-muted-foreground max-w-sm text-sm">Fill in your topic and hit Generate. Vora AI will craft content engineered to spread.</p>
                  </div>
                </motion.div>
              )}

              {(status === "generating" || status === "done") && output && (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Output</h3>
                    {status === "generating" && (
                      <span className="flex items-center gap-1.5 text-xs text-primary">
                        <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                      </span>
                    )}
                    {status === "done" && (
                      <span className="flex items-center gap-1.5 text-xs text-primary">
                        <Sparkles className="w-3 h-3" /> Complete
                      </span>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground/90 bg-secondary/20 rounded-xl border border-border/40 p-6">
                    {output}
                    {status === "generating" && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 rounded-sm" />}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
