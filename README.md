# Astro Starter Kit: Minimal
```sh
[x] Runtime: Bun [https://bun.sh]
[ ] Framework: Astro (SSR enabled) [https://astro.build]
[ ] Deployment: Vercel (Using edge route handlers, speed insights, and web analytics integration)
[ ] Database & Backend: Convex (Real-time by default, zero config) [https://docs.convex.dev/llms.txt]
[ ] Authentication: Clerk (`@clerk/astro`) [https://clerk.com/docs/astro/getting-started/quickstart]
[ ] Styling: TailwindCSS [https://tailwindcss.com/docs]
[ ] Emails: Resend [https://resend.com/docs/send-with-astro]
[ ] Payments: Stripe (`@convex-dev/stripe`) [https://www.convex.dev/components/stripe/stripe.md]
[ ] Interaction Analytics: PostHog Integration
[ ] Frontend interactivity: TypeScript. State lives in the DOM. NO REACT OR OTHER LIBRARIES.
```

## Outstanding Tasks

### Stack Integrations
```sh
[ ] Resend — email sending (notifications in Settings are wired but nothing sends yet)
[ ] PostHog — interaction analytics (not started)
```

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
[ ] Funnels      — /funnels/[slug]       — public-facing funnel pages
[ ] Shops        — /shops/[slug]         — public-facing shop pages
[ ] Booking Links — /booking-links/[slug] — public-facing booking pages
```
