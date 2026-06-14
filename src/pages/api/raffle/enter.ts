import type { APIRoute } from 'astro';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@convex/api';
import { verifyToken } from '@lib/tokens';

export const GET: APIRoute = async ({ url, redirect }) => {
  const raffleId = url.searchParams.get('raffleId') ?? '';
  const contactId = url.searchParams.get('contactId') ?? '';
  const token = url.searchParams.get('token') ?? '';

  if (!raffleId || !contactId || !token) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // Verify the HMAC token
  const valid = verifyToken(`raffle:${raffleId}:${contactId}`, token);
  if (!valid) {
    return new Response('Invalid or expired token', { status: 403 });
  }

  const convex = new ConvexHttpClient(import.meta.env.CONVEX_URL as string);

  let result: string;
  try {
    result = await convex.mutation(api.raffles.enterRaffle, {
      raffleId: raffleId as any,
      contactId,
      entryMethod: 'email_click',
      entryWeight: 1,
    });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }

  if (result === 'not_found' || result === 'closed') {
    return new Response('This raffle is no longer accepting entries', { status: 404 });
  }

  if (result === 'duplicate') {
    return redirect('/raffle/entered?already=true');
  }

  return redirect('/raffle/entered');
};
