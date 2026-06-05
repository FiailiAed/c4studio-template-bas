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
[x] Frontend interactivity: TypeScript only. State lives in the DOM. NO REACT.
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
[x] /                   — Home — assembled from all 9 marketing components
[x] /contact            — Contact form → Convex contacts table (name, email, phone, subject, message)
[x] /sign-in            — Clerk-managed
[x] /sign-up            — Clerk-managed
[x] /onboarding         — Syncs Clerk user to Convex users table
[x] /404                — Custom not-found page
[x] /about              — Story, values grid, process steps, CTA
[x] /services           — Overview grid + deep-dive sections with #strategy #design #development #growth anchors
[x] /privacy            — Privacy Policy — pulls appName, siteUrl, supportEmail from appSettings
[x] /terms              — Terms of Use — pulls appName, siteUrl, supportEmail from appSettings
[x] /reviews            — Reads approved testimonials from Convex
[x] /blog               — Published post list from Convex
[x] /blog/[slug]        — Single post detail from Convex
[x] /gallery            — Published media from Convex storage
[ ] /funnels/[slug]     — Public-facing funnel pages (data already in Convex)
[ ] /shops/[slug]       — Public-facing shop pages (data already in Convex)
[ ] /booking-links/[slug] — Public-facing booking pages (data already in Convex)
```

### Admin Portal

```sh
[x] /admin              — Index with module cards
[x] /admin/settings     — General, feature flags, notifications, design system, danger zone
[x] /admin/pages        — Page visibility control (active / planned / hidden)
[x] /admin/users        — View accounts, assign roles
[x] /admin/billing      — Stripe subscriptions, payments, invoices per user
[x] /admin/contacts     — List submissions, mark read, delete, mailto reply
[x] /admin/funnels      — CRUD with slug auto-gen
[x] /admin/shops        — CRUD with slug auto-gen
[x] /admin/booking-links — CRUD with slug auto-gen
[x] /admin/communications — Compose, Broadcast, Templates, History (Resend)
[x] /admin/testimonials  — Approve + feature reviews → /reviews
[x] /admin/posts         — Create, edit, publish blog posts → /blog, /blog/[slug]
[x] /admin/gallery       — Upload media via Convex storage
```

### Incomplete Integrations

```sh
[ ] sitePages wiring         — /admin/pages writes statuses but nothing reads them yet
                               Needs: src/lib/pageStatus.ts helper
                                      Header.astro + Footer.astro nav filtering
                                      Per-page enforcement (active/hidden → 404)

[ ] User confirmation email  — No email sent to submitter after contact form submission
                               Needs: sendUserConfirmation internalAction in convex/email.ts
                                      Called from contacts.create via ctx.scheduler

[ ] SMS infrastructure       — No Twilio integration exists yet
                               Needs: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER env vars
                                      convex/sms.ts internalAction
                                      smsLogs table in schema
                                      appSettings fields: market, primaryService, defaultBookingLink, smsTemplate
                                      Scheduled action from contacts.create (5-min instant response)
                                      Scheduler cancellation: store scheduledFunctionId on contacts record

[ ] SMS follow-up sequence   — 24-hour + 48-hour nudge (copy in .devnotes/direct-response-copywriter-template-output.md)
                               Depends on SMS infrastructure above

[ ] Booking webhook          — Required for SMS confirmation sequence (4a/4b/4c) and no-show win-back
                               Source: Cal.com, Calendly, or native /booking-links/[slug] pages

[ ] TABLED: Google reviews import — Decide whether to build Outscraper bulk import flow on
                               /admin/testimonials or move to another outstanding task.
                               Context: Outscraper API (paid, no OAuth) vs Google Business Profile
                               API via Clerk OAuth. Outscraper preferred for agency use case.
```

### Infrastructure / Assets

```sh
[ ] /og-image.png       — BaseLayout references it but file doesn't exist in public/
[ ] /robots.txt         — Not present in public/
[ ] Sitemap             — @astrojs/sitemap not configured
[ ] smsLogs table       — Needed to log outbound SMS (mirrors existing emailLogs pattern)
```

---

## Admin Pages → Public Site Connection

The `/admin/pages` module stores page statuses (active / planned / hidden) in the Convex
`sitePages` table. This is **not yet wired to the public site**. The full connection requires:

```sh
[ ] src/lib/pageStatus.ts      — shared helper: fetch a route's status, enforce active/hidden/planned
[ ] src/components/marketing/Header.astro  — filter nav links to only show 'active' pages
[ ] src/components/marketing/Footer.astro  — same filter as Header
[ ] Each public page           — call pageStatus helper at render time:
                                   active  → render normally
                                   hidden  → render (direct URL works), excluded from nav + sitemap
                                   planned → redirect to 404
```

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
