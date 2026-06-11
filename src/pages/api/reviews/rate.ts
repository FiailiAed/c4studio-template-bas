import type { APIRoute } from 'astro';
import { convex } from '@lib/convex';
import { api } from '@convex/api';
import { verifyToken } from '@lib/tokens';
import type { Id } from '@convex/dataModel';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('bookingId');
  const token = url.searchParams.get('token');
  const ratingRaw = url.searchParams.get('rating');
  const rating = parseInt(ratingRaw ?? '', 10);

  const redirect = (path: string) =>
    new Response(null, { status: 302, headers: { Location: path } });

  if (!bookingId || !token || isNaN(rating) || rating < 1 || rating > 5) {
    return redirect('/reviews/rated?error=invalid');
  }

  const valid = verifyToken(`rev:${bookingId}:${rating}`, token);
  if (!valid) {
    return redirect('/reviews/rated?error=invalid');
  }

  try {
    // Route to R2 (high rating) or R3 (low rating)
    const messageKey = rating >= 4 ? 'r2' : 'r3';
    await convex.mutation(api.reviews.triggerMessageForBooking, {
      bookingId: bookingId as Id<'bookings'>,
      messageKey,
    });
    return redirect(`/reviews/rated?rating=${rating}`);
  } catch {
    return redirect('/reviews/rated?error=failed');
  }
};
