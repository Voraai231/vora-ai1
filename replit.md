# Vora AI

## Overview
Vora AI is a 4K Ultra-Premium AI-powered website builder. Users speak or type a prompt, and Gemini 2.5 Flash generates a fully SEO-optimised HTML website in real-time. Firebase Auth (Google + Email/Password), Firestore project storage, Razorpay payments, 6-key Gemini load balancer with 429-fallback rotation.

## Stack
- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS 4 + shadcn/ui — Neon Gold (#FFD700) + Matte Black (#080808) theme
- **AI**: Google Gemini 2.5 Flash (streaming) via `@google/genai`, 6-key rotation with 429 fallback
- **Auth**: Firebase Auth (Google Sign-In + Email/Password)
- **Database**: Firestore (projects with SEO data, sitemap, robots.txt, billing, analytics)
- **Payments**: Razorpay (client-side checkout)
- **Animations**: Framer Motion, Code Rain canvas, Breathing Glow, Laser Hover, Materialize
- **Router**: Wouter
- **Build**: Vite with manual chunk splitting

## Project Structure
```
src/
  pages/        Dashboard (factory), AuthPage, Projects, Admin, ContentStudio, SharedProject, Learn
  components/   PricingModal, SaveProjectModal, ShareModal, SEOMaster, AIChatBot, ...
  hooks/        useZipExport, useRazorpay, useTier, useSpeech, ...
  lib/          firebase, analytics, admin, projects, gemini (6-key+rate-limiter)
  contexts/     AuthContext (Google + email/password), ThemeContext
public/         favicon.svg, opengraph.jpg
index.html
package.json    scripts: dev, build, preview
vite.config.ts
vercel.json     SPA rewrites, pnpm build, dist/ output
```

## Routes
- `/` — Dashboard (Factory Interface: side-by-side Code + Preview)
- `/auth` — Premium Login/Register page (Google + Email/Password, Code Rain bg)
- `/projects` — My Projects (with SEO metadata, sitemap/robots badges)
- `/p/:slug` — Shared public project
- `/admin` — Owner Admin Console
- `/studio` — AI Content Studio
- `/learn` — Learning Hub

## Gemini 6-Key Load Balancer (src/lib/gemini.ts)
- Keys: VITE_GEMINI_API_KEY through VITE_GEMINI_API_KEY_6 (all 6 configured)
- Rotation: round-robin + automatic 429-fallback (switches key on quota exceeded)
- Rate limit: 2 builds/min per browser session (localStorage bucket)
- Health tracking: per-key status (ok / limited / error)
- `getSystemHealth()` → GREEN / YELLOW / RED for System Health Badge
- `streamWithFallback()` → async generator, yields chunks, handles retries

## Factory Interface (Dashboard.tsx)
- **Header**: Logo (breathing glow) + GREEN/YELLOW/RED health badge + massive prompt bar + Ship it (laser hover) + toolbar + user menu
- **Body (desktop)**: Left = Live Code panel (50%) | Right = Live Preview iframe (50%)
- **Code panel**: always visible, streaming, shows sitemap/robots badges when generated
- **Thinking overlay**: Code Rain canvas (gold/white Matrix characters) over preview
- **Status bar**: Ready/Streaming indicator + 6-slot key monitor + sitemap/robots + save status
- **Mobile**: tabs — Compose | Code | Preview

## Data Saved Per Build (Firestore: users/{uid}/projects/{id})
- `html` — full generated HTML
- `prompt` — user prompt
- `title` — auto-extracted or user-set
- `sitemap` — auto-generated sitemap.xml content
- `robotsTxt` — auto-generated robots.txt content
- `seoKeywords` — extracted from meta keywords tag
- `seoDescription` — extracted from meta description tag
- `createdAt` / `updatedAt` — Firestore timestamps
- `sharedSlug` — public share URL slug (optional)

## Auto-SEO in Every Build
Every generated HTML page automatically includes:
- `<meta name="description">` (150-160 chars)
- `<meta name="keywords">` (6-10 terms)
- `<link rel="canonical">`
- Open Graph tags (og:title, og:description, og:image, og:url)
- Twitter Card tags
- Schema.org JSON-LD (WebPage + Organization)
- Auto-generated sitemap.xml saved with project
- Auto-generated robots.txt saved with project

## Key Features
- **ZIP Export** — all users, produces index.html + README + vercel.json + package.json
- **Free Build Limit** — 3 free generations for starter tier, then pricing modal
- **Magic Wand** — AI auto-fix for UI bugs (Pro+)
- **SEO Master** — AI SEO analysis + fix sidebar (Pro+)
- **Razorpay** — Pro ₹749/mo, Billionaire ₹3,999/mo
- **AI Chat Bot** — Floating Gemini-powered assistant
- **Learning Hub** — 7 tutorials (SEO, YouTube Automation, Vora AI tips)

## Owner
- Root owner email: saeedautomations295@gmail.com
- Auto-claimed on sign-in via useTier.ts ROOT_OWNER_EMAIL
- Full access: Admin Console at /admin

## Environment Secrets Required
- VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
- VITE_GEMINI_API_KEY (key 1 — system key)
- VITE_GEMINI_API_KEY_2 through VITE_GEMINI_API_KEY_6 (rotation keys — all configured)
- VITE_RAZORPAY_KEY_ID

## Firestore Security
- Currently: `allow read, write: if true` (open for dev — owner confirmed)
- Recommended for prod: auth-gated rules (see /admin Setup tab)
