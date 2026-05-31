<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into the c4studio B.A.S. template. Both client-side and server-side tracking are now active across the full application.

**What was added:**

- `posthog-js` and `posthog-node` installed via Bun
- `src/components/posthog.astro` — client-side PostHog snippet using `is:inline` and `define:vars` to safely inject env-var tokens without Astro TypeScript processing
- `src/lib/posthog-server.ts` — singleton `posthog-node` client for all server-side captures; reads `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from environment
- `src/layouts/BaseLayout.astro` — PostHog component imported and rendered in `<head>`, ensuring every page in the app loads the tracker
- `.env` — four PostHog environment variables written (`PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST`, `POSTHOG_PROJECT_TOKEN`, `POSTHOG_HOST`)
- User identification on the onboarding page: Clerk userId is passed server-side via `posthog.identify()` and client-side via `window.posthog?.identify()`

| Event | Description | File | Side |
|---|---|---|---|
| `onboarding_viewed` | User lands on the onboarding page — top of user activation funnel | `src/pages/onboarding.astro` | Client |
| `onboarding_completed` | User successfully completes onboarding and creates their account | `src/pages/onboarding.astro` | Server |
| `funnel_created` | Admin creates a new marketing funnel | `src/pages/admin/funnels/index.astro` | Server |
| `shop_created` | Admin creates a new shop | `src/pages/admin/shops/index.astro` | Server |
| `booking_link_created` | Admin creates a new booking link | `src/pages/admin/booking-links/index.astro` | Server |
| `email_sent` | Admin sends a composed one-off email | `src/pages/admin/communications/compose.astro` | Server |
| `email_broadcast_sent` | Admin sends a broadcast email to all registered users | `src/pages/admin/communications/broadcast.astro` | Server |
| `user_role_changed` | Admin promotes or demotes a user's role | `src/pages/admin/users.astro` | Server |
| `user_removed` | Admin removes a user account | `src/pages/admin/users.astro` | Server |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1651316)
- [User Activation — Onboarding Completed](/insights/VJB2b7vN) — daily unique users completing onboarding
- [Onboarding Funnel](/insights/1oIACCVz) — conversion from onboarding page view to completion
- [Content Creation Activity](/insights/4CSg8Kz3) — funnels, shops, and booking links created over time
- [Email Communications Sent](/insights/Q43UXnMs) — individual and broadcast emails sent by admins
- [Admin User Management Actions](/insights/uIlgZTpg) — role changes and user removals

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-astro-ssr/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
