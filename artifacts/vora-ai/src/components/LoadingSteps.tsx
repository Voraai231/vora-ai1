import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Code2, Palette, Zap, CheckCircle2 } from "lucide-react";

const STEPS = [
  { id: "analyze",  label: "Analyzing your prompt",   icon: Brain },
  { id: "structure", label: "Structuring HTML",        icon: Code2 },
  { id: "style",    label: "Styling with Tailwind",   icon: Palette },
  { id: "optimize", label: "Optimizing assets",       icon: Zap },
];

interface Props {
  active: boolean;
  /** When true, the streaming engine has started returning HTML — fast-forward to the final step. */
  streaming: boolean;
}

export function LoadingSteps({ active, streaming }: Props) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIdx(0);
      return;
    }
    if (streaming) {
      setStepIdx(STEPS.length - 1);
      return;
    }
    // Walk through steps every 700ms while we're in the "thinking" phase.
    setStepIdx(0);
    const id = window.setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 2));
    }, 700);
    return () => window.clearInterval(id);
  }, [active, streaming]);

  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-primary/30 bg-background/85 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.18)] min-w-[260px]"
      >
        <div className="text-xs font-semibold tracking-wider uppercase text-primary">Vora AI is shipping</div>
        <ol className="space-y-2 w-full">
          {STEPS.map((s, i) => {
            const isDone = i < stepIdx || (streaming && i === STEPS.length - 1);
            const isActive = i === stepIdx && !isDone;
            const Icon = s.icon;
            return (
              <li
                key={s.id}
                className={`flex items-center gap-3 text-sm transition-colors ${
                  isActive ? "text-foreground" : isDone ? "text-primary" : "text-muted-foreground/50"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  isActive ? "border-primary bg-primary/15 animate-pulse" :
                  isDone   ? "border-primary/60 bg-primary/10" :
                             "border-border/40"
                }`}>
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </span>
                <span className="flex-1">{s.label}</span>
                {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </li>
            );
          })}
        </ol>
      </motion.div>
    </AnimatePresence>
  );
}
