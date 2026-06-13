export type TaskStatus =
  | 'complete'
  | 'in-progress'
  | 'planned'
  | 'tabled'
  | 'future'
  | 'overlooked';

export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'none';

export type TaskCategory =
  | 'stack'
  | 'auth'
  | 'analytics'
  | 'email'
  | 'payments'
  | 'admin-ui'
  | 'public-ui'
  | 'agents'
  | 'commerce'
  | 'seo'
  | 'security'
  | 'compliance'
  | 'devex'
  | 'convex'
  | 'feature-flags';

export interface DevTask {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  version?: string;
  category: TaskCategory;
  notes: string;
}

export const TASKS: DevTask[] = [
  // ─── COMPLETE ────────────────────────────────────────────────────────────────
  { id: 1,  title: 'Astro SSR + Vercel adapter + Bun runtime',          status: 'complete', priority: 'none', category: 'stack',        notes: 'Non-negotiable stack locked in. Bun runtime, Astro 6 SSR, @astrojs/vercel adapter.' },
  { id: 2,  title: 'TailwindCSS v4 via Vite plugin',                    status: 'complete', priority: 'none', category: 'stack',        notes: 'No config file needed. Vite watch ignore for convex/_generated/ prevents race condition on dev server.' },
  { id: 3,  title: 'Convex schema + HTTP client helper',                 status: 'complete', priority: 'none', category: 'convex',       notes: 'All tables defined. convex/schema.ts uses strict v validators. src/lib/convex.ts exports convex (unauthed) and getAuthedConvex(token).' },
  { id: 4,  title: 'Clerk middleware + JWT auth',                        status: 'complete', priority: 'none', category: 'auth',         notes: 'src/middleware.ts protects /admin/* and /dashboard/*. Role (admin|user) stored in Convex users table, not Clerk.' },
  { id: 5,  title: 'Onboarding flow → Convex users table',               status: 'complete', priority: 'none', category: 'auth',         notes: '/onboarding calls users.createOrUpdate. Role field assigned here.' },
  { id: 6,  title: 'Path aliases (@layouts, @lib, @convex, etc.)',        status: 'complete', priority: 'none', category: 'devex',        notes: 'All 7 aliases configured in tsconfig.json. Add a new alias whenever a new src/ subdirectory is created.' },
  { id: 7,  title: 'Vercel Web Analytics + PostHog',                     status: 'complete', priority: 'none', category: 'analytics',    notes: 'Both wired in BaseLayout. PostHog scripts must use is:inline to avoid Astro TypeScript processing errors.' },
  { id: 8,  title: 'Resend transactional email',                         status: 'complete', priority: 'none', category: 'email',        notes: 'Contact confirmation and booking confirmation emails fire from Convex mutations. Admin communications module wired.' },
  { id: 9,  title: 'Stripe via @convex-dev/stripe',                      status: 'complete', priority: 'none', category: 'payments',     notes: 'HTTP webhook registered in convex/http.ts at /stripe/webhook. Shop checkout via /api/shop-checkout.ts. Billing page joins Convex users with Stripe via tokenIdentifier.' },
  { id: 10, title: 'All 26 public pages',                                status: 'complete', priority: 'none', category: 'public-ui',    notes: '/ through /404. Marketing, content, commerce, auth/system, utility, legal pages all live.' },
  { id: 11, title: '/dashboard user portal',                              status: 'complete', priority: 'none', category: 'admin-ui',     notes: 'Minimal account page for non-admin users. Shows name, email, role. Admin users see a link to /admin.' },
  { id: 12, title: 'Admin portal — all 30+ pages',                        status: 'complete', priority: 'none', category: 'admin-ui',     notes: 'Management, Content, Communications, Agents, Commerce sections. All pages follow the standard 5-line auth guard pattern.' },
  { id: 13, title: 'sitePages enforcement on every catalog page',         status: 'complete', priority: 'none', category: 'feature-flags', notes: 'enforcePageStatus() called in every public catalog page frontmatter. planned → /404. hidden → renders but excluded from nav.' },
  { id: 14, title: 'maintenanceMode feature flag',                        status: 'complete', priority: 'none', category: 'feature-flags', notes: 'Full-page overlay in BaseLayout for all non-admin/non-auth routes when enabled.' },
  { id: 15, title: 'registrationEnabled feature flag',                    status: 'complete', priority: 'none', category: 'feature-flags', notes: '/sign-up redirects to / when false. No effect on public Header nav (see task #43).' },
  { id: 16, title: 'blogEnabled feature flag',                            status: 'complete', priority: 'none', category: 'feature-flags', notes: '/blog + /blog/[slug] redirect to /404 when false. getPageStatusMap treats /blog as planned → drops from Header nav.' },
  { id: 17, title: 'Contact form rate limiting',                          status: 'complete', priority: 'none', category: 'security',     notes: 'Email-based, 5-minute window using by_email index on contacts table. RATE_LIMITED error surfaces user-friendly message.' },
  { id: 18, title: 'Contact confirmation email',                          status: 'complete', priority: 'none', category: 'email',        notes: 'sendContactConfirmation internalAction fires from contacts.create.' },
  { id: 19, title: 'Booking confirmation email',                          status: 'complete', priority: 'none', category: 'email',        notes: 'sendBookingConfirmation internalAction fires from bookings.create.' },
  { id: 20, title: 'notifyOnContact + notifyOnNewUser alert emails',       status: 'complete', priority: 'none', category: 'email',        notes: 'Both flags wired in contacts.ts and users.ts. When enabled, sends alert to adminAlertEmail.' },
  { id: 21, title: 'BookingWidget Svelte island',                         status: 'complete', priority: 'none', category: 'commerce',     notes: '4-step calendar → slots → form → confirmation. client:load directive. Server data passed as props from SSR frontmatter.' },
  { id: 22, title: 'Booking double-booking conflict check',                status: 'complete', priority: 'none', category: 'commerce',     notes: 'In /api/bookings POST handler. Queries by_booking_link_and_date index.' },
  { id: 23, title: 'Commerce modules — Funnels, Shops, Booking Links',    status: 'complete', priority: 'none', category: 'commerce',     notes: 'Full CRUD admin + public pages. Slug auto-gen. shopItems with Stripe Price ID per item.' },
  { id: 24, title: 'Agent 3 — Reactivation Campaign pipeline',            status: 'complete', priority: 'none', category: 'agents',       notes: 'D1/D2/D3/YES/NO. Manual trigger from /admin/agents/3. D1 immediate, D2 +24h, D3 +48h. Email fully wired. SMS stubbed.' },
  { id: 25, title: 'Agent 4 — Reviews & Referrals pipeline',              status: 'complete', priority: 'none', category: 'agents',       notes: 'R1 auto-fires 2h after booking appointment. R2/R3/R4 manual trigger. R5a-R5e copy-paste Google reply templates. Email wired. SMS stubbed.' },
  { id: 26, title: 'Agent 5 — Lead Nurturing pipeline',                   status: 'complete', priority: 'none', category: 'agents',       notes: 'M1–M5 (incl. M4a/b/c). M1/M2/M3 from contacts.create. M4a/b/c/M5 from bookings.create. Email wired. SMS stubbed.' },
  { id: 27, title: 'Agents 1, 2, 6, 7 — prompt assembly tools',          status: 'complete', priority: 'none', category: 'agents',       notes: '/admin/agents/[id] generic page. Long/short mode toggle, variable form, live assembled prompt, copy button.' },
  { id: 28, title: '{{VAR_KEY}} variable substitution system',             status: 'complete', priority: 'none', category: 'agents',       notes: 'Templates use double-curly syntax. Resolved from appSettings + contact/booking record at send time via substitute() helper.' },
  { id: 29, title: 'HMAC-SHA256 tokenized email action links',            status: 'complete', priority: 'none', category: 'security',     notes: 'src/lib/tokens.ts exports signToken/verifyToken. Used for booking cancel, reactivation YES/NO, review rating. CANCEL_SECRET must match in both Vercel and Convex.' },
  { id: 30, title: 'SMS channel stubs across all agent sequences',         status: 'complete', priority: 'none', category: 'agents',       notes: 'Each *Actions.ts logs SMS attempts as skipped with reason "SMS not configured". Structured for easy Twilio drop-in.' },
  { id: 31, title: 'robots.txt',                                          status: 'complete', priority: 'none', category: 'seo',          notes: 'Disallows /admin/*, /dashboard/*, /api/*. Sitemap placeholder line present.' },
  { id: 32, title: '/og-image.svg placeholder',                           status: 'complete', priority: 'none', category: 'seo',          notes: '1200×630 branded SVG. Must be replaced with rasterized PNG before social sharing works (see task #45).' },
  { id: 33, title: '/changelog + /roadmap pages',                         status: 'complete', priority: 'none', category: 'public-ui',    notes: 'Static pages in Footer Product nav. Both enforce sitePages. Roadmap driven from versions array in frontmatter.' },
  { id: 34, title: '/api/reactivation/respond handler',                   status: 'complete', priority: 'none', category: 'agents',       notes: 'GET handler. Agent 3 YES/NO email response. Validates HMAC token, triggers appropriate handler message.' },
  { id: 35, title: '/api/reviews/rate handler',                           status: 'complete', priority: 'none', category: 'agents',       notes: 'GET handler. Agent 4 star-rating email link. Rating ≥ 4 → R3 (Google review ask), < 4 → R4 (feedback form).' },
  { id: 36, title: '/bookings/cancel public cancel page',                  status: 'complete', priority: 'none', category: 'commerce',     notes: 'Token-authenticated. Customer confirms cancellation. Sets booking status to cancelled in Convex.' },
  { id: 37, title: '/reactivation/responded + /reviews/rated landings',    status: 'complete', priority: 'none', category: 'public-ui',    notes: 'Post-action confirmation pages. Both enforce sitePages.' },
  { id: 38, title: 'Admin Dev section + task board entry card',            status: 'complete', priority: 'none', category: 'admin-ui',     notes: 'Development section in /admin with links to Roadmap, Changelog, and Task Board.' },

  // ─── IN PROGRESS ─────────────────────────────────────────────────────────────
  { id: 39, title: 'SMS delivery — Twilio integration',                   status: 'in-progress', priority: 'P2', version: 'v1.1', category: 'agents', notes: 'Email fully wired. SMS stubs log as skipped. To activate: add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER to Convex env vars; replace no-op blocks in nurturingActions.ts, reactivationActions.ts, reviewActions.ts with Twilio SDK calls.' },

  // ─── PLANNED — v0.0.4 ────────────────────────────────────────────────────────
  { id: 40, title: 'Agent Variables UI in /admin/settings',               status: 'complete', priority: 'none', version: 'v0.0.4', category: 'admin-ui', notes: 'All 8 agent fields (primaryService, defaultBookingLink, rafflePrize, raffleLink, feedbackFormLink, referralShareLink, referralIntroOffer, googleReviewUrl) have form inputs in /admin/settings → Agent Variables section. POST handler wired to settings.upsert. Each field shows its injected variable name as help text.' },

  // ─── PLANNED — v0.0.5 ────────────────────────────────────────────────────────
  { id: 41, title: 'Design system color picker fix',                      status: 'planned', priority: 'P1', version: 'v0.0.5', category: 'admin-ui',      notes: 'Hex input → hidden field sync is broken in /admin/settings → Design System. Saved values do not round-trip. Live swatch preview is out of sync with stored data.' },
  { id: 42, title: 'Commerce feature flags (Funnels, Shops, Booking Links)', status: 'complete', priority: 'none', category: 'feature-flags', notes: 'funnelsEnabled, shopsEnabled, bookingLinksEnabled added to appSettings schema, settings.ts upsert, admin settings UI toggles, pageStatus.ts getPageStatusMap overrides, and page-level redirects on all 6 index/slug pages. Mirrors blogEnabled pattern exactly.' },
  { id: 43, title: 'Registration-gated sign-in button in Header',         status: 'planned', priority: 'P1', version: 'v0.0.5', category: 'public-ui',     notes: 'registrationEnabled flag exists and redirects /sign-up, but Header.astro has no sign-in or sign-up button at all. Flag has zero effect on public-facing nav. Unauthenticated visitors cannot discover the auth flow.' },
  { id: 44, title: 'Agent email test mode / step-through debugger',       status: 'complete', priority: 'none', version: 'v0.0.5', category: 'agents',        notes: 'Vertical stepper on the Test tab of each agent page (3, 4, 5) that steps the admin through the full message sequence with real Resend email delivery to a specified test address. Setup card: pick a real contact or booking (for variable resolution) + enter test email. Stepper: each step shows the resolved subject + body preview before sending, then fires via POST /api/agents/test-send → Convex public action → Resend. Results logged with isTest:true in the existing log tables so they appear in History clearly marked as test sends. On success the step indicator turns green and the stepper auto-advances; on failure it turns red and shows retry. Agent 3 uses contactId (D1–D3 + handlers). Agent 4 uses bookingId (R1–R4 only; R5 templates not testable). Agent 5 uses contactId for M1–M3 and bookingId for M4a–M5 (both selectors required in setup). Schema: isTest v.optional(v.boolean()) added to reactivationLogs, reviewsLogs, nurturingLogs. New public Convex actions: testSendReactivation, testSendReview, testSendNurturing. API route: src/pages/api/agents/test-send.ts. Requires bunx convex dev to regenerate api.d.ts types.' },

  // ─── PLANNED — v1.0 ──────────────────────────────────────────────────────────
  { id: 45, title: 'OG image PNG',                                        status: 'planned', priority: 'P1', version: 'v1.0', category: 'seo',      notes: '/public/og-image.svg does not work on Twitter/X, LinkedIn, or iMessage. Must be replaced with a properly rasterized 1200×630 PNG before social sharing link previews work.' },
  { id: 46, title: 'Sitemap for static public routes',                    status: 'planned', priority: 'P1', version: 'v1.0', category: 'seo',      notes: '@astrojs/sitemap is installed but not generating. Wire it to cover all static catalog routes (not dynamic slug routes — those are v2.0). Requires SITE_URL env var.' },
  { id: 47, title: 'Pre-launch environment verification',                  status: 'planned', priority: 'P1', version: 'v1.0', category: 'devex',    notes: 'CANCEL_SECRET must match in both Vercel and Convex. RESEND_FROM_EMAIL must be a verified Resend sender domain. Stripe webhook secret must be set for the production endpoint. CLERK_JWT_ISSUER_DOMAIN must match the live Clerk app.' },
  { id: 48, title: 'Production build sign-off',                           status: 'planned', priority: 'P1', version: 'v1.0', category: 'stack',    notes: 'bun build + bun preview with zero errors. bun astro check with no type errors. Final audit: every catalog page has enforcePageStatus(); every admin page has the exact 5-line auth guard from CLAUDE.md.' },

  // ─── PLANNED — v1.1 ──────────────────────────────────────────────────────────
  { id: 49, title: 'Twilio outbound SMS activation',                      status: 'planned', priority: 'P2', version: 'v1.1', category: 'agents', notes: 'Replace no-ops in nurturingActions.ts, reactivationActions.ts, reviewActions.ts with Twilio SDK calls. Requires Twilio env vars in Convex. Per-message channel selector already built in admin UI — SMS path activates automatically.' },
  { id: 50, title: 'Twilio inbound SMS webhook',                          status: 'planned', priority: 'P2', version: 'v1.1', category: 'agents', notes: 'New endpoint in convex/http.ts. Needed for Agent 3 YES/NO responses and Agent 4 R2/R3 conditional routing arriving via SMS replies.' },

  // ─── PLANNED — v1.2 ──────────────────────────────────────────────────────────
  { id: 51, title: 'Claude API integration for agent chat',               status: 'planned', priority: 'P3', version: 'v1.2', category: 'agents', notes: 'Replace prompt assembly tool on each agent page with a live Claude chat interface. Current amber "Coming soon" banner on each agent page notes this.' },
  { id: 52, title: 'Agent conversation persistence',                      status: 'planned', priority: 'P3', version: 'v1.2', category: 'convex', notes: 'New Convex table for per-agent message threads. Retrieve conversation history across sessions.' },
  { id: 53, title: 'Streaming responses in agent chat UI',                status: 'planned', priority: 'P3', version: 'v1.2', category: 'agents', notes: 'Stream Claude API responses token-by-token into the admin chat UI for a real-time feel.' },
  { id: 54, title: 'Context injection for agent sessions',                status: 'planned', priority: 'P3', version: 'v1.2', category: 'agents', notes: 'Auto-inject assembled prompt + current appSettings + relevant contact/booking data as system context at the start of each conversation.' },

  // ─── TABLED ──────────────────────────────────────────────────────────────────
  { id: 55, title: 'Google Reviews import',                               status: 'tabled', priority: 'P3', category: 'admin-ui', notes: 'Decision pending: Outscraper (paid bulk import, no OAuth) vs Google Business Profile API via Clerk OAuth. outscraperApiKey is already in the appSettings schema. Bulk import UI would live in /admin/testimonials.' },
  { id: 56, title: 'Anonymous shop checkout',                             status: 'tabled', priority: 'P3', category: 'commerce', notes: 'Allow guest purchases on /shops/[slug] without Clerk sign-in. Currently requires auth. Needs evaluation of Stripe guest flow vs post-purchase account creation UX.' },

  // ─── OVERLOOKED / NOT YET CAPTURED ───────────────────────────────────────────
  { id: 57, title: 'Email unsubscribe / opt-out mechanism',               status: 'complete',   priority: 'none', version: 'v1.0', category: 'compliance', notes: 'CAN-SPAM and GDPR compliance. Added optedOut field to contacts schema. optOut mutation in contacts.ts. HMAC-signed /api/unsubscribe GET route validates token and patches optedOut=true. All three agent action files (nurturingActions, reactivationActions, reviewActions) check optedOut before sending and append unsubscribe footer HTML to every outbound email. Confirmation page at /unsubscribed. Token payload: unsub:${contactId} signed with CANCEL_SECRET.' },
  { id: 58, title: '.env.example reference file',                         status: 'overlooked', priority: 'P1', version: 'v1.0', category: 'devex',      notes: 'No .env.example exists. CLAUDE.md documents the env vars but a reference file is needed for developer onboarding and client handoff. Must cover all 11 vars split across Vercel (.env.local) and Convex dashboard.' },
  { id: 59, title: 'Clerk user deletion webhook → Convex cleanup',        status: 'overlooked', priority: 'P1', version: 'v1.0', category: 'auth',       notes: 'No clerk/user.deleted webhook handler in convex/http.ts. If a Clerk user is deleted, their Convex users record, scheduled agent actions, and associated data are never cleaned up. Orphaned records will accumulate.' },
  { id: 60, title: '/dashboard is a content stub',                        status: 'overlooked', priority: 'P2', version: 'v1.0', category: 'public-ui',  notes: 'src/pages/dashboard/index.astro exists but is not in README checklist or PAGE_CATALOG. Shows only name/email/role. Decision needed: intentional minimal landing for non-admin users, or does it need real content (bookings, orders, etc.)?' },
  { id: 61, title: 'Admin list pagination',                               status: 'overlooked', priority: 'P2', version: 'v1.1', category: 'convex',     notes: 'All admin list views (contacts, posts, bookings, gallery, etc.) use ctx.db.query().collect() — loads the full table on every request. At production scale this will be slow and expensive. Convex pagination API (ctx.db.query().paginate()) should be used.' },
  { id: 62, title: 'Rate limiting on /api/bookings POST',                 status: 'overlooked', priority: 'P2', version: 'v1.0', category: 'security',   notes: 'Rate limiting is only on the contact form (5-minute email window). /api/bookings POST has no protection. A bot using unique emails could flood the bookings table and trigger Agent 5 sequences for every entry.' },
  { id: 63, title: '500 / server error page',                             status: 'complete', priority: 'none', version: 'v1.0', category: 'public-ui',  notes: 'src/pages/500.astro created. Fully static — zero Convex calls, zero async operations. Writes raw HTML inline (no BaseLayout) so it cannot fail if Convex caused the error. Receives Astro.props.error; shows error detail only in dev mode. Astro + Vercel serve it automatically for any unhandled SSR error.' },
  { id: 64, title: 'Resend bounce / complaint webhook',                   status: 'overlooked', priority: 'P2', version: 'v1.1', category: 'email',      notes: 'No handler for Resend delivery failure events (bounces, spam complaints). Agent log entries are only marked failed when Resend returns a synchronous error. Async failures (soft bounces, spam folder) are invisible. Add a Resend webhook endpoint in convex/http.ts.' },
  { id: 65, title: 'Booking timezone display clarity',                    status: 'overlooked', priority: 'P2', version: 'v1.0', category: 'commerce',   notes: 'bookingLinks has a timezone field but no timezone label is shown to the customer in the booking widget or confirmation email. A customer in PST booking a business in EST will see ambiguous times.' },
  { id: 66, title: 'Contact form spam / bot protection',                  status: 'overlooked', priority: 'P2', version: 'v1.0', category: 'security',   notes: 'Only rate limiting by email exists. No honeypot field, CAPTCHA, or header-based bot detection. A spammer using unique email addresses can still flood the contacts table and trigger Agent 5 M1/M2/M3 sequences for every submission.' },
  { id: 67, title: 'Agent 4 R1 scheduling: appointment time vs creation time', status: 'overlooked', priority: 'P2', version: 'v1.0', category: 'agents', notes: 'R1 fires "2h after booking appointment." Needs verification: is the 2h delay calculated from booking appointment date+startTime, or from _creationTime? If a booking is made days in advance, these are very different. If using creationTime, R1 fires before the appointment happens.' },
  { id: 68, title: 'Admin search / filter on list views',                  status: 'overlooked', priority: 'P3', version: 'v2.0', category: 'admin-ui',  notes: 'Contacts, posts, gallery, bookings — no search box or status filter. As content grows, scrolling an unfiltered list becomes unusable. Convex filter() supports basic text search on indexed fields.' },
  { id: 69, title: 'Security headers in vercel.json',                     status: 'complete',   priority: 'none', version: 'v1.0', category: 'security',   notes: 'No vercel.json with response headers. X-Frame-Options (clickjacking), X-Content-Type-Options (MIME sniffing), Referrer-Policy, and a basic Content-Security-Policy are expected for any production deployment.' },
  { id: 70, title: 'appSettings schema fields for commerce flags',        status: 'complete', priority: 'none', category: 'convex',   notes: 'funnelsEnabled, shopsEnabled, bookingLinksEnabled added to appSettings in convex/schema.ts and settings.ts upsert mutation args. Completed as part of task #42.' },
  { id: 71, title: 'Admin dashboard analytics widgets',                   status: 'overlooked', priority: 'P3', version: 'v2.0', category: 'admin-ui',   notes: '/admin/index.astro shows module cards but no live stats. Useful additions: bookings this week, unread contacts, recent signups, total revenue. Convex queries already exist to power these.' },
  { id: 72, title: 'Gallery image optimization',                          status: 'overlooked', priority: 'P3', version: 'v2.0', category: 'commerce',   notes: 'Convex storage returns raw URLs with no resizing or compression. No srcset, no width/height optimization, no CDN transforms. Large image uploads will slow the /gallery page and consume bandwidth.' },
  { id: 73, title: 'appSettings design system colors → CSS variables at runtime', status: 'overlooked', priority: 'P3', version: 'v2.0', category: 'admin-ui', notes: 'The design system stores brand colors in appSettings but they are never applied to the site. Admin can save colors, but nothing reads them into CSS variables. The color picker is broken anyway (see task #41) so this is doubly deferred.' },
  { id: 74, title: 'Stripe test → live mode migration process',           status: 'overlooked', priority: 'P3', version: 'v1.0', category: 'payments',   notes: 'No documentation on switching from Stripe test keys to live keys, or what happens to the webhook endpoint during that transition. Should be part of the pre-launch checklist.' },
  { id: 81, title: 'Expand /admin/contacts to directory with per-contact detail view', status: 'overlooked', priority: 'P2', version: 'v0.0.5', category: 'admin-ui', notes: 'Convert flat contacts.astro to contacts/ directory. Add /admin/contacts/index.astro (list view, unchanged) and /admin/contacts/[id].astro (per-contact detail: full message, subject, phone, timestamps, read/unread toggle, delete, mailto reply button, and Agent 5 nurturing log for that contact). Move the Management section card href from /admin/contacts to /admin/contacts (no change needed — index.astro handles it). Requires contacts.getById query in convex/contacts.ts.' },

  { id: 82, title: 'Native Raffle System — entries, tracking, and winner selection', status: 'planned', priority: 'P1', version: 'v1.0', category: 'agents', notes: 'Own the full raffle funnel natively so all entry data lives in Convex, enabling agent sequencing, referral attribution, and winner audit trails — none of which are possible with an external link (Gleam, Typeform, etc.). Schema: raffles table (title, prize, drawDate, status: active|closed|drawn, description, campaignType: reactivation|referral|manual) and raffleEntries table (raffleId, contactId, entryMethod: email_click|sms_yes|referral|manual, entryWeight, createdAt). Tokenized entry endpoint: GET /api/raffle/enter?raffleId=X&contactId=Y&token=Z — same HMAC pattern as booking cancel and reactivation YES/NO. Clicking the link in an agent email creates an entry record and redirects to /raffle/entered confirmation page. Referral entry path: referred prospect hits /raffle/enter via shared link → if no contactId, create a new contact record first (capturing their data), then log the entry. Admin CRUD: /admin/raffles — list all raffles, create new (title, prize, drawDate), view entrant list with contact names and entry methods, close entries, pick winner (weighted random draw respecting entryWeight). {{RAFFLE_LINK}} in agent messages resolves to a tokenized URL generated at send time by the action using the contactId. Agent 3 D1/D2/D3 and Agent 4 R3/R4 all use this pattern. Referral entryWeight > 1 (e.g. 5) to reward referrers with bonus entries. Winner selection mutation draws from active entries, records winnerId on the raffle, and prevents re-draw.' },

  // ─── FUTURE — v2.0 ───────────────────────────────────────────────────────────
  { id: 75, title: 'Per-client setup guide / new project checklist',      status: 'future', priority: 'P3', version: 'v2.0', category: 'devex',   notes: 'Template is designed to be forked per client, but there is no documented step-by-step checklist for spinning up a new client. Should cover env vars, Clerk app, Convex project, Stripe account, Resend domain verification, and first admin user.' },
  { id: 76, title: 'Sitemap for dynamic routes',                          status: 'future', priority: 'P3', version: 'v2.0', category: 'seo',     notes: '/blog/[slug], /funnels/[slug], /shops/[slug], /booking-links/[slug] are excluded from sitemap in SSR mode. Needs a custom sitemap endpoint that queries Convex for all published slugs and generates XML.' },
  { id: 77, title: 'Multi-tenant architecture',                           status: 'future', priority: 'P3', version: 'v2.0', category: 'convex',  notes: 'Single Convex deployment serving multiple client sites with per-tenant data isolation. Significant schema and auth changes required.' },
  { id: 78, title: 'White-label design tokens at build time',             status: 'future', priority: 'P3', version: 'v2.0', category: 'stack',   notes: 'Push brand colors from appSettings into generated CSS variables at build time. Requires a build step that reads Convex settings and writes CSS custom properties.' },
  { id: 79, title: 'Recurring bookings',                                  status: 'future', priority: 'P3', version: 'v2.0', category: 'commerce', notes: 'One-time bookings only. No recurrence pattern, subscription booking, or series management. Major calendar and conflict-check logic changes required.' },
  { id: 80, title: 'Shop cart — multi-item checkout',                     status: 'future', priority: 'P3', version: 'v2.0', category: 'commerce', notes: 'Each shop item is a standalone Stripe checkout. No multi-item cart. Would require a client-side cart state + Stripe line_items array instead of single Price ID checkout.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTaskById(id: number): DevTask | undefined {
  return TASKS.find((t) => t.id === id);
}

export const STATUS_META: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  'complete':    { label: 'Complete',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'in-progress': { label: 'In Progress', color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500'   },
  'planned':     { label: 'Planned',     color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500'  },
  'tabled':      { label: 'Tabled',      color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500'    },
  'future':      { label: 'Future',      color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400'   },
  'overlooked':  { label: 'Overlooked',  color: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-500'    },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  'P0':   { label: 'P0 — Blocker',  color: 'bg-red-100 text-red-700'       },
  'P1':   { label: 'P1 — High',     color: 'bg-amber-100 text-amber-700'   },
  'P2':   { label: 'P2 — Medium',   color: 'bg-sky-100 text-sky-700'       },
  'P3':   { label: 'P3 — Low',      color: 'bg-slate-100 text-slate-600'   },
  'none': { label: '—',             color: 'bg-transparent text-slate-300' },
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  'stack':         'Stack',
  'auth':          'Auth',
  'analytics':     'Analytics',
  'email':         'Email',
  'payments':      'Payments',
  'admin-ui':      'Admin UI',
  'public-ui':     'Public UI',
  'agents':        'Agents',
  'commerce':      'Commerce',
  'seo':           'SEO',
  'security':      'Security',
  'compliance':    'Compliance',
  'devex':         'Dev Ex',
  'convex':        'Convex',
  'feature-flags': 'Feature Flags',
};
