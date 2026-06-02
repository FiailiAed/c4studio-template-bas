# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bun dev          # Start dev server at localhost:4321
bun build        # Build production site to ./dist/
bun preview      # Preview production build locally
bun astro check  # Type-check .astro files
bunx convex dev  # Start Convex dev server (run alongside bun dev)
```

## Stack (Non-Negotiable)

Do not deviate from or suggest alternatives to these technologies:

| Layer | Technology |
|---|---|
| Runtime | Bun — always use `bun`, never `npm`/`npx`/`yarn` |
| Framework | Astro with SSR enabled |
| Deployment | Vercel (edge route handlers, Speed Insights, Web Analytics) |
| Database | Convex (`convex/schema.ts` — real-time, typesafe) |
| Auth | Clerk via `@clerk/astro` |
| Styling | TailwindCSS |
| Email | Resend |
| Payments | Stripe via `@convex-dev/stripe` |
| Analytics | PostHog |
| Frontend interactivity | TypeScript only — state lives in the DOM. **No React or other UI libraries.** |

## Architecture

This is the **c4studio B.A.S.** (Basic/Bad Ass Astro Setup) template — the canonical starting point for all c4studio projects.

**Path aliases** (all configured in `tsconfig.json` — add a new alias whenever you create a new `src/` subdirectory):

```
@layouts/*    → src/layouts/*
@components/* → src/components/*
@marketing/*  → src/components/marketing/*
@lib/*        → src/lib/*
@pages/*      → src/pages/*
@styles/*     → src/styles/*
@convex/*     → convex/_generated/*
```

**Astro conventions:** Pages in `src/pages/` are file-based routes. Components go in `src/components/`. Static assets go in `public/`. `src/` directory will be added upon.

**Convex schema** (`convex/schema.ts`) must use strict TypeScript types via `v` from `convex/values`.

**`.devnotes/`** contains project strategy and agent specification documents (HTML). Do not delete these files. EVERYTIME you make changes to the project you MUST update and add to `.devnotes/project-setup.html`. This file will be used as a running log of how the template project (this project) was setup. This file is intended to handoff to a human or agentic developer and they should be able to recreate this template from scratch by only following the `.devnotes/project-setup.html` file. DO NOT SKIP THIS STEP!

**`src/components/TechStack.astro`** maintains the visual stack status grid shown on the index page. EVERYTIME a stack technology is installed/configured, update that technology's `status` field from `'pending'` to `'installed'`. Keep this in sync with `.devnotes/project-setup.html`. DO NOT SKIP THIS STEP!

**Convex + Astro SSR pattern:** Use `src/lib/convex.ts` for server-side queries. `convex` (unauthenticated) for public reads; `getAuthedConvex(token)` for user-scoped mutations — get the token via `await Astro.locals.auth().getToken({ template: 'convex' })`. Never use a Convex browser client in SSR frontmatter.

**Auth:** Clerk middleware (`src/middleware.ts`) protects `/admin/*` and `/dashboard/*`. Users are synced to Convex `users` table via the `users.createOrUpdate` mutation called from `/onboarding`. Role field (`"admin"` | `"user"`) is stored in Convex, not Clerk.

**Payments:** Stripe is wired via `@convex-dev/stripe` component. The HTTP webhook endpoint is registered in `convex/http.ts` at `/stripe/webhook`. Stripe billing data is queried through `users.adminGetBillingData` — it joins Convex users with Stripe subscriptions/payments/invoices via `tokenIdentifier`.

## Completed Pages & Modules

**Admin portal** (`/admin/*` — all Clerk-protected):
- `/admin/settings` — general, feature flags, notifications, design system, danger zone
- `/admin/pages` — page visibility control (active / planned / hidden) stored in `sitePages` table
- `/admin/users` — view accounts, assign roles
- `/admin/billing` — Stripe subscriptions, payments, invoices per user
- `/admin/funnels`, `/admin/shops`, `/admin/booking-links` — CRUD with slug auto-gen
- `/admin/communications` — Compose, Broadcast, Templates, History (Resend)

**Public marketing components** (`src/components/marketing/`): Header, Hero, TrustBar, Services, About, Reviews, Gallery, CTA, Footer — all prop-driven with defaults, assembled on `/`.

## Outstanding Work (from README)

**Priority 1 — no dependencies:**
- `/contact` — contact form → Convex `contacts` table
- `/about`, `/services` — static pages
- `/admin/contacts` — view submissions, mark read

**Priority 2 — requires admin module first:**
- `/admin/testimonials` → `/reviews`
- `/admin/posts` → `/blog`, `/blog/[slug]`
- `/admin/gallery` → `/gallery`

**Priority 3 — dynamic entity pages (Convex data already exists):**
- `/funnels/[slug]`, `/shops/[slug]`, `/booking-links/[slug]`

**Incomplete integration — `sitePages` wiring:**
The `/admin/pages` module writes `sitePages` records but they are not yet consumed by the public site. To complete the integration:
1. `src/lib/pageStatus.ts` — helper to fetch a route's status from Convex
2. `src/components/marketing/Header.astro` + `Footer.astro` — filter nav to `active` pages only
3. Each public page — call the helper: `active` → render, `hidden` → render but exclude from nav/sitemap, `planned` → 404

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`bunx convex ai-files install`.

<!-- convex-ai-end -->
