import type { APIRoute } from 'astro';
import { convex } from '@lib/convex';
import { api } from '@convex/api';
import type { Id } from '@convex/dataModel';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { bookingLinkId, name, email, phone, date, startTime, notes } = body as Record<string, string>;

  if (!bookingLinkId || !name || !email || !date || !startTime) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify the slot is still available
    const existing = await convex.query(api.bookings.listByDate, {
      bookingLinkId: bookingLinkId as Id<'bookingLinks'>,
      date,
    });

    const conflict = existing.some(
      (b) => b.startTime === startTime && b.status === 'confirmed'
    );

    if (conflict) {
      return new Response(JSON.stringify({ error: 'That time slot is no longer available.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await convex.mutation(api.bookings.create, {
      bookingLinkId: bookingLinkId as Id<'bookingLinks'>,
      name,
      email,
      phone: phone || undefined,
      date,
      startTime,
      notes: notes || undefined,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to create booking.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
