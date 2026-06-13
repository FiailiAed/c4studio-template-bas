import type { APIRoute } from 'astro';
import { convex } from '@lib/convex';
import { api } from '@convex/api';
import { verifyToken } from '@lib/tokens';

export const GET: APIRoute = async ({ url }) => {
  const contactId = url.searchParams.get('contactId');
  const token = url.searchParams.get('token');

  if (!contactId || !token) {
    return new Response(null, { status: 400 });
  }

  const valid = verifyToken(`unsub:${contactId}`, token);
  if (!valid) {
    return new Response(null, { status: 403 });
  }

  await convex.mutation(api.contacts.optOut, { contactId: contactId as any });

  return new Response(null, {
    status: 302,
    headers: { Location: '/unsubscribed' },
  });
};
