import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are Vora Assistant — a friendly, expert AI helper built into the Vora AI website builder platform.

You help users with:
- Using Vora AI to build websites (prompts, features, tips)
- HTML, CSS, JavaScript, and Tailwind CSS questions
- SEO best practices and optimization
- YouTube channel automation and growth strategies
- Web development in general
- Troubleshooting issues on their generated websites

Keep responses concise, practical, and helpful. Use code examples when relevant. If the user asks something unrelated to web/tech, gently redirect them to what you can help with.`;

export function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Vora Assistant. Ask me anything about building websites, SEO, YouTube automation, or how to get the most out of Vora AI."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      if (!apiKey) throw new Error("Gemini API key not configured.");

      const ai = new GoogleGenAI({ apiKey });
      const history = [...messages, userMsg];

      const contents = history.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.0-flash",
        config: { systemInstruction: SYSTEM_PROMPT },
        contents,
      });

      let reply = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      for await (const chunk of stream) {
        const part = chunk.text ?? "";
        reply += part;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: reply };
          return updated;
        });
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${err?.message || "Could not get a response. Please try again."}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 w-[340px] sm:w-[380px] h-[520px] flex flex-col bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="h-12 bg-primary/10 border-b border-border/40 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-sm">Vora Assistant</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">LIVE</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === "user" ? "bg-primary/20" : "bg-secondary/60"
                  }`}>
                    {msg.role === "user"
                      ? <User className="w-3.5 h-3.5 text-primary" />
                      : <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                    }
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-secondary/50 text-foreground rounded-tl-sm"
                  }`}>
                    {msg.content || (loading && i === messages.length - 1
                      ? <span className="flex gap-1 items-center py-0.5"><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{animationDelay:"0ms"}} /><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{animationDelay:"150ms"}} /><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{animationDelay:"300ms"}} /></span>
                      : null
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-border/40 shrink-0">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything… (Enter to send)"
                  rows={1}
                  className="resize-none min-h-[38px] max-h-[100px] text-sm py-2 bg-secondary/30 border-border/50 focus:ring-primary/40"
                  disabled={loading}
                  data-testid="chatbot-input"
                />
                <Button
                  size="icon"
                  className="h-[38px] w-[38px] shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={send}
                  disabled={loading || !input.trim()}
                  data-testid="chatbot-send"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              {!apiKey && (
                <p className="text-[10px] text-destructive mt-1">VITE_GEMINI_API_KEY not set</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,255,255,0.4)] flex items-center justify-center"
        data-testid="chatbot-toggle"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-5 h-5" /></motion.span>
            : <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle className="w-5 h-5" /></motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </>
  );
}
