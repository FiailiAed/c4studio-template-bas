import type { APIRoute } from 'astro';
import { convex } from '@lib/convex';
import { api } from '@convex/api';
import type { Id } from '@convex/dataModel';

function generateSlots(start: string, end: string, duration: number, buffer: number): string[] {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const endMinutes = endH * 60 + endM;
  const slots: string[] = [];
  let current = startH * 60 + startM;

  while (current + duration <= endMinutes) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += duration + buffer;
  }

  return slots;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const bookingLinkId = url.searchParams.get('bookingLinkId');
  const date = url.searchParams.get('date');

  if (!bookingLinkId || !date) {
    return new Response(JSON.stringify({ error: 'Missing bookingLinkId or date' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const [link, existingBookings] = await Promise.all([
      convex.query(api.bookingLinks.get, { id: bookingLinkId as Id<'bookingLinks'> }),
      convex.query(api.bookings.listByDate, {
        bookingLinkId: bookingLinkId as Id<'bookingLinks'>,
        date,
      }),
    ]);

    if (!link) {
      return new Response(JSON.stringify({ error: 'Booking link not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const duration = link.duration ?? 60;
    const buffer = link.bufferTime ?? 0;
    const start = link.availabilityStart ?? '09:00';
    const end = link.availabilityEnd ?? '17:00';

    const bookedTimes = new Set(
      existingBookings.filter((b) => b.status === 'confirmed').map((b) => b.startTime)
    );

    const availableSlots = generateSlots(start, end, duration, buffer).filter(
      (s) => !bookedTimes.has(s)
    );

    return new Response(JSON.stringify({ availableSlots }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
