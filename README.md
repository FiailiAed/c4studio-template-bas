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

## Outstanding Tasks

### Admin Content Modules
```sh
[ ] Blog Posts   — /admin/posts        — create, edit, publish
[ ] Testimonials — /admin/testimonials — approve, feature
[ ] Contact      — /admin/contacts     — view submissions, mark read
[ ] Gallery      — /admin/gallery      — upload media via Convex storage
```

### Public Site Pages
```sh
[ ] Home         — /               — actual landing page (current index is the template overview)
[ ] About        — /about
[ ] Services     — /services
[ ] Reviews      — /reviews
[ ] Blog         — /blog + /blog/[slug]
[ ] Gallery      — /gallery
[ ] Contact      — /contact        — form that writes to the contacts Convex table
```

### Public Pages for Dynamic Entities
```sh
[ ] Funnels       — /funnels/[slug]        — public-facing funnel pages
[ ] Shops         — /shops/[slug]          — public-facing shop pages
[ ] Booking Links — /booking-links/[slug]  — public-facing booking pages
```

## Commands

```sh
bun dev          # Start dev server at localhost:4321
bun build        # Build production site to ./dist/
bun preview      # Preview production build locally
bun astro check  # Type-check .astro files
bunx convex dev  # Start Convex dev server (run alongside bun dev)
```
