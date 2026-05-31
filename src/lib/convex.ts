import { ConvexHttpClient } from "convex/browser";

const convexUrl = import.meta.env.CONVEX_URL;

if (!convexUrl) {
  throw new Error("CONVEX_URL is not set in environment variables");
}

// Server-side HTTP client for use in Astro SSR frontmatter and API routes.
// Does not support real-time subscriptions — use for one-shot SSR queries only.
export const convex = new ConvexHttpClient(convexUrl);

// Returns an authenticated Convex client scoped to the current request.
// Pass the token from: await Astro.locals.auth().getToken({ template: 'convex' })
export function getAuthedConvex(token: string | null) {
  const client = new ConvexHttpClient(convexUrl);
  if (token) client.setAuth(token);
  return client;
}
