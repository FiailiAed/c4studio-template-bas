import { ConvexHttpClient } from "convex/browser";

const convexUrl = import.meta.env.CONVEX_URL;

if (!convexUrl) {
  throw new Error("CONVEX_URL is not set in environment variables");
}

// Server-side HTTP client for use in Astro .astro frontmatter and API routes.
// Does not support real-time subscriptions — use for one-shot SSR queries only.
export const convex = new ConvexHttpClient(convexUrl);
