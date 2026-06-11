import { createHmac } from "crypto";

// CANCEL_SECRET must be set in both Vercel env vars AND Convex env vars with the same value.
// Convex actions generate tokens using process.env.CANCEL_SECRET.
// Astro API routes verify tokens using import.meta.env.CANCEL_SECRET.

function getSecret(): string {
  return (import.meta.env.CANCEL_SECRET as string) ?? "dev-secret-change-in-production";
}

export function signToken(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

// Constant-time comparison to prevent timing attacks
export function verifyToken(payload: string, token: string): boolean {
  const expected = signToken(payload);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}
