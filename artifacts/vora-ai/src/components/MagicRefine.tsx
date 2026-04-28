import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Loader2, X, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  hasContent: boolean;
  busy: boolean;
  onRefine: (instruction: string) => void;
}

const QUICK_REFINES = [
  "Make the header dark navy",
  "Add a contact form before the footer",
  "Use a warmer color palette",
  "Add subtle hover animations to buttons",
  "Make the hero more dramatic",
];

export function MagicRefine({ hasContent, busy, onRefine }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  if (!hasContent) return null;

  const submit = () => {
    const v = text.trim();
    if (!v || busy) return;
    onRefine(v);
    setText("");
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(92%,640px)]">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.div
            key="closed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <Button
              onClick={() => setOpen(true)}
              className="w-full justify-start rounded-full bg-background/85 backdrop-blur-xl border border-primary/40 text-foreground hover:bg-background hover:border-primary shadow-[0_0_25px_rgba(0,255,255,0.18)] h-12 px-5"
            >
              <Wand2 className="w-4 h-4 mr-2 text-primary" />
              <span className="text-sm text-muted-foreground font-normal">
                Refine with magic — "make the hero red", "add a pricing table"…
              </span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="rounded-2xl bg-background/95 backdrop-blur-xl border border-primary/40 shadow-[0_8px_40px_rgba(0,255,255,0.18)] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Wand2 className="w-4 h-4 text-primary" />
                Magic Refine
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Describe a small change…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
                disabled={busy}
                className="bg-secondary/40 border-border/50 focus-visible:ring-primary/50"
              />
              <Button
                onClick={submit}
                disabled={!text.trim() || busy}
                size="icon"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {QUICK_REFINES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setText(q); }}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                  type="button"
                  disabled={busy}
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
