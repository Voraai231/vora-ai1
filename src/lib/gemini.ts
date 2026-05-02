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

export function getNextKey(): string {
  const keys = getKeys();
  if (keys.length === 0) throw new Error("No Gemini API key configured. Add VITE_GEMINI_API_KEY to your secrets.");
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

export interface KeySlotInfo {
  slot: number;
  configured: boolean;
  active: boolean;
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
    })),
  };
}

// Rate limiter: 15 requests per 60 seconds per browser session
const RATE_KEY = "vora.rl";
const RATE_WINDOW = 60_000;
const RATE_MAX = 15;

interface Bucket { count: number; windowStart: number; }

function getBucket(): Bucket {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0, windowStart: Date.now() };
}

function saveBucket(b: Bucket) {
  localStorage.setItem(RATE_KEY, JSON.stringify(b));
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

export function createGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: getNextKey() });
}
