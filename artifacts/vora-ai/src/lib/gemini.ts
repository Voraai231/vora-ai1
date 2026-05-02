import { GoogleGenAI } from "@google/genai";

function getKeys(): string[] {
  const slots = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
    import.meta.env.VITE_GEMINI_API_KEY_4,
    import.meta.env.VITE_GEMINI_API_KEY_5,
    import.meta.env.VITE_GEMINI_API_KEY_6,
  ];
  return slots.filter(Boolean) as string[];
}

let currentKeyIndex = 0;

// Track per-key health: "ok" | "limited" | "error"
const keyHealth: Record<number, "ok" | "limited" | "error"> = {};

export interface KeySlotInfo {
  slot: number;
  configured: boolean;
  active: boolean;
  health: "ok" | "limited" | "error" | "unconfigured";
}

export function getKeyMonitorInfo(): { total: number; configured: number; activeSlot: number; slots: KeySlotInfo[] } {
  const keys = getKeys();
  const activeSlot = keys.length > 0 ? currentKeyIndex % keys.length : 0;
  return {
    total: 6,
    configured: keys.length,
    activeSlot,
    slots: Array.from({ length: 6 }, (_, i) => ({
      slot: i + 1,
      configured: i < keys.length,
      active: i === activeSlot && keys.length > 0,
      health: i >= keys.length ? "unconfigured" : (keyHealth[i] ?? "ok"),
    })),
  };
}

export function getSystemHealth(): { status: "GREEN" | "YELLOW" | "RED"; configured: number; healthy: number; limited: number } {
  const keys = getKeys();
  if (keys.length === 0) return { status: "RED", configured: 0, healthy: 0, limited: 0 };
  const limited = keys.filter((_, i) => keyHealth[i] === "limited" || keyHealth[i] === "error").length;
  const healthy = keys.length - limited;
  const status: "GREEN" | "YELLOW" | "RED" = limited === 0 ? "GREEN" : healthy > 0 ? "YELLOW" : "RED";
  return { status, configured: keys.length, healthy, limited };
}

// Rate limiter: 2 requests per 60 seconds per browser session
const RATE_KEY = "vora.rl";
const RATE_WINDOW = 60_000;
const RATE_MAX = 2;

interface Bucket { count: number; windowStart: number; }

function getBucket(): Bucket {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0, windowStart: Date.now() };
}

function saveBucket(b: Bucket) {
  try { localStorage.setItem(RATE_KEY, JSON.stringify(b)); } catch {}
}

export function checkRateLimit(): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  let b = getBucket();
  if (now - b.windowStart > RATE_WINDOW) b = { count: 0, windowStart: now };
  const remaining = Math.max(0, RATE_MAX - b.count);
  const resetInSec = Math.ceil(Math.max(0, RATE_WINDOW - (now - b.windowStart)) / 1000);
  return { allowed: b.count < RATE_MAX, remaining, resetInSec };
}

export function consumeRateSlot(): void {
  const now = Date.now();
  let b = getBucket();
  if (now - b.windowStart > RATE_WINDOW) b = { count: 1, windowStart: now };
  else b.count += 1;
  saveBucket(b);
}

function is429(err: any): boolean {
  return (
    err?.status === 429 ||
    err?.code === 429 ||
    String(err?.message || "").includes("429") ||
    String(err?.message || "").toLowerCase().includes("quota") ||
    String(err?.message || "").toLowerCase().includes("rate limit")
  );
}

// 429-fallback streaming generator — rotates keys on quota exhaustion
export async function* streamWithFallback(
  prompt: string,
  systemInstruction: string,
  onKeySwitch?: (slot: number) => void
): AsyncGenerator<string> {
  const keys = getKeys();
  if (keys.length === 0) throw new Error("No Gemini API key configured. Add VITE_GEMINI_API_KEY to your secrets.");

  const tried = new Set<number>();
  let idx = currentKeyIndex % keys.length;

  while (tried.size < keys.length) {
    if (tried.has(idx)) {
      idx = (idx + 1) % keys.length;
      continue;
    }
    tried.add(idx);

    try {
      const ai = new GoogleGenAI({ apiKey: keys[idx] });
      currentKeyIndex = idx;
      keyHealth[idx] = "ok";
      onKeySwitch?.(idx);

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { systemInstruction, temperature: 0.7, responseMimeType: "text/plain" },
      });

      for await (const chunk of responseStream) {
        yield chunk.text ?? "";
      }

      // Success — advance for next call
      currentKeyIndex = (idx + 1) % keys.length;
      return;

    } catch (err: any) {
      if (is429(err)) {
        keyHealth[idx] = "limited";
        idx = (idx + 1) % keys.length;
        onKeySwitch?.(idx < keys.length ? idx : 0);
        continue;
      }
      keyHealth[idx] = "error";
      throw err;
    }
  }

  throw new Error("All Gemini API keys are rate-limited. Please wait a minute and try again.");
}

// Legacy helper kept for any callers
export function createGeminiClient(): GoogleGenAI {
  const keys = getKeys();
  if (keys.length === 0) throw new Error("No Gemini API key configured.");
  return new GoogleGenAI({ apiKey: keys[currentKeyIndex % keys.length] });
}
