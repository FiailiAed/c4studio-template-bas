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

## Admin Portal — Completed Modules

```sh
[x] Settings       — /admin/settings       — general, feature flags, notifications, design system, danger zone
[x] Pages          — /admin/pages          — control public page visibility (active / planned / hidden)
[x] Users          — /admin/users          — view accounts, assign roles
[x] Billing        — /admin/billing        — Stripe subscriptions, payments, invoices per user
[x] Funnels        — /admin/funnels        — create, edit, publish (slug auto-gen)
[x] Shops          — /admin/shops          — create, edit, publish (slug auto-gen)
[x] Booking Links  — /admin/booking-links  — create, edit, publish (slug auto-gen)
[x] Communications — /admin/communications — Compose, Broadcast, Templates, History (Resend)
```

## Public Site — Completed

```sh
[x] Marketing components — src/components/marketing/ — Header, Hero, TrustBar, Services,
                           About, Reviews, Gallery, CTA, Footer (all prop-driven with defaults)
[x] Home                 — /  — assembled from all 9 marketing components, pulls appName +
                           description from Convex app settings
```

## Outstanding Tasks

Pages are ordered by priority. Admin modules must be built before their dependent public pages.

### Priority 1 — No dependencies, build immediately
```sh
[ ] /contact            — contact form → Convex contacts table (closes every CTA on the site)
[ ] /about              — static, high-trust, second most-visited page
[ ] /services           — static, core SEO page, expands on the Services component
[ ] /admin/contacts     — view contact submissions, mark read
```

### Priority 2 — Requires admin module first
```sh
[ ] /admin/testimonials — approve + feature reviews         ← build before /reviews
[ ] /reviews            — reads approved testimonials from Convex

[ ] /admin/posts        — create, edit, publish blog posts  ← build before /blog
[ ] /blog               — published post list from Convex
[ ] /blog/[slug]        — single post detail from Convex

[ ] /admin/gallery      — upload media via Convex storage   ← build before /gallery
[ ] /gallery            — published media items from Convex storage
```

### Priority 3 — Project-specific dynamic entity pages
```sh
[ ] /funnels/[slug]       — public-facing funnel pages (data already in Convex)
[ ] /shops/[slug]         — public-facing shop pages (data already in Convex)
[ ] /booking-links/[slug] — public-facing booking pages (data already in Convex)
```

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

Once wired, toggling a page to "hidden" in the admin instantly removes it from nav and
sitemap while keeping it accessible via direct URL. "Planned" pages redirect to 404.

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

## Commands

```sh
bun dev          # Start dev server at localhost:4321
bun build        # Build production site to ./dist/
bun preview      # Preview production build locally
bun astro check  # Type-check .astro files
bunx convex dev  # Start Convex dev server (run alongside bun dev)
```
