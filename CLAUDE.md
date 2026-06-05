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

**Astro conventions:** Pages in `src/pages/` are file-based routes. Components go in `src/components/`. Static assets go in `public/`.

**Convex schema** (`convex/schema.ts`) must use strict TypeScript types via `v` from `convex/values`.

**Convex generated types** (`convex/_generated/api.d.ts`) must be manually updated when a new `convex/*.ts` module is added — add the import and entry in `ApiFromModules`. Running `bunx convex dev` regenerates this file automatically; editing it by hand avoids needing the dev server running during type-checking.

**`.devnotes/`** contains project strategy and agent specification documents (HTML). Do not delete these files. EVERYTIME you make changes to the project you MUST update and add to `.devnotes/project-setup.html`. This file is intended to handoff to a human or agentic developer and they should be able to recreate this template from scratch by only following it. DO NOT SKIP THIS STEP!

**Convex + Astro SSR pattern:** Use `src/lib/convex.ts` for server-side queries. `convex` (unauthenticated) for public reads; `getAuthedConvex(token)` for user-scoped mutations — get the token via `await Astro.locals.auth().getToken({ template: 'convex' })`. Never use a Convex browser client in SSR frontmatter.

**Admin page auth guard** — every admin page opens with this exact pattern:
```ts
const { userId } = Astro.locals.auth();
if (!userId) return Astro.redirect('/sign-in');
const token = await Astro.locals.auth().getToken({ template: 'convex' });
const client = getAuthedConvex(token);
const currentUser = await client.query(api.users.getByClerkId, { clerkId: userId });
if (!currentUser) return Astro.redirect('/onboarding');
if (currentUser.role !== 'admin') return Astro.redirect('/dashboard');
```

**Auth:** Clerk middleware (`src/middleware.ts`) protects `/admin/*` and `/dashboard/*`. Users are synced to Convex `users` table via the `users.createOrUpdate` mutation called from `/onboarding`. Role field (`"admin"` | `"user"`) is stored in Convex, not Clerk.

**Convex file storage upload pattern** — uploads run entirely server-side in SSR frontmatter, never from browser JS:
1. Call `client.mutation(api.gallery.generateUploadUrl, {})` to get a one-time upload URL
2. `fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': mimeType }, body: file })` — Convex returns `{ storageId }`
3. Call `client.mutation(api.gallery.create, { storageId, ... })` to save the record
4. To retrieve the URL later: `ctx.storage.getUrl(storageId)` inside any query or mutation

**Payments:** Stripe is wired via `@convex-dev/stripe` component. The HTTP webhook endpoint is registered in `convex/http.ts` at `/stripe/webhook`. Stripe billing data is queried through `users.adminGetBillingData` — it joins Convex users with Stripe subscriptions/payments/invoices via `tokenIdentifier`.

**PostHog scripts** must use `is:inline` — without it, Astro processes the script and throws TypeScript errors. Use `define:vars` to inject env vars.

**`src/lib/pages.ts`** exports `PAGE_CATALOG` — the single source of truth for the public page list (name, route, category, defaultStatus). Both `src/components/SitePages.astro` and `src/pages/admin/pages.astro` import from it. Do not duplicate this data.

## Completed Pages & Modules

**Public pages:** `/`, `/contact`, `/about`, `/services`, `/pricing`, `/privacy`, `/terms`, `/sign-in`, `/sign-up`, `/onboarding`, `/404`, `/reviews`, `/blog`, `/blog/[slug]`, `/gallery`

**Admin portal** (`/admin/*` — all Clerk-protected):
- `/admin/settings` — general, feature flags, notifications, design system, danger zone
- `/admin/pages` — page visibility control (active / planned / hidden) stored in `sitePages` table
- `/admin/users` — view accounts, assign roles
- `/admin/billing` — Stripe subscriptions, payments, invoices per user
- `/admin/contacts` — list submissions, mark read, delete, mailto reply
- `/admin/testimonials` — add, approve, feature, delete reviews; feeds `/reviews`
- `/admin/posts` — create, edit, publish, delete blog posts; feeds `/blog`, `/blog/[slug]`
- `/admin/gallery` — upload images/videos/PDFs to Convex storage; publish/unpublish; feeds `/gallery` and home page Gallery component
- `/admin/pricing` — create, edit, publish pricing tiers; highlight/unhighlight; feeds `/pricing`
- `/admin/funnels`, `/admin/shops`, `/admin/booking-links` — CRUD with slug auto-gen
- `/admin/communications` — Compose, Broadcast, Templates, History (Resend)

**Public marketing components** (`src/components/marketing/`): Header, Hero, TrustBar, Services, About, Reviews, Gallery, CTA, Footer — all prop-driven with defaults, assembled on `/`.

## Outstanding Work

**Priority 1 — dynamic entity public pages (Convex data already exists):**
- `/funnels/[slug]`, `/shops/[slug]`, `/booking-links/[slug]`

**sitePages per-page enforcement — still needed:**
- Helper (`src/lib/pageStatus.ts`) and Header/Footer filtering are done.
- Remaining: each public page calls `enforcePageStatus(route, Astro)` at the top of its frontmatter so `planned` routes return 404.

**Incomplete integrations:**

`sitePages` wiring — `/admin/pages` writes statuses but nothing reads them yet:
1. `src/lib/pageStatus.ts` — helper to fetch a route's status from Convex
2. `src/components/marketing/Header.astro` + `Footer.astro` — filter nav to `active` pages only
3. Each public page — call the helper: `active` → render, `hidden` → render but exclude from nav/sitemap, `planned` → 404

Contact confirmation email — no email sent to submitter after contact form submission:
- `sendUserConfirmation` internalAction in `convex/email.ts`, called from `contacts.create` via `ctx.scheduler`

SMS infrastructure (Twilio — not yet integrated):
- Env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- `convex/sms.ts` internalAction + `smsLogs` table in schema (mirrors `emailLogs` pattern)
- `appSettings` fields: `market`, `primaryService`, `defaultBookingLink`, `smsTemplate`
- Scheduled 5-min instant response from `contacts.create`; store `scheduledFunctionId` on contacts record for cancellation
- SMS copy sequences in `.devnotes/drc-lead-nurturing.md`, `.devnotes/drc-reactivation.md`, `.devnotes/drc-reviews-and-referrals.md`

**maintenanceMode** — wired. BaseLayout fetches `appSettings.maintenanceMode`; when true, renders a full-page overlay for all non-admin/non-auth routes. Toggle at `/admin/settings → Feature Flags`.

Booking webhook — required for SMS confirmation sequence and no-show win-back (Cal.com, Calendly, or native `/booking-links/[slug]`)

**Tabled — pending decision:**

Google reviews import — decide whether to build Outscraper bulk import flow on `/admin/testimonials` or move to another outstanding task. Outscraper (paid API key, no OAuth) preferred for agency use case; Google Business Profile API via Clerk OAuth is the alternative for owner-operated businesses.

**Missing assets/infrastructure:**
- `public/og-image.png` — referenced in BaseLayout but file doesn't exist
- `public/robots.txt` — not present
- Sitemap — `@astrojs/sitemap` not configured

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`bunx convex ai-files install`.

<!-- convex-ai-end -->
