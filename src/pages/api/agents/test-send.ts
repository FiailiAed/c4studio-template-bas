import type { APIRoute } from 'astro';
import { getAuthedConvex } from '@lib/convex';
import { api } from '@convex/api';

export const POST: APIRoute = async ({ request, locals }) => {
  const { userId } = locals.auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const token = await locals.auth().getToken({ template: 'convex' });
  const client = getAuthedConvex(token);

  const currentUser = await client.query(api.users.getByClerkId, { clerkId: userId });
  if (!currentUser || currentUser.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { agent, messageKey, testEmail, contactId, bookingId } = body as {
    agent: number;
    messageKey: string;
    testEmail: string;
    contactId?: string;
    bookingId?: string;
  };

  if (!messageKey || !testEmail) {
    return new Response('messageKey and testEmail are required', { status: 400 });
  }

  try {
    let result: { ok: boolean; subject: string; error?: string };

    if (agent === 3) {
      if (!contactId) return new Response('contactId required for agent 3', { status: 400 });
      result = await client.action(api.reactivationActions.testSendReactivation, {
        contactId: contactId as Parameters<typeof api.reactivationActions.testSendReactivation>[0]['contactId'],
        messageKey,
        testEmail,
      });
    } else if (agent === 4) {
      if (!bookingId) return new Response('bookingId required for agent 4', { status: 400 });
      result = await client.action(api.reviewActions.testSendReview, {
        bookingId: bookingId as Parameters<typeof api.reviewActions.testSendReview>[0]['bookingId'],
        messageKey,
        testEmail,
      });
    } else if (agent === 5) {
      result = await client.action(api.nurturingActions.testSendNurturing, {
        messageKey,
        testEmail,
        contactId: contactId as Parameters<typeof api.nurturingActions.testSendNurturing>[0]['contactId'],
        bookingId: bookingId as Parameters<typeof api.nurturingActions.testSendNurturing>[0]['bookingId'],
      });
    } else {
      return new Response('Invalid agent', { status: 400 });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ ok: false, subject: '', error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
