# Vora AI

## Overview
Vora AI is a PWA AI-powered website builder. Users speak or type a prompt, Gemini 2.5 Flash streams a fully SEO-optimised HTML website in real-time. Firebase Auth, Firestore project storage, Binance Pay (USDT) + Razorpay (INR), 6-key Gemini load balancer, legal pages, and strict pro-tier feature gating.

## Stack
- **Framework**: React 19 + Vite 7 (PWA via vite-plugin-pwa)
- **Styling**: Tailwind CSS 4 + shadcn/ui — Midnight Black (#050505) + Silver (#E5E4E2) + Ice Blue (#00E5FF)
- **AI**: Google Gemini 2.5 Flash (streaming) via `@google/genai`, 6-key rotation with 429 fallback
- **Auth**: Firebase Auth (Google Sign-In + Email/Password)
- **Database**: Firestore (projects, billing, `payment_requests` collection for Binance)
- **Payments**: Binance Pay USDT ($19/mo, $49 lifetime) + Razorpay INR (₹749/mo, ₹3,999)
- **Animations**: Framer Motion, Code Rain canvas, Breathing Glow, Laser Hover, Materialize
- **Router**: Wouter

## Project Structure
```
src/
  pages/        Dashboard, LandingPage, HomePage, AuthPage, Projects, Admin,
                ContentStudio, SharedProject, Learn,
                PricingPage, TermsPage, PrivacyPage, RefundPage
  components/   BinancePayModal, PricingModal, SaveProjectModal, ShareModal,
                SEOMaster, AIChatBot, VoraIcon, ...
  hooks/        useZipExport, useRazorpay, useTier, useSpeech, ...
  lib/          firebase, analytics, admin, projects, payments, gemini (6-key+rate-limiter)
  contexts/     AuthContext, ThemeContext
public/         favicon.svg, manifest.json, icons/, opengraph.jpg
```

## Routes
- `/` — Landing page (PWA install, hero, features, footer with legal links)
- `/home` — HomePage
- `/build` — Dashboard (Factory: floating prompt bar, live preview, code panel)
- `/auth` — Login/Register (Google + Email/Password)
- `/projects` — My Projects
- `/p/:slug` — Shared public project
- `/admin` — Owner Admin Console
- `/studio` — AI Content Studio
- `/learn` — Learning Hub
- `/pricing` — Pricing page ($0 / $19/mo / $49 lifetime, Binance Pay)
- `/terms` — Terms of Service (13 sections)
- `/privacy` — Privacy Policy (11 sections, GDPR + Indian IT Act)
- `/refund` — Refund Policy (eligible/ineligible cases, contact info)

## Binance Pay Flow (src/components/BinancePayModal.tsx)
- Step 1: Plan select (Pro $19/mo or Pro Lifetime $49)
- Step 2: Show Binance Pay ID + QR code + TXID input
- Step 3: Submit → `payment_requests` Firestore collection → success screen
- Success message: "Transaction received! We are verifying your crypto payment. Access will be granted shortly."
- **Replace `YOUR_BINANCE_PAY_ID_HERE`** in BinancePayModal.tsx with actual Pay ID

## Pro Feature Gating (Dashboard.tsx)
- Starters hitting build limit → BinancePayModal (was PricingModal)
- ZIP Export → locked for starter tier → BinancePayModal on click
- Magic Wand, SEO Master, Vercel Deploy → locked for starter → BinancePayModal
- Lock icon overlaid on toolbar buttons for locked features
- User menu "Plan: STARTER · Upgrade" → opens BinancePayModal

## 6-Key Engine Branding
- Header shows: health dot (GREEN/YELLOW/RED) + `6-KEY ENGINE` chip (ice blue)
- Key slots visualised in floating prompt bar (6 bars, active = glowing)

## Gemini 6-Key Load Balancer (src/lib/gemini.ts)
- Keys: VITE_GEMINI_API_KEY through VITE_GEMINI_API_KEY_6
- Rotation: round-robin + 429-fallback; rate limit: 2 builds/min per session

## Firestore Collections
- `users/{uid}/projects/{id}` — project data (html, prompt, seo, sitemap, robotsTxt)
- `users/{uid}/billing/current` — tier (starter/pro/billionaire)
- `payment_requests/{id}` — uid, email, txid, plan, amount, status (pending/approved/rejected)

## Owner
- Root owner: saeedautomations295@gmail.com → always billionaire tier
- Admin Console at /admin

## Environment Secrets Required
- VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
- VITE_GEMINI_API_KEY through VITE_GEMINI_API_KEY_6
- VITE_RAZORPAY_KEY_ID

## Gotchas
- Replace `YOUR_BINANCE_PAY_ID_HERE` in `src/components/BinancePayModal.tsx` before going live
- Firestore rules currently open (`allow read, write: if true`) — tighten before prod
- PricingModal uses `onOpenChange` prop (not `onClose`) — corrected in Dashboard
- PWA install prompts only fire on HTTPS (works after deployment, not on localhost)
