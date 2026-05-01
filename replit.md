# Vora AI

## Overview
Vora AI is an AI-powered website builder. Users speak or type a prompt, and Gemini 2.5 Flash generates a fully-rendered HTML website in real-time. Supports Firebase Auth, Firestore project storage, Razorpay payments, and a Content Studio with 4 AI tools.

## Stack
- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix UI)
- **AI**: Google Gemini 2.5 Flash (streaming) via `@google/genai`
- **Auth**: Firebase Auth (Google Sign-In)
- **Database**: Firestore (projects, billing, analytics)
- **Payments**: Razorpay (client-side checkout)
- **Animations**: Framer Motion
- **Router**: Wouter
- **Build**: Vite with manual chunk splitting

## Project Structure (flat, no monorepo)
```
src/
  pages/        Dashboard, Projects, Admin, ContentStudio, SharedProject
  components/   PricingModal, SaveProjectModal, ShareModal, SEOMaster, ...
  hooks/        useZipExport, useRazorpay, useTier, useSpeech, ...
  lib/          firebase, analytics, admin, projects
  contexts/     AuthContext
public/         favicon.svg, opengraph.jpg
index.html
package.json    scripts: dev, build, preview
vite.config.ts
vercel.json     SPA rewrites, pnpm build, dist/ output
```

## Routes
- `/` — Dashboard (main builder)
- `/projects` — My Projects
- `/p/:slug` — Shared public project
- `/admin` — Owner Admin Console
- `/studio` — AI Content Studio
- `/learn` — Learning Hub (SEO, YouTube Automation, Vora AI tips)

## Key Features
- **ZIP Export** — available to all users, produces index.html + README + vercel.json + package.json
- **Free Build Limit** — 3 free generations for starter tier (tracked in localStorage), then pricing modal
- **Mobile-first layout** — Compose/Preview tabs on mobile, no header overlap
- **Magic Wand** — AI auto-fix for UI bugs (Pro+)
- **SEO Master** — AI SEO analysis + fix (Pro+)
- **Razorpay** — Pro ₹749/mo, Billionaire ₹3,999/mo
- **AI Chat Bot** — Floating Gemini-powered assistant (bottom-right), helps with HTML/CSS, SEO, YouTube automation
- **Learning Hub** — `/learn` page with 7 tutorials covering SEO, YouTube Automation, Vora AI tips with real code examples
- **Admin Setup Guide** — `/admin` Setup tab has Firestore rules to copy-paste into Firebase Console

## Admin Dashboard Notes
- Root owner email: `saeedautomations295@gmail.com` (hardcoded in `src/hooks/useTier.ts`)
- If dashboard shows no data: Firestore security rules need updating (copy from Setup tab)
- `collectionGroup("projects")` query also needs a Firestore composite index on `updatedAt` (desc)

## Key Commands
- `pnpm run dev` — start dev server on port 5000 (changed from 5173)

## Environment Variables (all VITE_ prefix)
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_GEMINI_API_KEY`
- `VITE_RAZORPAY_KEY_ID`

## Key Commands
- `pnpm run dev` — start dev server on port 5173
- `pnpm run build` — production build to dist/
- `pnpm run preview` — preview production build

## Vercel Deployment
`vercel.json` at root configures: `pnpm run build`, output `dist/`, SPA rewrites.
Add all 8 VITE_ environment variables in Vercel dashboard before deploying.
