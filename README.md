# c4studio B.A.S. — Basic/Bad Ass Astro Setup

## Stack

```sh
[x] Runtime:              Bun
[x] Framework:            Astro (SSR enabled) + @astrojs/vercel adapter
[x] Deployment:           Vercel — Web Analytics via @vercel/analytics
[x] Database & Backend:   Convex v1.39.1 — schema, HTTP client, path aliases
[x] Authentication:       Clerk v3.3.2 via @clerk/astro — middleware, JWT auth
[x] Styling:              TailwindCSS v4 via Vite plugin
[x] Emails:               Resend v6.12.4 — transactional + admin Communications module
[x] Payments:             Stripe v0.1.4 via @convex-dev/stripe — webhooks, billing page
[x] Analytics:            PostHog — client snippet (every page) + server-side capture
[x] Frontend interactivity: TypeScript only (state in DOM). Svelte islands for complex widgets.
```

## Commands

```sh
bun dev          # Start dev server at localhost:4321
bun build        # Build production site to ./dist/
bun preview      # Preview production build locally
bun astro check  # Type-check .astro files
bunx convex dev  # Start Convex dev server (run alongside bun dev)
```

---

## Build Checklist

### Public Pages

```sh
[x] /                     — Home — assembled from all 9 marketing components
[x] /about                — Story, values grid, process steps, CTA
[x] /services             — Overview grid + deep-dive sections with anchor links
[x] /pricing              — Dynamic pricing tiers from Convex
[x] /reviews              — Approved testimonials from Convex
[x] /blog                 — Published post list from Convex
[x] /blog/[slug]          — Single post detail from Convex
[x] /gallery              — Published media from Convex storage
[x] /contact              — Contact form → Convex contacts table; rate-limited by email
[x] /funnels              — Index of all published funnel pages
[x] /funnels/[slug]       — Funnel landing page (headline, subheadline, ctaLabel, ctaHref)
[x] /shops                — Index of all published shops
[x] /shops/[slug]         — Shop product grid (Stripe checkout, sign-in required to purchase)
[x] /booking-links        — Index of all published booking link types
[x] /booking-links/[slug] — Native booking widget (Svelte island; availability, bookings in Convex)
[x] /sign-in              — Clerk-managed
[x] /sign-up              — Clerk-managed
[x] /onboarding           — Syncs Clerk user to Convex users table; sets role
[x] /privacy              — Pulls appName, siteUrl, supportEmail from appSettings
[x] /terms                — Pulls appName, siteUrl, supportEmail from appSettings
[x] /404                  — Custom not-found page
```

### Admin Portal

```sh
[x] /admin                — Index with module cards (Management, Content, Communications, Agents, Commerce)
[x] /admin/settings       — General, feature flags, notifications, design system, danger zone
[x] /admin/pages          — Page visibility control (active / planned / hidden)
[x] /admin/users          — View accounts, assign roles
[x] /admin/billing        — Stripe subscriptions, payments, invoices per user
[x] /admin/contacts       — List submissions, mark read, delete, mailto reply
[x] /admin/testimonials   — Approve + feature reviews → /reviews
[x] /admin/posts          — Create, edit, publish blog posts → /blog, /blog/[slug]
[x] /admin/gallery        — Upload media via Convex storage → /gallery
[x] /admin/pricing        — CRUD pricing tiers → /pricing
[x] /admin/funnels        — CRUD with slug auto-gen + structured content fields
[x] /admin/funnels/[id]   — Edit funnel: details + page content (headline, subheadline, ctaLabel, ctaHref)
[x] /admin/shops          — CRUD with slug auto-gen
[x] /admin/shops/[id]     — Edit shop: details + product management (Stripe Price ID per item)
[x] /admin/booking-links  — CRUD with slug auto-gen
[x] /admin/booking-links/[id] — Edit booking link: details + availability config + bookings list
[x] /admin/communications — Compose, Broadcast, Templates, History (Resend)
```

### AI Agents (Admin Portal)

7-agent AI agency playbook. Each agent page has a prompt assembly tool (long/short toggle, variable form,
live assembled output, copy to clipboard). Agents 3, 4, and 5 are also wired to live send pipelines.

```sh
[x] /admin/agents/[id]    — Generic prompt assembly tool for agents 1, 2, 6, 7
                            Long/short mode toggle; variable form; live assembled prompt; copy button
[x] /admin/agents/3       — Reactivation Campaign (Day 3)
                            Campaign trigger (manual: enter email → trigger 3-day D1/D2/D3 sequence)
                            Message CRUD (5 messages: D1, D2, D3, YES handler, NO handler)
                            Per-message enabled toggle + channel selector (email/sms/both)
                            Send history: per-message stats + recent activity timeline
                            Prompt assembly tool (Settings tab)
[x] /admin/agents/4       — Reviews & Referrals (Day 4)
                            4 automated messages (R1–R4) + 5 Google review reply copy templates (R5a–R5e)
                            Per-message enabled toggle + channel selector
                            Manual trigger for R2/R3/R4 (enter customer email → sends immediately)
                            R1 fires automatically 2h after each booking appointment
                            R5 templates are copy-paste cards (not sent via system)
                            Send history: per-message stats + recent activity timeline
                            Prompt assembly tool (Settings tab)
[x] /admin/agents/5       — Lead Nurturing (Day 5)
                            7 messages: M1–M5 (with M4a/M4b/M4c sub-messages)
                            Auto-triggered: M1 (+5min), M2 (+24h), M3 (+48h) from contacts.create
                            Auto-triggered: M4a (immediate), M4b/M4c (timed reminders), M5 (+60min) from bookings.create
                            Per-message enabled toggle + channel selector
                            Send history: per-message stats + recent activity timeline
                            Prompt assembly tool (Settings tab)
```

### Commerce (Convex Tables)

```sh
[x] funnels           — name, slug, headline, subheadline, ctaLabel, ctaHref, published
[x] shops             — name, slug, headline, subheadline, published
[x] shopItems         — shopId FK, name, description, price (cents), currency, stripePriceId, imageUrl, published, order
[x] bookingLinks      — name, slug, headline, subheadline, duration, bufferTime, availabilityStart,
                        availabilityEnd, availableDays (int[]), timezone, published
[x] bookings          — bookingLinkId FK, name, email, phone, date, startTime, status, notes
                        + scheduled IDs: m4bScheduledId, m4cScheduledId, m5ScheduledId, r1ScheduledId
```

### AI Agent Convex Tables

```sh
[x] nurturingMessages    — Agent 5: 7 message templates (m1–m5 incl. m4a/4b/4c)
[x] nurturingLogs        — Agent 5: per-send audit log (email + SMS stubs)
[x] reactivationMessages — Agent 3: 5 message templates (d1, d2, d3, yes_handler, no_handler)
[x] reactivationLogs     — Agent 3: per-send audit log
[x] reviewsMessages      — Agent 4: 9 messages (r1–r4 automated + r5a–r5e copy templates)
[x] reviewsLogs          — Agent 4: per-send audit log
```

### API Routes

```sh
[x] GET  /api/booking-slots  — Returns available time slots for a date (filters booked conflicts)
[x] POST /api/bookings       — Creates booking; double-booking conflict check
[x] POST /api/shop-checkout  — Calls Convex payments.createPaymentCheckout → Stripe redirect
```

---

## Incomplete Integrations

```sh
[x] sitePages per-page enforcement — All public pages call enforcePageStatus() in frontmatter.

[x] Contact confirmation email     — sendContactConfirmation fires from contacts.create.

[x] Booking confirmation email     — sendBookingConfirmation fires from bookings.create.

[~] SMS delivery                   — Email channel fully wired for all three agent sequences.
                                     SMS channel stubs in place (logs as "skipped") awaiting Twilio.
                                     Needs: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
                                     convex/sms.ts action that replaces the no-op in each agent module.

[ ] Twilio inbound SMS             — YES/NO response handlers (Agent 3) and R2/R3 conditional
                                     routing (Agent 4) require parsing inbound SMS replies.
                                     Needs: Twilio webhook endpoint in convex/http.ts

[ ] LLM connection for agents      — Planned v2 feature. Each agent page will become a live chat
                                     interface. Currently prompt assembly + copy only.

[ ] TABLED: Google reviews import  — Outscraper bulk import vs Google Business Profile API.
                                     Decision needed before implementation.
```

## Feature Flags

```sh
[x] maintenanceMode     — Wired. BaseLayout shows full-page overlay for all non-admin routes.
[x] registrationEnabled — /sign-up redirects to / when false.
[x] blogEnabled         — /blog + /blog/[slug] redirect to /404 when false.
                          getPageStatusMap() treats /blog as 'planned' → hidden from Header nav.
```

## appSettings Fields Reference

```sh
# General
appName, siteUrl, supportEmail, description

# Feature flags
maintenanceMode, registrationEnabled, blogEnabled

# Notifications
adminAlertEmail, notifyOnContact, notifyOnNewUser

# Design system
primaryColor, primaryName, secondaryColor, secondaryName,
tertiaryColor, tertiaryName, neutralColor, neutralName

# External links
googleReviewUrl

# Agent infrastructure (required for agent sequences to resolve variables)
primaryService       — fallback service name for Agent 5 M1-M3
defaultBookingLink   — URL injected as {{BOOKING_LINK}} in Agent 3 and Agent 5 messages
rafflePrize          — prize description injected as {{RAFFLE_PRIZE}} in Agent 3 and Agent 4
raffleLink           — raffle entry URL injected as {{RAFFLE_LINK}} in Agent 3 messages
feedbackFormLink     — URL injected as {{FEEDBACK_FORM_LINK}} in Agent 4 R3
referralShareLink    — URL injected as {{REFERRAL_SHARE_LINK}} in Agent 4 R4
referralIntroOffer   — offer description injected as {{REFERRAL_INTRO_OFFER}} in Agent 4 R4
```

Configure all agent infrastructure fields at `/admin/settings → General`.

---

## Infrastructure / Assets

```sh
[x] /robots.txt         — Disallows admin/dashboard/auth routes; sitemap placeholder line present
[x] /og-image.svg       — Branded SVG placeholder (1200×630). Replace with rasterized PNG for production.
[x] Sitemap             — @astrojs/sitemap installed; set SITE_URL env var to enable generation.
                          Dynamic routes (/blog/[slug] etc) not auto-included in SSR mode.
```

---

## sitePages Wiring

`/admin/pages` stores status per route in Convex `sitePages` table. Header + Footer filter nav to
active pages. All public pages enforce status in SSR frontmatter.

```sh
[x] src/lib/pageStatus.ts     — getPageStatus, getPageStatusMap, enforcePageStatus helpers
                                  getPageStatusMap also applies blogEnabled feature flag override
[x] Header.astro              — nav filtered to active pages only
[x] Footer.astro              — nav filtered; Services hidden when /services inactive
[x] Each public page          — enforcePageStatus(route, Astro) in every catalog page frontmatter.
                                  Slug pages (/blog/[slug], /funnels/[slug] etc) enforce their parent route.
```

---

## Path Aliases

```sh
@layouts/*    → src/layouts/*
@components/* → src/components/*
@marketing/*  → src/components/marketing/*
@lib/*        → src/lib/*
@pages/*      → src/pages/*
@styles/*     → src/styles/*
@convex/*     → convex/_generated/*
```
