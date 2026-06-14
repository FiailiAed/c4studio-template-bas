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

## Environment Variables

**Vercel / Astro** (`.env.local`):

| Variable | Purpose |
|---|---|
| `CONVEX_URL` | Convex deployment URL (from Convex dashboard) |
| `CONVEX_SITE_URL` | Convex HTTP actions base URL (used in tokenized email links) |
| `CANCEL_SECRET` | HMAC secret for tokenized action links — **must match the Convex env var of the same name** |
| `PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog project token (client-side) |
| `PUBLIC_POSTHOG_HOST` | PostHog host (client-side, e.g. `https://us.i.posthog.com`) |
| `POSTHOG_PROJECT_TOKEN` | PostHog project token (server-side SSR capture) |
| `POSTHOG_HOST` | PostHog host (server-side) |

**Convex** (set via `bunx convex env set KEY VALUE` or dashboard):

| Variable | Purpose |
|---|---|
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer domain for `convex/auth.config.ts` |
| `RESEND_API_KEY` | Resend API key for all outbound email (agents + admin communications) |
| `RESEND_FROM_EMAIL` | Sender address used by Resend (e.g. `hello@yourdomain.com`) |
| `CANCEL_SECRET` | HMAC secret — **must match the Vercel env var** |

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
| Frontend interactivity | TypeScript only — state lives in the DOM. **No React or other UI libraries.** Svelte is used for complex interactive islands (booking widget). |

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

**Svelte island pattern** — use Svelte only for genuinely complex interactive widgets (multi-step flows, real-time state). Everything else stays vanilla TypeScript.
- `client:load` — SSR + client hydration. Pass all server-resolved data as props; never fetch Convex inside the component. Example: `<BookingWidget client:load bookingLinkId={...} />`
- `client:only="svelte"` — skip SSR entirely; renders only in the browser. Use when the component needs a live Convex browser subscription (`ConvexClient`). Example: `<DevTaskBoard client:only="svelte" staticTasks={TASKS} convexUrl={convexUrl} />`. This is the only case where initializing a `ConvexClient` directly inside a Svelte component is acceptable.
- Server data injection in Astro scripts: use `define:vars={{ data }}` for simple values; embed JSON in `<script type="application/json">` for large payloads

**Convex file storage upload pattern** — uploads run entirely server-side in SSR frontmatter, never from browser JS:
1. Call `client.mutation(api.gallery.generateUploadUrl, {})` to get a one-time upload URL
2. `fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': mimeType }, body: file })` — Convex returns `{ storageId }`
3. Call `client.mutation(api.gallery.create, { storageId, ... })` to save the record
4. To retrieve the URL later: `ctx.storage.getUrl(storageId)` inside any query or mutation

**Payments:** Stripe is wired via `@convex-dev/stripe` component. The HTTP webhook endpoint is registered in `convex/http.ts` at `/stripe/webhook`. Stripe billing data is queried through `users.adminGetBillingData` — it joins Convex users with Stripe subscriptions/payments/invoices via `tokenIdentifier`. Shop checkout requires Clerk auth; calls `payments.createPaymentCheckout` action via authed `ConvexHttpClient` in `src/pages/api/shop-checkout.ts`.

**PostHog scripts** must use `is:inline` — without it, Astro processes the script and throws TypeScript errors. Use `define:vars` to inject env vars.

**`src/lib/pages.ts`** exports `PAGE_CATALOG` — the single source of truth for the public page list (name, route, category, defaultStatus). Both `src/components/SitePages.astro` and `src/pages/admin/pages.astro` import from it. Do not duplicate this data.

**sitePages enforcement** — every public page in `PAGE_CATALOG` must call `enforcePageStatus(route, Astro)` at the top of its SSR frontmatter (after imports, before data fetching). Returns a redirect to `/404` if status is `planned`; returns `null` if `active` or `hidden`. Slug pages (e.g. `/blog/[slug]`) enforce their parent catalog route (e.g. `/blog`).

**Agent module pattern** — the three live agent sequences (3, 4, 5) each follow this split:
- `convex/[agent].ts` — queries, public mutations, `internalMutation` for log writes, `internalQuery` helpers for DB access
- `convex/[agent]Actions.ts` — `"use node"` file, only `internalAction` exports, calls `ctx.runQuery(internal.[agent].*)` for DB access, sends email via Resend, stubs SMS
- `src/pages/admin/agents/[N].astro` — dedicated page overriding the generic `[id].astro`; tabs: Messages (CRUD), History (stats + timeline), Prompt (assembly tool)
- **Do NOT mix queries/mutations with actions in the same file when `"use node"` is present**

**Variable substitution in agent messages** — templates use `{{VAR_KEY}}` double-curly syntax. At send time, the action resolves values from `appSettings` + the contact/booking record and calls `substitute(template, vars)`. The admin UI displays these as editable fields in each message card. System output placeholders like `[BOOKING_LINK]` use single brackets and pass through untouched to the final message.

**Admin agent page routing** — Astro's file-based routing means `src/pages/admin/agents/3.astro` takes precedence over `src/pages/admin/agents/[id].astro` for `/admin/agents/3`. Use named files (3.astro, 4.astro, 5.astro) for agents that have live pipelines; use [id].astro for prompt-only agents.

## Completed Pages & Modules

> **`README.md` is the canonical `[x]/[ ]` checklist.** This section is a quick reference — not authoritative.

**Public pages:** `/`, `/about`, `/services`, `/pricing`, `/reviews`, `/blog`, `/blog/[slug]`, `/gallery`, `/contact`, `/funnels`, `/funnels/[slug]`, `/shops`, `/shops/[slug]`, `/booking-links`, `/booking-links/[slug]`, `/bookings/cancel`, `/reactivation/responded`, `/reviews/rated`, `/unsubscribed`, `/raffle/entered`, `/sign-in`, `/sign-up`, `/onboarding`, `/privacy`, `/terms`, `/changelog`, `/roadmap`, `/404`, `/500`

**Admin portal** (`/admin/*` — all Clerk-protected):
- `/admin/settings` — general, feature flags, notifications, design system (color picker fixed), danger zone
- `/admin/pages` — page visibility control (active / planned / hidden)
- `/admin/users`, `/admin/billing` — user management, Stripe billing + Products tab (CRUD via Stripe API)
- `/admin/contacts` — list submissions with link to detail view
- `/admin/contacts/[id]` — per-contact detail: full message, read/unread toggle, delete, mailto reply, Agent 5 nurturing log
- `/admin/testimonials`, `/admin/posts`, `/admin/gallery`, `/admin/pricing` — content management
- `/admin/funnels`, `/admin/shops`, `/admin/booking-links` — CRUD with slug auto-gen + content fields
- `/admin/bookings` — view all bookings across all booking links; cancel/status management
- `/admin/raffles` — raffle list + create; `/admin/raffles/[id]` — edit, close, draw winner, entrant list
- `/admin/communications` — Compose, Broadcast, Templates, History (Resend)
- `/admin/agents` — hub page; live stats for agents 3/4/5; links to all 7 agents
- `/admin/agents/[id]` — generic prompt assembly tool (agents 1, 2, 6, 7)
- `/admin/agents/3` — Reactivation Campaign: manual trigger + message CRUD + history
- `/admin/agents/4` — Reviews & Referrals: automated messages + R5 copy templates + manual triggers
- `/admin/agents/5` — Lead Nurturing: 7 auto-triggered messages + history

**Public marketing components** (`src/components/marketing/`): Header, Hero, TrustBar, Services, About, Reviews, Gallery, CTA, Footer — all prop-driven with defaults, assembled on `/`.

**Svelte components** (`src/components/`): `BookingWidget.svelte` — 4-step booking island (calendar → slots → form → confirmation).

**Static data** (`src/lib/`): `agents.ts` exports `AGENTS` array (7 agents with prompts + variables); `pages.ts` exports `PAGE_CATALOG`; `devTasks.ts` exports `TASKS` — the in-code dev task registry used by `/admin/dev`.

**Dev task tracker** — `/admin/dev` uses a hybrid model: static tasks from `src/lib/devTasks.ts` (`TASKS` array + `STATUS_META`, `PRIORITY_META`, `CATEGORY_LABELS`) are merged at runtime with DB-persisted tasks from `convex/devTasks.ts` (CRUD: `list`, `create`, `update`, `updateStatus`, `remove`). The page mounts `DevTaskBoard.svelte` with `client:only="svelte"`, which initialises a `ConvexClient` browser subscription to `api.devTasks.list` for live updates. Static tasks have `source: 'static'`; DB tasks have `source: 'db'` with a `_convexId`. Add new static tasks to `src/lib/devTasks.ts`; create ad-hoc tasks via the board UI (stored in Convex).

## Feature Flags (`appSettings` in Convex)

| Flag | Status | Notes |
|---|---|---|
| `maintenanceMode` | Wired | BaseLayout shows full-page overlay for all non-admin/non-auth routes |
| `registrationEnabled` | Wired | `/sign-up` redirects to `/` when false |
| `blogEnabled` | Wired | `/blog` + `/blog/[slug]` redirect to `/404` when false; `getPageStatusMap` treats `/blog` as `planned` → drops from Header nav |

Toggle all flags at `/admin/settings → Feature Flags`.

## appSettings Agent Infrastructure Fields

These fields must be set for the agent email sequences to resolve variables correctly. Configure at `/admin/settings → General` (UI fields still need to be added — currently set directly in Convex dashboard).

| Field | Used by | Injected as |
|---|---|---|
| `primaryService` | Agent 5 M1–M3 | `{{SERVICE}}` fallback when contact has no subject |
| `defaultBookingLink` | Agents 3, 5 | `{{BOOKING_LINK}}`, `{{REBOOKING_LINK}}` |
| `rafflePrize` | Agents 3, 4 | `{{RAFFLE_PRIZE}}` |
| `raffleLink` | Agent 3 | `{{RAFFLE_LINK}}` |
| `feedbackFormLink` | Agent 4 R3 | `{{FEEDBACK_FORM_LINK}}` |
| `referralShareLink` | Agent 4 R4 | `{{REFERRAL_SHARE_LINK}}` |
| `referralIntroOffer` | Agent 4 R4 | `{{REFERRAL_INTRO_OFFER}}` |
| `googleReviewUrl` | Agent 4 R2 | `{{GOOGLE_REVIEW_LINK}}` |

## Tokenized Email Action Links

`src/lib/tokens.ts` exports `signToken(payload)` and `verifyToken(payload, token)` — HMAC-SHA256 signing used to authenticate one-click action links embedded in agent emails. The secret is `CANCEL_SECRET`, which **must be set identically in both Vercel env vars and Convex env vars**.

Token payload conventions:
- Booking cancellation: `cancel:${bookingId}`
- Reactivation YES/NO: `reac:${contactId}:yes` / `reac:${contactId}:no`
- Review rating: `review:${bookingId}:${rating}`
- Email unsubscribe: `unsub:${contactId}`
- Raffle entry: `raffle:${raffleId}:${contactId}`

Routes using this pattern:
- `GET /api/reactivation/respond?contactId=&token=&r=yes|no` — processes Agent 3 email YES/NO response; triggers the appropriate handler message
- `GET /api/reviews/rate?bookingId=&token=&rating=1-5` — processes Agent 4 R2/R3 rating; routes to R3 or R4 based on score
- `GET /api/unsubscribe?contactId=&token=` — calls `contacts.optOut`; redirects to `/unsubscribed`
- `GET /api/raffle/enter?raffleId=&contactId=&token=` — calls `raffles.enterRaffle`; redirects to `/raffle/entered`
- `/bookings/cancel?bookingId=&token=` — public page where customers confirm booking cancellation
- `/reactivation/responded` — confirmation landing after reactivation response
- `/reviews/rated` — confirmation landing after review rating
- `/unsubscribed` — confirmation landing after email unsubscribe

## API Routes

```
GET  /api/booking-slots          — Available time slots for a date (filters conflicts)
POST /api/bookings               — Create booking; double-booking conflict check
POST /api/shop-checkout          — Stripe checkout redirect (requires Clerk auth)
GET  /api/reactivation/respond   — Agent 3 YES/NO handler (tokenized)
GET  /api/reviews/rate           — Agent 4 rating handler (tokenized)
GET  /api/unsubscribe            — Email opt-out handler (tokenized); calls contacts.optOut
GET  /api/raffle/enter           — Tokenized raffle entry; calls raffles.enterRaffle
POST /api/agents/test-send       — Admin-only: trigger a single agent message to a test email
                                   Body: { agent, messageKey, testEmail, contactId?, bookingId? }
```

## Contact Form

Rate limiting is implemented — email-based, 5-minute window using the `by_email` index on the `contacts` table. `RATE_LIMITED` error is surfaced with a user-friendly message on `/contact`.

## Outstanding Work

> **`README.md` is the canonical `[x]/[ ]` checklist.** Update it (and `.devnotes/project-setup.html`) whenever a task is completed — do not maintain a parallel list here.

**SMS delivery (Twilio — not yet integrated):**
- Email channel is fully wired across all three agent sequences (Agents 3, 4, 5)
- SMS stubs exist in each `*Actions.ts` — they log the attempt as `skipped` with reason "SMS not configured"
- To activate: add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` to Convex env vars; replace the no-op blocks in `nurturingActions.ts`, `reactivationActions.ts`, `reviewActions.ts`
- Twilio inbound SMS webhook also needed for YES/NO handlers (Agent 3) and R2/R3 rating routing (Agent 4) — add endpoint in `convex/http.ts`

**appSettings agent fields UI** — the 7 agent infrastructure fields (see table above) are defined in schema and settings.ts but have no input fields in `/admin/settings` yet. Admin must set them directly in the Convex dashboard until the settings UI is updated.

**LLM connection for agents** — planned v2. Each agent page will become a live chat interface with Claude. Currently prompt assembly + copy only. The amber "Coming soon" banner on each agent page notes this.

**Tabled — pending decision:**
- Google reviews import — Outscraper (paid, no OAuth) vs Google Business Profile API via Clerk OAuth. Decision needed before implementation.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`bunx convex ai-files install`.

<!-- convex-ai-end -->
