# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Vora AI artifact (`artifacts/vora-ai`)

Frontend-only Vite + React app. Generates websites from a prompt using Google Gemini.

### Optional secrets (everything else degrades gracefully)
- `VITE_GEMINI_API_KEY` (required for generation)
- `VITE_FIREBASE_*` — auth, Firestore project storage, owner console
- `VITE_OWNER_UID` — hard-locks the admin console to a single super-admin UID
- `VITE_OWNER_EMAILS` — extra owner emails (csv); `saeedautomations295@gmail.com` is hardcoded
- `VITE_LEMON_PRO_URL`, `VITE_LEMON_LIFETIME_URL` — LemonSqueezy hosted-checkout URLs
- `VITE_LEMON_PRO_VARIANT_IDS`, `VITE_LEMON_LIFETIME_VARIANT_IDS` — csv of variant IDs that grant Pro/Lifetime when a license is validated

### Tier system (internal name ↔ user-facing label)
- `starter` ↔ Free (max 2 saved sites, single-file HTML download only)
- `pro` ↔ Pro ($12/mo) — unlimited sites, ZIP, Magic Wand, SEO, Promote
- `billionaire` ↔ Lifetime ($99 once) — Pro plus Vercel/Netlify deploy

### Routes
`/`, `/projects`, `/p/:slug`, `/admin`, `/privacy`, `/terms`, `/upgrade-success`
