# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bun dev          # Start dev server at localhost:4321
bun build        # Build production site to ./dist/
bun preview      # Preview production build locally
bun astro check  # Type-check .astro files
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

**Path alias:** `@pages/*` maps to `./src/pages/` (configured in `tsconfig.json`). When you create a new folder, you should add a new path alias to `tsconfig.json`

**Astro conventions:** Pages in `src/pages/` are file-based routes. Components go in `src/components/`. Static assets go in `public/`. `src/` directory will be added upon.

**Convex schema** (`convex/schema.ts`) must use strict TypeScript types via `v` from `convex/values`.

**`.devnotes/`** contains project strategy and agent specification documents (HTML). Do not delete these files. EVERYTIME you make changes to the project you MUST update and add to `.devnotes/project-setup.html`. This file will be used as a running log of how the template project (this project) was setup. This file is intended to handoff to a human or agentic developer and they should be able to recreate this template from scratch by only following the `.devnotes/project-setup.html` file. DO NOT SKIP THIS STEP!

**`src/components/TechStack.astro`** maintains the visual stack status grid shown on the index page. EVERYTIME a stack technology is installed/configured, update that technology's `status` field from `'pending'` to `'installed'`. Keep this in sync with `.devnotes/project-setup.html`. DO NOT SKIP THIS STEP!
